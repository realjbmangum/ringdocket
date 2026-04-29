import Foundation
import BackgroundTasks
import CallKit

/// Background block list refresh.
///
/// Registers a BGAppRefreshTask. iOS runs it opportunistically (we don't
/// pick the exact time) once per ~12-hour earliest-begin window, only
/// when the device is on Wi-Fi + plugged in OR has good network — Apple
/// makes the call.
///
/// The task identifier must also appear under
/// BGTaskSchedulerPermittedIdentifiers in Info.plist (already set in
/// project.yml). Without that key, the runtime register call crashes.
enum BackgroundRefresh {
    static let taskIdentifier = "com.lighthouse27.ringdocket.blocklist-refresh"
    private static let extensionBundleId = "com.lighthouse27.ringdocket.blocklist"
    private static let refreshIntervalSeconds: TimeInterval = 12 * 60 * 60

    /// Call once during app launch, before the SwiftUI scene is built.
    static func register() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: taskIdentifier,
            using: nil
        ) { task in
            handle(task: task as! BGAppRefreshTask)
        }
    }

    /// Schedules the next refresh. Safe to call repeatedly — submit replaces
    /// the existing pending request for the same identifier.
    static func schedule() {
        let req = BGAppRefreshTaskRequest(identifier: taskIdentifier)
        req.earliestBeginDate = Date(timeIntervalSinceNow: refreshIntervalSeconds)
        do {
            try BGTaskScheduler.shared.submit(req)
        } catch {
            // Common in simulator / when running unsigned. Quietly ignore —
            // the next launch will re-attempt.
            print("[bg-refresh] submit failed: \(error.localizedDescription)")
        }
    }

    private static func handle(task: BGAppRefreshTask) {
        // Always reschedule the next run before doing the work, so a crash
        // mid-work doesn't leave us with no future refreshes.
        schedule()

        let work = Task {
            do {
                _ = try await BlockListSync.shared.downloadAndStore()
                try await reloadCallDirectoryExtension(identifier: extensionBundleId)
                task.setTaskCompleted(success: true)
            } catch {
                print("[bg-refresh] failed: \(error.localizedDescription)")
                task.setTaskCompleted(success: false)
            }
        }

        task.expirationHandler = {
            work.cancel()
        }
    }

    private static func reloadCallDirectoryExtension(identifier: String) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            CXCallDirectoryManager.sharedInstance.reloadExtension(withIdentifier: identifier) { error in
                if let error { continuation.resume(throwing: error) }
                else { continuation.resume() }
            }
        }
    }
}
