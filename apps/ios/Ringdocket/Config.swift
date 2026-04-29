import Foundation

/// Endpoint configuration. Mirrors apps/web/.env public values.
///
/// The Supabase anon key is publishable (RLS enforces access). Hardcoding
/// it here matches how the web client embeds it in the client bundle.
enum Config {
    static let supabaseURL = URL(string: "https://odezxbaalqglfdjxbsyy.supabase.co")!
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZXp4YmFhbHFnbGZkanhic3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NTAyMTAsImV4cCI6MjA5MjEyNjIxMH0.QfjHZXPiCz6y42NQxf0-nqkVQP8WFs3rtBkK1X7Vb_Y"
    static let workerURL = URL(string: "https://ringdocket-worker.bmangum1.workers.dev")!

    /// Custom URL scheme registered in project.yml. Magic-link emails
    /// redirect here after Supabase verifies the OTP token.
    static let authCallbackURL = "ringdocket://auth/callback"
}
