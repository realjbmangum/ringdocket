import SwiftUI

/// Phase 4b primary value screen: tap, type the number, pick category,
/// submit. Posts to /api/report with the user's JWT.
struct ReportView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var rawPhone: String = ""
    @State private var category: ScamCategory = .unknown
    @State private var notes: String = ""
    @State private var phase: Phase = .editing
    @State private var errorMessage: String?

    enum Phase: Equatable {
        case editing
        case submitting
        case submitted(quotaRemaining: Int?)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Brand.Color.surfacePaper.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        header

                        switch phase {
                        case .editing, .submitting:
                            form
                        case .submitted(let quota):
                            confirmation(quotaRemaining: quota)
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 24)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(Brand.Color.inkPrimary)
                }
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Report a call")
                .font(.system(size: 11, weight: .medium))
                .tracking(1.2)
                .foregroundStyle(Brand.Color.inkByline)
                .textCase(.uppercase)

            Text("Who called?")
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(Brand.Color.inkPrimary)

            Text("Three accounts must report a number within 14 days before it lands on the public block list. Your report counts toward that.")
                .font(.system(size: 15))
                .foregroundStyle(Brand.Color.inkSecondary)
                .lineSpacing(3)
        }
    }

    private var form: some View {
        VStack(alignment: .leading, spacing: 18) {
            field(label: "PHONE NUMBER") {
                TextField("(555) 123-4567", text: $rawPhone)
                    .keyboardType(.phonePad)
                    .textContentType(.telephoneNumber)
                    .padding(.vertical, 14)
                    .padding(.horizontal, 16)
                    .background(Brand.Color.surfaceRaised)
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(Brand.Color.rule, lineWidth: 1))
                    .clipShape(RoundedRectangle(cornerRadius: 6))
            }

            field(label: "CATEGORY") {
                Menu {
                    ForEach(ScamCategory.allCases) { c in
                        Button(c.label) { category = c }
                    }
                } label: {
                    HStack {
                        Text(category.label)
                            .foregroundStyle(Brand.Color.inkPrimary)
                        Spacer()
                        Image(systemName: "chevron.down")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Brand.Color.inkByline)
                    }
                    .padding(.vertical, 14)
                    .padding(.horizontal, 16)
                    .background(Brand.Color.surfaceRaised)
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(Brand.Color.rule, lineWidth: 1))
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                }
            }

            field(label: "NOTES (OPTIONAL, 280 CHAR MAX)") {
                TextEditor(text: $notes)
                    .frame(minHeight: 90)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 12)
                    .background(Brand.Color.surfaceRaised)
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(Brand.Color.rule, lineWidth: 1))
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                    .onChange(of: notes) { _, new in
                        if new.count > 280 {
                            notes = String(new.prefix(280))
                        }
                    }

                Text("\(notes.count) / 280")
                    .font(.system(.caption2, design: .monospaced))
                    .foregroundStyle(Brand.Color.inkByline)
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.system(size: 13))
                    .foregroundStyle(Brand.Color.destructive)
            }

            Button(action: submit) {
                Text(phase == .submitting ? "Submitting…" : "Submit report")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(Brand.Color.surfacePaper)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
            }
            .background(Brand.Color.inkPrimary)
            .clipShape(RoundedRectangle(cornerRadius: 6))
            .disabled(phase == .submitting || normalizedE164(rawPhone) == nil)
            .opacity(normalizedE164(rawPhone) == nil ? 0.5 : 1)
        }
    }

    private func confirmation(quotaRemaining: Int?) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 6) {
                Circle()
                    .fill(Brand.Color.signalCorroborated)
                    .frame(width: 8, height: 8)
                Text("Report received")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Brand.Color.signalCorroborated)
            }

            Text("Your report is in the pending queue. Two more accounts reporting this number within 14 days will promote it to the public block list.")
                .font(.system(size: 14))
                .foregroundStyle(Brand.Color.inkSecondary)
                .lineSpacing(3)

            if let quotaRemaining {
                Text("\(quotaRemaining) reports remaining this month on the free tier.")
                    .font(.system(.caption, design: .monospaced))
                    .foregroundStyle(Brand.Color.inkByline)
            }

            Button("Report another") {
                rawPhone = ""
                notes = ""
                category = .unknown
                phase = .editing
                errorMessage = nil
            }
            .font(.system(size: 14, weight: .medium))
            .foregroundStyle(Brand.Color.inkPrimary)
            .padding(.vertical, 12)
            .padding(.horizontal, 16)
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(Brand.Color.rule, lineWidth: 1))

            Button("Done") {
                dismiss()
            }
            .font(.system(size: 14))
            .foregroundStyle(Brand.Color.inkByline)
            .padding(.top, 4)
        }
        .padding(.vertical, 16)
        .padding(.horizontal, 16)
        .background(Brand.Color.surfaceInset)
        .clipShape(RoundedRectangle(cornerRadius: 6))
    }

    private func field<Content: View>(
        label: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.system(size: 11, weight: .medium))
                .tracking(0.8)
                .foregroundStyle(Brand.Color.inkByline)
            content()
        }
    }

    private func submit() {
        errorMessage = nil
        guard let e164 = normalizedE164(rawPhone) else {
            errorMessage = "That doesn't look like a US phone number."
            return
        }
        phase = .submitting
        Task {
            do {
                let response = try await APIClient.shared.submitReport(
                    ReportRequest(
                        number: e164,
                        category: category,
                        notes: notes.isEmpty ? nil : notes
                    )
                )
                phase = .submitted(quotaRemaining: response.quotaRemaining)
            } catch {
                errorMessage = error.localizedDescription
                phase = .editing
            }
        }
    }

    /// Strip non-digits, accept 10-digit US input or 11-digit starting in 1.
    /// Returns "+1XXXXXXXXXX" or nil. Mirrors apps/web phone-normalize.ts.
    private func normalizedE164(_ raw: String) -> String? {
        let digits = raw.unicodeScalars.filter(CharacterSet.decimalDigits.contains).map(String.init).joined()
        if digits.count == 10 { return "+1\(digits)" }
        if digits.count == 11, digits.hasPrefix("1") { return "+\(digits)" }
        return nil
    }
}

#Preview {
    ReportView()
}
