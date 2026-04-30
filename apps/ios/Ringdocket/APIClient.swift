import Foundation

/// Thin URLSession wrapper for the Ringdocket Worker API. Injects
/// `Authorization: Bearer <jwt>` and `X-Device-Id` automatically.
///
/// Why an actor: keeps the encoder/decoder configuration in one place
/// and matches the existing BlockListSync style.
actor APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    private init() {
        // Don't use URLSession.shared — it carries a default URLCache that
        // can replay stale responses for up to 24h via heuristic freshness
        // when the server omits Cache-Control. The worker now sends
        // Cache-Control: no-store, but we belt-and-suspenders here so a
        // bad past response can't survive on disk into a new session.
        let config = URLSessionConfiguration.default
        config.urlCache = nil
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        self.session = URLSession(configuration: config)
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
    }

    enum APIError: LocalizedError {
        case notSignedIn
        case quotaExceeded(used: Int, cap: Int)
        case server(status: Int, message: String)
        case decode

        var errorDescription: String? {
            switch self {
            case .notSignedIn:
                return "You're signed out. Sign back in to continue."
            case .quotaExceeded(let used, let cap):
                return "Free-tier limit hit (\(used)/\(cap) this month). Upgrade for unlimited reports."
            case .server(_, let msg):
                return msg
            case .decode:
                return "Server returned an unexpected response."
            }
        }
    }

    func myStats() async throws -> MyStatsResponse {
        try await authedGet("/api/my-stats")
    }

    func myPendingReports() async throws -> PendingReportsResponse {
        try await authedGet("/api/my-pending-reports")
    }

    func networkStats() async throws -> NetworkStatsResponse {
        try await unauthenticatedGet("/api/network-stats")
    }

    private func authedGet<T: Decodable>(_ path: String) async throws -> T {
        guard let token = await AuthSession.shared.accessToken else {
            throw APIError.notSignedIn
        }
        var req = URLRequest(url: Config.workerURL.appendingPathComponent(path))
        req.httpMethod = "GET"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue(DeviceID.current(), forHTTPHeaderField: "X-Device-Id")
        return try await execute(req)
    }

    private func unauthenticatedGet<T: Decodable>(_ path: String) async throws -> T {
        var req = URLRequest(url: Config.workerURL.appendingPathComponent(path))
        req.httpMethod = "GET"
        return try await execute(req)
    }

    private func execute<T: Decodable>(_ req: URLRequest) async throws -> T {
        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.server(status: 0, message: "No HTTP response")
        }
        if !(200...299).contains(http.statusCode) {
            let msg = (try? decoder.decode(APIErrorResponse.self, from: data))?.error.message
                ?? String(data: data, encoding: .utf8)
                ?? "HTTP \(http.statusCode)"
            throw APIError.server(status: http.statusCode, message: msg)
        }
        guard let parsed = try? decoder.decode(T.self, from: data) else {
            throw APIError.decode
        }
        return parsed
    }

    func submitReport(_ report: ReportRequest) async throws -> ReportAcceptedResponse {
        guard let token = await AuthSession.shared.accessToken else {
            throw APIError.notSignedIn
        }

        var req = URLRequest(url: Config.workerURL.appendingPathComponent("/api/report"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue(DeviceID.current(), forHTTPHeaderField: "X-Device-Id")
        req.httpBody = try encoder.encode(report)

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.server(status: 0, message: "No HTTP response")
        }

        if http.statusCode == 429,
           let body = try? decoder.decode(APIErrorResponse.self, from: data),
           body.error.code == "quota_exceeded" {
            // The worker returns { code, message, used, cap } in details;
            // fall back to a generic quota error if we can't parse the rest.
            throw APIError.quotaExceeded(used: 0, cap: 5)
        }

        if !(200...299).contains(http.statusCode) {
            let msg = (try? decoder.decode(APIErrorResponse.self, from: data))?.error.message
                ?? String(data: data, encoding: .utf8)
                ?? "HTTP \(http.statusCode)"
            throw APIError.server(status: http.statusCode, message: msg)
        }

        guard let parsed = try? decoder.decode(ReportAcceptedResponse.self, from: data) else {
            throw APIError.decode
        }
        return parsed
    }
}
