import SwiftUI
import CallKit

/// Phase 4a MVP UI: one screen, one button. Tap to sync the current
/// block list and reload the Call Directory Extension. Status text
/// reports the outcome.
///
/// Phase 4b layers in: auth, narrative hero with personal stats, report
/// flow, my-impact timeline. Until then this is purely "prove blocking
/// works on a real iPhone."
struct ContentView: View {
    private static let extensionBundleId = "com.lighthouse27.ringdocket.blocklist"

    @State private var status: SyncStatus = .idle
    @State private var lastSync: LastSyncDisplay?
    @State private var showingReport = false

    enum SyncStatus: Equatable {
        case idle
        case syncing(stage: String)
        case ok(numberCount: Int, version: String)
        case error(message: String)
    }

    struct LastSyncDisplay {
        let version: String
        let numberCount: Int
        let relative: String
    }

    var body: some View {
        ZStack {
            Brand.Color.surfacePaper.ignoresSafeArea()

            VStack(alignment: .leading, spacing: 32) {
                wordmark

                VStack(alignment: .leading, spacing: 16) {
                    Text("Phase 4a")
                        .font(.system(size: 11, weight: .medium))
                        .tracking(1.2)
                        .foregroundStyle(Brand.Color.accentSignal)
                        .textCase(.uppercase)

                    Text("Get the list on this phone.")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(Brand.Color.inkPrimary)

                    Text("Tap sync. Ringdocket downloads the current block list, hands it to iOS, and listed numbers stop ringing — including 24,000+ corroborated spam numbers from the FTC feed and our user reports.")
                        .font(.system(size: 16))
                        .foregroundStyle(Brand.Color.inkSecondary)
                        .lineSpacing(4)
                }

                statusBlock

                Spacer()

                reportButton

                syncButton

                lastSyncFooter
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 32)
        }
        .task {
            await refreshLastSync()
        }
        .sheet(isPresented: $showingReport) {
            ReportView()
        }
    }

    // MARK: - Subviews

    private var wordmark: some View {
        HStack(spacing: 0) {
            Text("Ringdocket")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(Brand.Color.inkPrimary)
            Text(".")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(Brand.Color.accentSignal)
        }
    }

    private var statusBlock: some View {
        VStack(alignment: .leading, spacing: 6) {
            switch status {
            case .idle:
                Text(lastSync == nil ? "No sync yet." : "Ready to resync.")
                    .font(.system(size: 14))
                    .foregroundStyle(Brand.Color.inkByline)

            case .syncing(let stage):
                HStack(spacing: 8) {
                    ProgressView()
                        .controlSize(.small)
                    Text(stage)
                        .font(.system(size: 14))
                        .foregroundStyle(Brand.Color.inkSecondary)
                }

            case .ok(let count, let version):
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Brand.Color.signalCorroborated)
                            .frame(width: 8, height: 8)
                        Text("Synced and active")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(Brand.Color.signalCorroborated)
                    }
                    Text("\(count.formatted()) numbers · v\(version)")
                        .font(.system(.caption, design: .monospaced))
                        .foregroundStyle(Brand.Color.inkByline)
                }

            case .error(let msg):
                Text(msg)
                    .font(.system(size: 14))
                    .foregroundStyle(Brand.Color.destructive)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 14)
        .padding(.horizontal, 16)
        .background(Brand.Color.surfaceInset)
        .clipShape(RoundedRectangle(cornerRadius: 6))
    }

    private var reportButton: some View {
        Button(action: { showingReport = true }) {
            Text("Report a call")
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Brand.Color.surfacePaper)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
        }
        .background(Brand.Color.inkPrimary)
        .clipShape(RoundedRectangle(cornerRadius: 6))
    }

    private var syncButton: some View {
        Button(action: handleSync) {
            HStack {
                if case .syncing = status {
                    Text("Syncing…")
                } else {
                    Text("Sync block list")
                }
            }
            .font(.system(size: 14, weight: .medium))
            .foregroundStyle(Brand.Color.inkPrimary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
        }
        .overlay(RoundedRectangle(cornerRadius: 6).stroke(Brand.Color.rule, lineWidth: 1))
        .disabled({ if case .syncing = status { return true } else { return false } }())
    }

    private var lastSyncFooter: some View {
        Group {
            if let last = lastSync {
                Text("Last synced \(last.relative) — v\(last.version), \(last.numberCount.formatted()) numbers.")
                    .font(.system(.caption2, design: .monospaced))
                    .foregroundStyle(Brand.Color.inkByline)
            } else {
                Text("Permission: Settings → Phone → Call Blocking & Identification → enable Ringdocket")
                    .font(.system(.caption2, design: .monospaced))
                    .foregroundStyle(Brand.Color.inkByline)
            }
        }
    }

    // MARK: - Actions

    private func handleSync() {
        status = .syncing(stage: "Downloading…")

        Task {
            do {
                let result = try await BlockListSync.shared.downloadAndStore()
                await MainActor.run {
                    status = .syncing(stage: "Reloading extension…")
                }

                try await reloadCallDirectoryExtension(identifier: Self.extensionBundleId)

                let enabledStatus = try await callDirectoryEnabledStatus(identifier: Self.extensionBundleId)

                await MainActor.run {
                    if enabledStatus == .enabled {
                        status = .ok(numberCount: result.numberCount, version: result.version)
                    } else {
                        status = .error(
                            message: "Synced \(result.numberCount.formatted()) numbers, but the extension is disabled in iOS Settings → Phone → Call Blocking & Identification."
                        )
                    }
                }

                await refreshLastSync()
            } catch {
                await MainActor.run {
                    status = .error(message: error.localizedDescription)
                }
            }
        }
    }

    private func refreshLastSync() async {
        if let last = await BlockListSync.shared.lastSync() {
            await MainActor.run {
                lastSync = LastSyncDisplay(
                    version: last.version,
                    numberCount: last.numberCount,
                    relative: relativeTime(from: last.syncedAt)
                )
            }
        }
    }

    private func relativeTime(from date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter.localizedString(for: date, relativeTo: Date())
    }

    private func reloadCallDirectoryExtension(identifier: String) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            CXCallDirectoryManager.sharedInstance.reloadExtension(withIdentifier: identifier) { error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume()
                }
            }
        }
    }

    private func callDirectoryEnabledStatus(identifier: String) async throws -> CXCallDirectoryManager.EnabledStatus {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<CXCallDirectoryManager.EnabledStatus, Error>) in
            CXCallDirectoryManager.sharedInstance.getEnabledStatusForExtension(withIdentifier: identifier) { status, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: status)
                }
            }
        }
    }
}

#Preview {
    ContentView()
}
