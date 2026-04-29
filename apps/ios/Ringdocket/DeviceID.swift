import Foundation

/// Stable per-install UUID used as `X-Device-Id` for /api/report.
///
/// One of the three corroboration distinctness signals (along with user_id
/// and IP /24). Generated on first access, persisted in Keychain so it
/// survives app reinstall protection logic.
enum DeviceID {
    private static let key = "ringdocket.device-id"

    static func current() -> String {
        if let existing = Keychain.get(key) { return existing }
        let new = UUID().uuidString.lowercased()
        Keychain.set(new, key: key)
        return new
    }
}
