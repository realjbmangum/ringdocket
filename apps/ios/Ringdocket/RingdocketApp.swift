import SwiftUI

@main
struct RingdocketApp: App {
    init() {
        BackgroundRefresh.register()
    }

    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(.light) // dark mode is opt-in per design system
                .onOpenURL { url in
                    AuthSession.shared.consumeCallback(url)
                }
        }
        .onChange(of: scenePhase) { _, newPhase in
            if newPhase == .background {
                BackgroundRefresh.schedule()
            }
        }
    }
}
