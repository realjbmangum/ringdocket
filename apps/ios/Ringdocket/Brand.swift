import SwiftUI

/// Forensic Ledger (Light) tokens — see docs/brand/03-visual-identity.md.
/// SwiftUI Color literals (RGB hex). Keep these in sync with the
/// CSS variables in apps/web/src/styles/global.css.
enum Brand {
    enum Color {
        static let surfacePaper  = SwiftUI.Color(red: 0.969, green: 0.953, blue: 0.918) // #F7F3EA
        static let surfaceRaised = SwiftUI.Color(red: 1.000, green: 1.000, blue: 1.000) // #FFFFFF
        static let surfaceInset  = SwiftUI.Color(red: 0.933, green: 0.910, blue: 0.855) // #EEE8DA
        static let rule          = SwiftUI.Color(red: 0.847, green: 0.816, blue: 0.745) // #D8D0BE
        static let ruleSubtle    = SwiftUI.Color(red: 0.902, green: 0.875, blue: 0.804) // #E6DFCD

        static let inkPrimary    = SwiftUI.Color(red: 0.106, green: 0.122, blue: 0.153) // #1B1F27
        static let inkSecondary  = SwiftUI.Color(red: 0.361, green: 0.365, blue: 0.373) // #5C5D5F
        static let inkByline     = SwiftUI.Color(red: 0.553, green: 0.533, blue: 0.459) // #8D8875
        static let inkMono       = SwiftUI.Color(red: 0.227, green: 0.239, blue: 0.267) // #3A3D44

        static let signalCorroborated = SwiftUI.Color(red: 0.184, green: 0.420, blue: 0.290) // #2F6B4A
        static let signalFlag         = SwiftUI.Color(red: 0.851, green: 0.467, blue: 0.259) // #D97742
        static let mutedPending       = SwiftUI.Color(red: 0.659, green: 0.620, blue: 0.522) // #A89E85

        static let accentSignal  = SwiftUI.Color(red: 0.761, green: 0.216, blue: 0.039) // #C2370A — STAMP ONLY
        static let destructive   = SwiftUI.Color(red: 0.545, green: 0.169, blue: 0.122) // #8B2B1F
    }
}
