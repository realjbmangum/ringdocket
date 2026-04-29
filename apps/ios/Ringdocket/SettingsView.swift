import SwiftUI
import CallKit

/// Account, block list controls, billing deep-link, and legal.
///
/// Billing/subscription stays on the web (Stripe Customer Portal) until
/// Apple IAP / RevenueCat ships. The "Manage subscription" button opens
/// app.ringdocket.com/app/settings in Safari, where the existing web
/// flow handles the portal redirect.
struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var auth = AuthSession.shared

    @State private var lastSync: BlockListLastSync?
    @State private var syncing = false
    @State private var syncError: String?
    @State private var showSignOutConfirm = false

    private static let extensionBundleId = "com.lighthouse27.ringdocket.blocklist"
    private let webBase = URL(string: "https://app.ringdocket.com")!
    private let marketingBase = URL(string: "https://ringdocket.com")!

    struct BlockListLastSync {
        let version: String
        let numberCount: Int
        let relative: String
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Brand.Color.surfacePaper.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        section(title: "ACCOUNT") {
                            row(
                                label: "Signed in as",
                                value: signedInEmail ?? "—"
                            )
                        }

                        section(title: "BLOCK LIST") {
                            blockListBody
                        }

                        section(title: "SUBSCRIPTION") {
                            link(
                                label: "Manage billing",
                                detail: "Opens the web portal",
                                url: webBase.appendingPathComponent("/app/settings")
                            )
                        }

                        section(title: "PREFERENCES") {
                            link(
                                label: "Email preferences",
                                detail: "Weekly digest, monthly impact",
                                url: webBase.appendingPathComponent("/app/settings")
                            )
                        }

                        section(title: "SUPPORT") {
                            link(
                                label: "Report an error / delist",
                                detail: "Wrongly flagged number?",
                                url: marketingBase.appendingPathComponent("/report-an-error")
                            )
                        }

                        signOutButton

                        appFooter
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 24)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Settings")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Brand.Color.inkPrimary)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(Brand.Color.inkPrimary)
                }
            }
            .confirmationDialog(
                "Sign out of Ringdocket?",
                isPresented: $showSignOutConfirm,
                titleVisibility: .visible
            ) {
                Button("Sign out", role: .destructive) {
                    auth.signOut()
                    dismiss()
                }
                Button("Cancel", role: .cancel) {}
            }
        }
        .task { await refreshLastSync() }
    }

    // MARK: - Sections

    @ViewBuilder
    private var blockListBody: some View {
        VStack(spacing: 0) {
            HStack(alignment: .top, spacing: 10) {
                Circle()
                    .fill(lastSync == nil ? Brand.Color.mutedPending : Brand.Color.signalCorroborated)
                    .frame(width: 8, height: 8)
                    .padding(.top, 6)
                VStack(alignment: .leading, spacing: 4) {
                    Text(lastSync == nil ? "Never synced" : "\(lastSync!.numberCount.formatted()) numbers active")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Brand.Color.inkPrimary)
                    if let last = lastSync {
                        Text("v\(last.version) · synced \(last.relative)")
                            .font(.system(.caption2, design: .monospaced))
                            .foregroundStyle(Brand.Color.inkByline)
                    }
                    Text("Auto-refresh runs in the background once iOS allows.")
                        .font(.system(size: 12))
                        .foregroundStyle(Brand.Color.inkSecondary)
                        .padding(.top, 2)
                }
                Spacer()
            }
            .padding(.vertical, 12)

            rowDivider

            Button(action: handleManualSync) {
                HStack {
                    Text(syncing ? "Syncing…" : "Sync now")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Brand.Color.inkPrimary)
                    Spacer()
                    if syncing {
                        ProgressView().controlSize(.small)
                    } else {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Brand.Color.inkByline)
                    }
                }
                .padding(.vertical, 14)
            }
            .disabled(syncing)

            if let syncError {
                Text(syncError)
                    .font(.system(size: 12))
                    .foregroundStyle(Brand.Color.destructive)
                    .padding(.bottom, 8)
            }
        }
    }

    private var signOutButton: some View {
        Button(action: { showSignOutConfirm = true }) {
            Text("Sign out")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(Brand.Color.destructive)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
        }
        .overlay(RoundedRectangle(cornerRadius: 6).stroke(Brand.Color.rule, lineWidth: 1))
        .padding(.top, 8)
    }

    private var appFooter: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Ringdocket v\(appVersion) (\(buildNumber))")
                .font(.system(.caption2, design: .monospaced))
                .foregroundStyle(Brand.Color.inkByline)
            Text("LIGHTHOUSE 27 LLC")
                .font(.system(size: 10, weight: .medium))
                .tracking(0.6)
                .foregroundStyle(Brand.Color.inkByline)
                .textCase(.uppercase)
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(.top, 16)
    }

    // MARK: - Building blocks

    private func section<Content: View>(
        title: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 11, weight: .medium))
                .tracking(0.8)
                .foregroundStyle(Brand.Color.inkByline)
            VStack(spacing: 0) {
                content()
            }
            .padding(.horizontal, 14)
            .background(Brand.Color.surfaceRaised)
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(Brand.Color.rule, lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 6))
        }
    }

    private func row(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 14))
                .foregroundStyle(Brand.Color.inkSecondary)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(Brand.Color.inkPrimary)
                .lineLimit(1)
                .truncationMode(.middle)
        }
        .padding(.vertical, 14)
    }

    private func link(label: String, detail: String?, url: URL) -> some View {
        Link(destination: url) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(label)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Brand.Color.inkPrimary)
                    if let detail {
                        Text(detail)
                            .font(.system(size: 12))
                            .foregroundStyle(Brand.Color.inkSecondary)
                    }
                }
                Spacer()
                Image(systemName: "arrow.up.right")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(Brand.Color.inkByline)
            }
            .padding(.vertical, 14)
        }
    }

    private var rowDivider: some View {
        Rectangle()
            .fill(Brand.Color.ruleSubtle)
            .frame(height: 1)
    }

    // MARK: - Logic

    private var signedInEmail: String? {
        if case .signedIn(_, let email) = auth.state { return email }
        return nil
    }

    private var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0"
    }

    private var buildNumber: String {
        Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "0"
    }

    private func handleManualSync() {
        guard !syncing else { return }
        syncError = nil
        syncing = true
        Task {
            do {
                _ = try await BlockListSync.shared.downloadAndStore()
                try await reloadCallDirectoryExtension(identifier: Self.extensionBundleId)
                await refreshLastSync()
            } catch {
                syncError = error.localizedDescription
            }
            syncing = false
        }
    }

    private func refreshLastSync() async {
        if let last = await BlockListSync.shared.lastSync() {
            let f = RelativeDateTimeFormatter()
            f.unitsStyle = .short
            await MainActor.run {
                lastSync = BlockListLastSync(
                    version: last.version,
                    numberCount: last.numberCount,
                    relative: f.localizedString(for: last.syncedAt, relativeTo: Date())
                )
            }
        }
    }

    private func reloadCallDirectoryExtension(identifier: String) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            CXCallDirectoryManager.sharedInstance.reloadExtension(withIdentifier: identifier) { error in
                if let error { continuation.resume(throwing: error) }
                else { continuation.resume() }
            }
        }
    }
}

#Preview {
    SettingsView()
}
