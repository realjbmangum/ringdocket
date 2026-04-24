# Ringdocket iOS

Phase 4a — "Block list on my phone" MVP.

One screen, one button. Tap **Sync block list** → app downloads the current Ringdocket block list (~24k corroborated spam numbers) → hands it to iOS via the Call Directory Extension → those numbers never ring.

No auth, no reporting, no in-app subscription yet. That's Phase 4b.

---

## Prerequisites

1. **Xcode 15+** (App Store, free, ~10 GB). Open it once after install to accept the license + install simulators.
2. **XcodeGen**:
   ```bash
   brew install xcodegen
   ```
3. **Apple ID** — any Apple ID is fine for personal-device testing. Free-tier signed builds expire after 7 days; you re-deploy from Xcode to refresh.
4. **A physical iPhone + cable.** Call Directory Extensions don't run in the iOS Simulator (no Phone app there). You must test on a real device.

You do **not** need the $99/yr Apple Developer Program enrollment for this phase. That comes later for TestFlight + App Store submission.

---

## First-time setup

```bash
cd /Users/jbm/new-project/app-spamblocker/ringdocket/apps/ios
xcodegen generate
open Ringdocket.xcodeproj
```

Xcode opens. You'll see two targets in the project navigator:

- **Ringdocket** — the iOS app (one screen, one button)
- **RingdocketBlockList** — the Call Directory Extension that installs the block list

### Configure signing (one-time per Mac)

For both targets:

1. Click the project root in Xcode → select the **Ringdocket** target → **Signing & Capabilities** tab
2. Toggle on **Automatically manage signing**
3. **Team:** pick your personal Apple ID team (it'll appear after you sign in to Xcode → Settings → Accounts)
4. Bundle Identifier should already read `com.lighthouse27.ringdocket` — but if Apple complains it's taken, change the prefix in `project.yml`:
   ```yaml
   options:
     bundleIdPrefix: com.<your-handle>
   ```
   Then re-run `xcodegen generate`.
5. Repeat for the **RingdocketBlockList** target.

### Configure App Groups (one-time per Apple Developer account)

The app and the extension share data via an **App Group container**. iOS won't let either target access it until the App Group is registered with your Apple Developer account.

For both targets:

1. **Signing & Capabilities** → **+ Capability** → **App Groups**
2. **+** under the App Groups list → enter `group.com.lighthouse27.ringdocket` (or match your bundle prefix)
3. Check the box next to it
4. The same App Group must be ticked on **both** targets — that's the whole point.

Xcode auto-registers the App Group with Apple's developer portal under your team.

### Run on your phone

1. Connect your iPhone with a cable. Trust the computer when prompted.
2. In Xcode top bar: pick your iPhone as the target device (instead of the simulator).
3. **Cmd+R** — Xcode builds, signs, and launches Ringdocket on your phone.
4. First launch: iOS will refuse to open the app because it's signed by a personal Apple ID. Go to **Settings → General → VPN & Device Management** → tap your Apple ID → **Trust**. Then re-launch from the home screen.

### Enable the Call Directory Extension

iOS doesn't auto-enable extensions. The user has to opt in:

**Settings → Phone → Call Blocking & Identification → toggle Ringdocket on.**

The app's status text reminds you to do this if it detects the extension is installed but disabled.

### Test it

1. Tap **Sync block list** in the app
2. Status flips to "Syncing… → Reloading extension… → Synced and active"
3. The 24k+ corroborated numbers are now installed in iOS's call-blocking database
4. To verify a specific block: pick any number from `https://blocklist.ringdocket.com/current.json`, ask a friend to call from that number — your phone won't ring
5. (Easier verification on a clean device: temporarily put a number you can call from into the local payload at `~/Library/Group Containers/group.com.lighthouse27.ringdocket/blocklist.json` via a debug-mode override — Phase 4b will add a developer toggle for this.)

---

## File layout

```
apps/ios/
├── project.yml                         # XcodeGen config — source of truth
├── README.md                           # this file
├── .gitignore                          # ignores xcodeproj (regenerated)
├── Ringdocket/                         # iOS app target
│   ├── RingdocketApp.swift             # @main app entry point
│   ├── ContentView.swift               # the one screen
│   ├── BlockListSync.swift             # actor — downloads + writes JSON
│   ├── Brand.swift                     # Forensic Ledger color tokens
│   ├── Ringdocket.entitlements         # App Group capability
│   └── Assets.xcassets/                # AppIcon + AccentColor
└── RingdocketBlockList/                # Call Directory Extension target
    ├── CallDirectoryHandler.swift      # CXCallDirectoryProvider impl
    ├── Info.plist                      # NSExtensionPointIdentifier
    └── RingdocketBlockList.entitlements
```

---

## What's next (Phase 4b)

After the block list is verified working on a phone, we layer:

- Sign-in flow (Supabase magic link via `ASWebAuthenticationSession`)
- Home screen with personal stats (mirrors `app.ringdocket.com/app/home`)
- Report-a-call form (`POST /api/report` to the worker)
- Settings (deep links to the web dashboard for billing)
- Background block list refresh (BGAppRefreshTask, daily)
- App icon (currently placeholder — needs a real icon designed per the brand guide)
- TestFlight + App Store enrollment ($99/yr)

See [docs/ios-brand-guide.md](../../docs/ios-brand-guide.md) for the 9-screen V1 spec.

---

## Troubleshooting

**"App Group container missing" error in the app**
→ The App Group capability isn't enabled on one or both targets. Re-check Signing & Capabilities for both Ringdocket AND RingdocketBlockList. The App Group ID has to be ticked on both with the same string.

**"Synced, but the extension is disabled"**
→ Settings → Phone → Call Blocking & Identification → toggle Ringdocket on. iOS requires the user to opt in; this can't be done programmatically.

**Build fails with code-signing errors**
→ In Xcode: Settings → Accounts → make sure your Apple ID is signed in. Project root → Signing & Capabilities → "Automatically manage signing" + pick your personal team.

**"Could not find module 'CallKit'"**
→ Wrong target. The CallKit import in `CallDirectoryHandler.swift` only resolves under the Extension target. Run via the **Ringdocket** scheme, which builds both.

**Numbers I expect to be blocked still ring**
→ iOS's CDE consults the database before ringing. If the database doesn't include a specific number, the call rings. Check whether that number is on `https://blocklist.ringdocket.com/current.json` — if not, it's not in our list (see the "FTC feed coverage" note in `progress.txt`).
