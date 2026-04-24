import SwiftUI

@main
struct RingdocketApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.light) // dark mode is opt-in per design system
        }
    }
}
