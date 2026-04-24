import Foundation

/// Downloads the current Ringdocket block list manifest + payload, writes
/// the payload JSON into the shared App Group container so the Call
/// Directory Extension can read it.
///
/// Manifest at https://blocklist.ringdocket.com/current.json points at
/// the dated payload (e.g. v20260424.json). The extension itself reads
/// the payload, sorts numbers, and calls
/// CXCallDirectoryExtensionContext.addBlockingEntry(...).
///
/// Why two files: the manifest is small + cacheable, the payload is the
/// authoritative number list. We could one-shot it but the manifest
/// version + checksum are useful for "last synced" UX in the app.
actor BlockListSync {
    static let shared = BlockListSync()

    static let appGroupId = "group.com.lighthouse27.ringdocket"
    static let payloadFilename = "blocklist.json"
    static let lastSyncFilename = "last-sync.json"

    private let manifestURL = URL(string: "https://blocklist.ringdocket.com/current.json")!

    private init() {}

    struct SyncResult {
        let version: String
        let numberCount: Int
        let bytesWritten: Int
        let durationMs: Int
    }

    struct Manifest: Codable {
        let version: String
        let generatedAt: String
        let numberCount: Int
        let fileUrl: String
        let fileChecksum: String
    }

    enum SyncError: LocalizedError {
        case appGroupContainerMissing
        case manifestDecode
        case payloadFetchFailed(Int)

        var errorDescription: String? {
            switch self {
            case .appGroupContainerMissing:
                return "App Group container missing — check Xcode capabilities and entitlements."
            case .manifestDecode:
                return "Couldn't read the block list manifest."
            case .payloadFetchFailed(let status):
                return "Block list download failed (HTTP \(status))."
            }
        }
    }

    func downloadAndStore() async throws -> SyncResult {
        let started = Date()

        // 1. Manifest
        let (manifestData, _) = try await URLSession.shared.data(from: manifestURL)
        guard let manifest = try? JSONDecoder().decode(Manifest.self, from: manifestData) else {
            throw SyncError.manifestDecode
        }

        // 2. Payload — follow the manifest's fileUrl rather than guessing.
        guard let payloadURL = URL(string: manifest.fileUrl) else {
            throw SyncError.manifestDecode
        }
        let (payloadData, payloadResponse) = try await URLSession.shared.data(from: payloadURL)
        if let http = payloadResponse as? HTTPURLResponse, http.statusCode != 200 {
            throw SyncError.payloadFetchFailed(http.statusCode)
        }

        // 3. Write into App Group container
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: Self.appGroupId
        ) else {
            throw SyncError.appGroupContainerMissing
        }
        let payloadDest = containerURL.appendingPathComponent(Self.payloadFilename)
        try payloadData.write(to: payloadDest, options: .atomic)

        // 4. Stash the manifest + sync timestamp for "last synced" UX
        struct LastSync: Codable {
            let version: String
            let numberCount: Int
            let syncedAt: String
        }
        let lastSync = LastSync(
            version: manifest.version,
            numberCount: manifest.numberCount,
            syncedAt: ISO8601DateFormatter().string(from: Date())
        )
        let lastSyncDest = containerURL.appendingPathComponent(Self.lastSyncFilename)
        try JSONEncoder().encode(lastSync).write(to: lastSyncDest, options: .atomic)

        let elapsedMs = Int(Date().timeIntervalSince(started) * 1000)
        return SyncResult(
            version: manifest.version,
            numberCount: manifest.numberCount,
            bytesWritten: payloadData.count,
            durationMs: elapsedMs
        )
    }

    /// Reads the last-sync metadata if any. Returns nil if never synced.
    func lastSync() -> (version: String, numberCount: Int, syncedAt: Date)? {
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: Self.appGroupId
        ) else { return nil }
        let lastSyncURL = containerURL.appendingPathComponent(Self.lastSyncFilename)
        guard let data = try? Data(contentsOf: lastSyncURL) else { return nil }
        struct LastSync: Codable {
            let version: String
            let numberCount: Int
            let syncedAt: String
        }
        guard let decoded = try? JSONDecoder().decode(LastSync.self, from: data) else { return nil }
        let date = ISO8601DateFormatter().date(from: decoded.syncedAt) ?? Date()
        return (decoded.version, decoded.numberCount, date)
    }
}
