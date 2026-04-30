import SwiftUI
import CallKit

/// Phase 4b home screen. Mirrors apps/web/src/pages/app/home.astro:
/// narrative hero with personal stats, pending reports progress, and a
/// recent-corroboration ledger sidebar (stacked on phone).
///
/// Sync block list moves here as a quiet status row at the top — Phase 4b
/// makes block list refresh ambient (BGAppRefreshTask in task 13). Until
/// that's wired, the row is tappable to force a manual sync.
struct HomeView: View {
    @State private var stats: MyStatsResponse?
    @State private var pending: [PendingReport] = []
    @State private var network: NetworkStatsResponse?
    @State private var loadError: String?
    @State private var isRefreshing = false
    @State private var lastSync: ContentView.LastSyncDisplay?
    @State private var showingReport = false
    @State private var showingSettings = false

    private static let extensionBundleId = "com.lighthouse27.ringdocket.blocklist"

    var body: some View {
        ZStack {
            Brand.Color.surfacePaper.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    headerBar
                    syncRow
                    hero
                    pendingSection
                    networkLedger
                    Spacer(minLength: 12)
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 24)
            }
            .refreshable { await loadAll() }
        }
        .task { await loadAll() }
        .sheet(isPresented: $showingReport) {
            ReportView()
                .onDisappear {
                    Task { await loadAll() }
                }
        }
        .sheet(isPresented: $showingSettings) {
            SettingsView()
        }
        .overlay(alignment: .bottom) {
            reportFAB
                .padding(.horizontal, 24)
                .padding(.bottom, 16)
        }
    }

    // MARK: - Sections

    private var headerBar: some View {
        HStack {
            HStack(spacing: 0) {
                Text("Ringdocket")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(Brand.Color.inkPrimary)
                Text(".")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(Brand.Color.accentSignal)
            }
            Spacer()
            Button {
                showingSettings = true
            } label: {
                Image(systemName: "gearshape")
                    .font(.system(size: 18, weight: .regular))
                    .foregroundStyle(Brand.Color.inkSecondary)
            }
        }
    }

    private var syncRow: some View {
        Button(action: handleSync) {
            HStack(spacing: 10) {
                Circle()
                    .fill(lastSync == nil ? Brand.Color.mutedPending : Brand.Color.signalCorroborated)
                    .frame(width: 8, height: 8)

                VStack(alignment: .leading, spacing: 2) {
                    Text(lastSync == nil ? "Block list — never synced" : "Block list active")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Brand.Color.inkPrimary)
                    if let last = lastSync {
                        // Show only freshness here. The canonical "numbers on
                        // the list" count lives in the network ledger footer
                        // — it's the live network total. The local snapshot
                        // count can drift from network when numbers retire
                        // between syncs, which made the two displayed values
                        // look like a bug.
                        Text("Synced \(last.relative)")
                            .font(.system(.caption2, design: .monospaced))
                            .foregroundStyle(Brand.Color.inkByline)
                    } else {
                        Text("Tap to sync now")
                            .font(.system(.caption2, design: .monospaced))
                            .foregroundStyle(Brand.Color.inkByline)
                    }
                }

                Spacer()

                if isRefreshing {
                    ProgressView()
                        .controlSize(.small)
                } else {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Brand.Color.inkByline)
                }
            }
            .padding(.vertical, 12)
            .padding(.horizontal, 14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Brand.Color.surfaceInset)
            .clipShape(RoundedRectangle(cornerRadius: 6))
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var hero: some View {
        if let stats {
            VStack(alignment: .leading, spacing: 14) {
                Text("This week")
                    .font(.system(size: 11, weight: .medium))
                    .tracking(1.2)
                    .foregroundStyle(Brand.Color.inkByline)
                    .textCase(.uppercase)

                Text(headlineText(for: stats))
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(Brand.Color.inkPrimary)
                    .lineSpacing(2)

                Text(subheadText(for: stats))
                    .font(.system(size: 15))
                    .foregroundStyle(Brand.Color.inkSecondary)
                    .lineSpacing(3)

                statsStrip(stats)
            }
        } else if let loadError {
            Text("Couldn't load your stats: \(loadError)")
                .font(.system(size: 14))
                .foregroundStyle(Brand.Color.destructive)
        } else {
            heroSkeleton
        }
    }

    private func statsStrip(_ stats: MyStatsResponse) -> some View {
        HStack(spacing: 0) {
            statItem(label: "ALL-TIME", value: stats.reportsAllTime.formatted())
            divider
            statItem(label: "THIS WEEK", value: "\(stats.reportsThisWeek)")
            divider
            statItem(
                label: "FIRST-FLAG",
                value: "\(stats.firstFlagCredits)",
                showDot: true
            )
        }
        .padding(.top, 12)
        .overlay(alignment: .top) {
            Rectangle()
                .fill(Brand.Color.rule)
                .frame(height: 1)
        }
    }

    private var divider: some View {
        Rectangle()
            .fill(Brand.Color.ruleSubtle)
            .frame(width: 1)
            .padding(.vertical, 4)
    }

    private func statItem(label: String, value: String, showDot: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                if showDot {
                    Circle()
                        .fill(Brand.Color.accentSignal)
                        .frame(width: 5, height: 5)
                }
                Text(label)
                    .font(.system(size: 10, weight: .medium))
                    .tracking(0.8)
                    .foregroundStyle(Brand.Color.inkByline)
            }
            Text(value)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(Brand.Color.inkPrimary)
        }
        .padding(.horizontal, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private var pendingSection: some View {
        if !pending.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                sectionTitle("PENDING")

                VStack(spacing: 0) {
                    ForEach(pending.prefix(5)) { row in
                        pendingRow(row)
                        if row.id != pending.prefix(5).last?.id {
                            Rectangle()
                                .fill(Brand.Color.ruleSubtle)
                                .frame(height: 1)
                        }
                    }
                }
                .padding(.vertical, 4)
                .padding(.horizontal, 14)
                .background(Brand.Color.surfaceRaised)
                .overlay(RoundedRectangle(cornerRadius: 6).stroke(Brand.Color.rule, lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: 6))
            }
        }
    }

    private func pendingRow(_ row: PendingReport) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(formatPhone(row.number))
                    .font(.system(.callout, design: .monospaced))
                    .foregroundStyle(Brand.Color.inkPrimary)
                Spacer()
                Text("\(row.corroborationCount) of \(row.threshold)")
                    .font(.system(.caption, design: .monospaced))
                    .foregroundStyle(Brand.Color.inkSecondary)
            }
            ProgressView(
                value: Double(min(row.corroborationCount, row.threshold)),
                total: Double(row.threshold)
            )
            .tint(Brand.Color.signalCorroborated)
            Text("Expires \(relativeFromIso(row.expiresAt))")
                .font(.system(.caption2, design: .monospaced))
                .foregroundStyle(Brand.Color.inkByline)
        }
        .padding(.vertical, 10)
    }

    @ViewBuilder
    private var networkLedger: some View {
        if let network {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    sectionTitle("NETWORK LEDGER")
                    Spacer()
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Brand.Color.signalCorroborated)
                            .frame(width: 5, height: 5)
                        Text("LIVE")
                            .font(.system(size: 10, weight: .medium))
                            .tracking(0.8)
                            .foregroundStyle(Brand.Color.inkByline)
                    }
                }

                VStack(spacing: 0) {
                    ForEach(network.recentCorroborated) { row in
                        ledgerRow(row)
                        if row.id != network.recentCorroborated.last?.id {
                            Rectangle()
                                .fill(Brand.Color.ruleSubtle)
                                .frame(height: 1)
                        }
                    }
                }
                .padding(.vertical, 4)
                .padding(.horizontal, 14)
                .background(Brand.Color.surfaceRaised)
                .overlay(RoundedRectangle(cornerRadius: 6).stroke(Brand.Color.rule, lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: 6))

                Text("\(network.totalCorroborated.formatted()) numbers on the public block list across \(network.totalActiveCampaigns) active campaigns. \(network.newThisWeek) added this week.")
                    .font(.system(.caption2, design: .monospaced))
                    .foregroundStyle(Brand.Color.inkByline)
                    .lineSpacing(2)
            }
        }
    }

    private func ledgerRow(_ row: RecentCorroboratedNumber) -> some View {
        HStack(alignment: .center, spacing: 10) {
            VStack(alignment: .leading, spacing: 3) {
                Text(formatPhone(row.phone))
                    .font(.system(.callout, design: .monospaced))
                    .foregroundStyle(Brand.Color.inkMono)
                if let name = row.campaignName {
                    Text(name)
                        .font(.system(size: 12))
                        .foregroundStyle(Brand.Color.inkByline)
                        .lineLimit(1)
                }
            }
            Spacer()
            HStack(spacing: 4) {
                Circle()
                    .fill(Brand.Color.signalCorroborated)
                    .frame(width: 5, height: 5)
                Text(row.corroboratedAt.flatMap(relativeFromIso) ?? "—")
                    .font(.system(.caption2, design: .monospaced))
                    .foregroundStyle(Brand.Color.inkSecondary)
            }
        }
        .padding(.vertical, 10)
    }

    private var heroSkeleton: some View {
        VStack(alignment: .leading, spacing: 12) {
            RoundedRectangle(cornerRadius: 3).fill(Brand.Color.surfaceInset).frame(width: 90, height: 12)
            RoundedRectangle(cornerRadius: 3).fill(Brand.Color.surfaceInset).frame(maxWidth: .infinity, minHeight: 32)
            RoundedRectangle(cornerRadius: 3).fill(Brand.Color.surfaceInset).frame(width: 220, height: 32)
            RoundedRectangle(cornerRadius: 3).fill(Brand.Color.surfaceInset).frame(maxWidth: .infinity, minHeight: 16)
        }
        .padding(.top, 4)
    }

    private var reportFAB: some View {
        Button(action: { showingReport = true }) {
            HStack(spacing: 8) {
                Image(systemName: "plus")
                    .font(.system(size: 14, weight: .bold))
                Text("Report a call")
                    .font(.system(size: 15, weight: .medium))
            }
            .foregroundStyle(Brand.Color.surfacePaper)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(Brand.Color.inkPrimary)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .shadow(color: Brand.Color.inkPrimary.opacity(0.25), radius: 8, y: 4)
        }
    }

    // MARK: - Logic

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 11, weight: .medium))
            .tracking(0.8)
            .foregroundStyle(Brand.Color.inkByline)
    }

    private func headlineText(for stats: MyStatsResponse) -> String {
        if stats.reportsAllTime == 0 && stats.pendingCount == 0 {
            return "Welcome to the ledger. Your work starts with a single flag."
        }
        if stats.reportsThisWeek == 0 && stats.pendingCount > 0 {
            let n = stats.pendingCount
            return "\(n) report\(n == 1 ? "" : "s") pending corroboration."
        }
        let n = stats.reportsThisWeek
        return "This week you flagged \(n) number\(n == 1 ? "" : "s")."
    }

    private func subheadText(for stats: MyStatsResponse) -> String {
        // Narrative-leads-stats: prose first. The bottom stats strip is the
        // canonical numeric record — the subhead is the editorial voice.
        if stats.reportsAllTime == 0 && stats.pendingCount == 0 {
            return "Submit a report. If two more accounts flag the same number within 14 days, it lands on the public block list — and stops ringing for every Ringdocket user."
        }
        if stats.reportsAllTime == 0 && stats.pendingCount > 0 {
            return "Two more accounts flagging the same number within 14 days promotes it to the public block list. Every flag stays on the record either way."
        }
        if let cat = stats.topCategory {
            let category = prettifyCategory(cat).lowercased()
            return "Most of your reports this week tag the \(category) ring. Every flag stays on the public record, cited by campaign and carrier."
        }
        return "Every flag stays on the public record, cited by campaign and carrier path."
    }

    private func prettifyCategory(_ raw: String) -> String {
        raw.split(separator: "_").map { $0.prefix(1).uppercased() + $0.dropFirst() }.joined(separator: " ")
    }

    private func formatPhone(_ e164: String) -> String {
        let digits = e164.filter(\.isNumber)
        guard digits.count == 11, digits.first == "1" else { return e164 }
        let area = digits.dropFirst().prefix(3)
        let mid = digits.dropFirst(4).prefix(3)
        let last = digits.suffix(4)
        return "(\(area)) \(mid)-\(last)"
    }

    private func relativeFromIso(_ iso: String) -> String? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = formatter.date(from: iso)
            ?? ISO8601DateFormatter().date(from: iso)
        guard let date else { return nil }
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .short
        return f.localizedString(for: date, relativeTo: Date())
    }

    @MainActor
    private func loadAll() async {
        loadError = nil
        async let s = APIClient.shared.myStats()
        async let p = APIClient.shared.myPendingReports()
        async let n = APIClient.shared.networkStats()
        do {
            stats = try await s
            pending = (try await p).reports
            network = try await n
        } catch {
            loadError = error.localizedDescription
        }

        if let last = await BlockListSync.shared.lastSync() {
            let f = RelativeDateTimeFormatter()
            f.unitsStyle = .short
            lastSync = ContentView.LastSyncDisplay(
                version: last.version,
                numberCount: last.numberCount,
                relative: f.localizedString(for: last.syncedAt, relativeTo: Date())
            )
        }
    }

    private func handleSync() {
        guard !isRefreshing else { return }
        isRefreshing = true
        Task {
            do {
                let result = try await BlockListSync.shared.downloadAndStore()
                try await reloadCallDirectoryExtension(identifier: Self.extensionBundleId)
                _ = result
                if let last = await BlockListSync.shared.lastSync() {
                    let f = RelativeDateTimeFormatter()
                    f.unitsStyle = .short
                    await MainActor.run {
                        lastSync = ContentView.LastSyncDisplay(
                            version: last.version,
                            numberCount: last.numberCount,
                            relative: f.localizedString(for: last.syncedAt, relativeTo: Date())
                        )
                    }
                }
            } catch {
                await MainActor.run { loadError = error.localizedDescription }
            }
            await MainActor.run { isRefreshing = false }
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
    HomeView()
}
