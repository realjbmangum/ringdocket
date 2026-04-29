import Foundation
import Combine

/// Holds the Supabase session (access + refresh tokens) and notifies the
/// UI when it changes. Tokens persist in Keychain across launches.
///
/// Sign-in flow:
///   1. UI calls `requestMagicLink(email:)` — POST /auth/v1/otp
///   2. Email arrives, user taps link, Supabase redirects to
///      `ringdocket://auth/callback#access_token=...&refresh_token=...`
///   3. RingdocketApp.onOpenURL forwards the URL here via `consumeCallback(_:)`
///   4. Tokens stored in Keychain, `state` flips to `.signedIn`
@MainActor
final class AuthSession: ObservableObject {
    static let shared = AuthSession()

    enum State: Equatable {
        case unknown
        case signedOut
        case signedIn(userId: String, email: String?)
    }

    @Published private(set) var state: State = .unknown

    private let accessTokenKey = "ringdocket.session.access"
    private let refreshTokenKey = "ringdocket.session.refresh"
    private let emailKey = "ringdocket.session.email"
    private let userIdKey = "ringdocket.session.user-id"

    private init() {
        restore()
    }

    var accessToken: String? {
        Keychain.get(accessTokenKey)
    }

    private func restore() {
        if let token = Keychain.get(accessTokenKey),
           let userId = decodeUserId(from: token) {
            state = .signedIn(userId: userId, email: Keychain.get(emailKey))
        } else {
            state = .signedOut
        }
    }

    /// POST /auth/v1/otp?redirect_to=ringdocket://auth/callback
    ///
    /// The Supabase JS client *appends* redirect_to as a URL query
    /// parameter on the OTP endpoint (not in the JSON body). The REST
    /// API silently falls back to Site URL if redirect_to is missing
    /// OR not allowlisted, which manifests as "the magic link opened
    /// the website instead of the app." Pass it as a query param to
    /// match the supabase-js wire format.
    func requestMagicLink(email: String) async throws {
        var components = URLComponents(
            url: Config.supabaseURL.appendingPathComponent("/auth/v1/otp"),
            resolvingAgainstBaseURL: false
        )!
        components.queryItems = [
            URLQueryItem(name: "redirect_to", value: Config.authCallbackURL),
        ]
        var req = URLRequest(url: components.url!)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")

        struct Body: Encodable {
            let email: String
            let create_user: Bool
        }
        req.httpBody = try JSONEncoder().encode(
            Body(email: email, create_user: true)
        )

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw AuthError.network
        }
        guard (200...299).contains(http.statusCode) else {
            let msg = String(data: data, encoding: .utf8) ?? "HTTP \(http.statusCode)"
            throw AuthError.server(msg)
        }
        // Stash the email so we can show it in Settings before the
        // session callback resolves the canonical user record.
        Keychain.set(email, key: emailKey)
    }

    /// Called from RingdocketApp.onOpenURL when iOS hands us the
    /// `ringdocket://auth/callback#access_token=...` URL.
    func consumeCallback(_ url: URL) {
        guard url.scheme == "ringdocket", url.host == "auth" else { return }

        // Supabase puts tokens in the URL fragment, not the query.
        // URLComponents skips the fragment by default, so parse manually.
        let raw = url.fragment ?? url.query ?? ""
        let pairs = raw.split(separator: "&").reduce(into: [String: String]()) { acc, kv in
            let parts = kv.split(separator: "=", maxSplits: 1).map(String.init)
            guard parts.count == 2 else { return }
            acc[parts[0]] = parts[1].removingPercentEncoding ?? parts[1]
        }

        guard let access = pairs["access_token"],
              let refresh = pairs["refresh_token"],
              let userId = decodeUserId(from: access) else {
            return
        }

        Keychain.set(access, key: accessTokenKey)
        Keychain.set(refresh, key: refreshTokenKey)
        Keychain.set(userId, key: userIdKey)
        state = .signedIn(userId: userId, email: Keychain.get(emailKey))
    }

    func signOut() {
        Keychain.remove(accessTokenKey)
        Keychain.remove(refreshTokenKey)
        Keychain.remove(userIdKey)
        Keychain.remove(emailKey)
        state = .signedOut
    }

    /// JWT payload is base64url(JSON({sub, email, ...})).
    /// Pull `sub` to confirm the token is well-formed and stash the user id.
    private func decodeUserId(from jwt: String) -> String? {
        let parts = jwt.split(separator: ".")
        guard parts.count >= 2 else { return nil }
        let payload = String(parts[1])
        // base64url -> base64 padding
        var padded = payload.replacingOccurrences(of: "-", with: "+")
                            .replacingOccurrences(of: "_", with: "/")
        while padded.count % 4 != 0 { padded.append("=") }
        guard let data = Data(base64Encoded: padded),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let sub = json["sub"] as? String else { return nil }
        return sub
    }
}

enum AuthError: LocalizedError {
    case network
    case server(String)

    var errorDescription: String? {
        switch self {
        case .network: return "Network error — check your connection."
        case .server(let msg): return msg
        }
    }
}
