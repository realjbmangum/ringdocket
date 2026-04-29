import SwiftUI

/// Two-state sign-in: enter email → sent confirmation. The actual auth
/// completion happens out-of-band when the user taps the magic link in
/// their inbox; AuthSession.consumeCallback flips the app state.
struct SignInView: View {
    @State private var email: String = ""
    @State private var phase: Phase = .enter
    @State private var errorMessage: String?

    enum Phase: Equatable {
        case enter
        case sending
        case sent
    }

    var body: some View {
        ZStack {
            Brand.Color.surfacePaper.ignoresSafeArea()

            VStack(alignment: .leading, spacing: 32) {
                wordmark

                VStack(alignment: .leading, spacing: 16) {
                    Text("Sign in")
                        .font(.system(size: 11, weight: .medium))
                        .tracking(1.2)
                        .foregroundStyle(Brand.Color.inkByline)
                        .textCase(.uppercase)

                    Text("Report calls. Help build the list.")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(Brand.Color.inkPrimary)

                    Text("We'll email you a link. No password. Tap it on this phone and you're in.")
                        .font(.system(size: 16))
                        .foregroundStyle(Brand.Color.inkSecondary)
                        .lineSpacing(4)
                }

                content

                Spacer()
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 32)
        }
    }

    @ViewBuilder
    private var content: some View {
        switch phase {
        case .enter, .sending:
            VStack(alignment: .leading, spacing: 12) {
                TextField("you@example.com", text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .padding(.vertical, 14)
                    .padding(.horizontal, 16)
                    .background(Brand.Color.surfaceRaised)
                    .overlay(
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(Brand.Color.rule, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 6))

                if let errorMessage {
                    Text(errorMessage)
                        .font(.system(size: 13))
                        .foregroundStyle(Brand.Color.destructive)
                }

                Button(action: send) {
                    HStack {
                        Text(phase == .sending ? "Sending…" : "Send me a link")
                    }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(Brand.Color.surfacePaper)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                }
                .background(Brand.Color.inkPrimary)
                .clipShape(RoundedRectangle(cornerRadius: 6))
                .disabled(phase == .sending || !isValidEmail(email))
                .opacity(isValidEmail(email) || phase == .sending ? 1 : 0.5)
            }

        case .sent:
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 6) {
                    Circle()
                        .fill(Brand.Color.signalCorroborated)
                        .frame(width: 8, height: 8)
                    Text("Check your inbox")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Brand.Color.signalCorroborated)
                }

                Text("We sent a link to \(email). Tap it on this iPhone — the app will open automatically.")
                    .font(.system(size: 14))
                    .foregroundStyle(Brand.Color.inkSecondary)
                    .lineSpacing(3)

                Button("Use a different email") {
                    phase = .enter
                    errorMessage = nil
                }
                .font(.system(size: 13))
                .foregroundStyle(Brand.Color.inkByline)
                .padding(.top, 8)
            }
            .padding(.vertical, 14)
            .padding(.horizontal, 16)
            .background(Brand.Color.surfaceInset)
            .clipShape(RoundedRectangle(cornerRadius: 6))
        }
    }

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

    private func isValidEmail(_ s: String) -> Bool {
        s.contains("@") && s.contains(".") && s.count >= 5
    }

    private func send() {
        errorMessage = nil
        phase = .sending
        Task {
            do {
                try await AuthSession.shared.requestMagicLink(email: email)
                phase = .sent
            } catch {
                errorMessage = error.localizedDescription
                phase = .enter
            }
        }
    }
}

#Preview {
    SignInView()
}
