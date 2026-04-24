import CallKit
import Foundation
import os.log

/// iOS Call Directory Extension entry point. iOS spawns this extension
/// in a separate, sandboxed process when the user enables Ringdocket
/// under Settings → Phone → Call Blocking & Identification, and again
/// every time the host app calls `CXCallDirectoryManager.reloadExtension`.
///
/// Constraints:
///   - addBlockingEntry expects E.164 numbers as Int64, sorted ascending
///   - duplicate adds raise an "out of order" error → terminates the
///     reload and ALL prior adds are discarded
///   - memory ceiling is tight (~12MB resident); for 24k entries we're
///     fine, but a 100k+ list needs incremental load via
///     `addBlockingEntry(withNextSequentialPhoneNumber:)` in chunks
///     wrapped in autoreleasepool
class CallDirectoryHandler: CXCallDirectoryProvider {

    private let logger = Logger(subsystem: "com.lighthouse27.ringdocket.blocklist", category: "CallDirectory")

    override func beginRequest(with context: CXCallDirectoryExtensionContext) {
        context.delegate = self

        if context.isIncremental {
            // Reset between reloads — we do full snapshots, not deltas.
            // V2 can switch to incremental once the deltas pipeline ships.
            // For now treat any reload as a full rebuild.
            context.removeAllBlockingEntries()
        }

        do {
            try addBlockingEntries(to: context)
            context.completeRequest()
        } catch {
            logger.error("Block list ingestion failed: \(error.localizedDescription, privacy: .public)")
            // completeRequest is still required — failure handler runs.
            context.completeRequest()
        }
    }

    private func addBlockingEntries(to context: CXCallDirectoryExtensionContext) throws {
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: BlockListPaths.appGroupId
        ) else {
            logger.error("App Group container missing")
            return
        }

        let payloadURL = containerURL.appendingPathComponent(BlockListPaths.payloadFilename)
        guard FileManager.default.fileExists(atPath: payloadURL.path) else {
            logger.notice("No block list payload yet — first run before app sync")
            return
        }

        let data = try Data(contentsOf: payloadURL)
        let payload = try JSONDecoder().decode(BlockListPayload.self, from: data)

        // Convert E.164 strings to Int64. iOS strips the leading '+' from
        // the addBlockingEntry argument (the number is stored as the
        // numeric value with country code prefixed).
        let numericValues: [Int64] = payload.numbers
            .compactMap { phone in
                let digits = phone.replacingOccurrences(of: "+", with: "")
                return Int64(digits)
            }
            .sorted()

        logger.notice("Adding \(numericValues.count, privacy: .public) blocked entries")

        autoreleasepool {
            for value in numericValues {
                context.addBlockingEntry(withNextSequentialPhoneNumber: value)
            }
        }
    }
}

extension CallDirectoryHandler: CXCallDirectoryExtensionContextDelegate {
    func requestFailed(for extensionContext: CXCallDirectoryExtensionContext, withError error: Error) {
        logger.error("Call Directory request failed: \(error.localizedDescription, privacy: .public)")
    }
}

private enum BlockListPaths {
    static let appGroupId = "group.com.lighthouse27.ringdocket"
    static let payloadFilename = "blocklist.json"
}

private struct BlockListPayload: Codable {
    let version: String
    let generatedAt: String
    let numbers: [String]
}
