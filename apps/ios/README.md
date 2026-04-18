# Ringdocket iOS

Native Swift + SwiftUI project — scaffolded in Phase 4.

The iOS app owns the Call Directory Extension (CDE) integration, block list sync, one-tap report flow, and on-device personal stats. See [../../docs/PRD.md](../../docs/PRD.md) §7.1 for the full spec.

## Why native Swift (not React Native)

CDE runs in its own process, is Swift-only, and has a ~5 MB working memory ceiling that makes streaming + autoreleasepool discipline mandatory. RN would add a bridge for ~5 screens while keeping every App Store review risk in the call-blocker category. See PRD §6 "Architectural rationale."

## Stubbed for now

- Xcode project (`Ringdocket.xcodeproj`)
- Targets: main app + CallDirectoryExtension
- App Group: `group.app.ringdocket.shared` (block list container)
- Package dependencies: `sentry-cocoa`, RevenueCat

## Next

Phase 4 of the build spins this up. Do not commit iOS source here until the Xcode project is generated.
