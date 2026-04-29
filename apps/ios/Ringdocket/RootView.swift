import SwiftUI

/// Auth gate. Shows SignInView when signed out, the main app otherwise.
struct RootView: View {
    @ObservedObject private var auth = AuthSession.shared

    var body: some View {
        switch auth.state {
        case .unknown:
            ZStack {
                Brand.Color.surfacePaper.ignoresSafeArea()
                ProgressView()
            }
        case .signedOut:
            SignInView()
        case .signedIn:
            HomeView()
        }
    }
}
