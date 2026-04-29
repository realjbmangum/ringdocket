import Foundation

/// Mirror of `ScamCategorySchema` in @ringdocket/shared. Order here is
/// the order shown in the report picker — most-common first.
enum ScamCategory: String, CaseIterable, Codable, Identifiable {
    case autoWarranty = "auto_warranty"
    case medicareCardRenewal = "medicare_card_renewal"
    case irsImpersonation = "irs_impersonation"
    case socialSecurity = "social_security"
    case bankFraud = "bank_fraud"
    case utilityShutoff = "utility_shutoff"
    case techSupport = "tech_support"
    case political = "political"
    case unknown = "unknown"
    case other = "other"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .autoWarranty:        return "Auto warranty"
        case .medicareCardRenewal: return "Medicare card renewal"
        case .irsImpersonation:    return "IRS impersonation"
        case .socialSecurity:      return "Social security"
        case .bankFraud:           return "Bank fraud"
        case .utilityShutoff:      return "Utility shutoff"
        case .techSupport:         return "Tech support"
        case .political:           return "Political"
        case .unknown:             return "Unknown / not sure"
        case .other:               return "Other"
        }
    }
}

struct ReportRequest: Encodable {
    let number: String     // E.164, e.g. "+18045551234"
    let category: ScamCategory
    let notes: String?
}

struct ReportAcceptedResponse: Decodable {
    let id: String
    let status: String
    let receivedAt: String
    let quotaRemaining: Int?
}

struct APIErrorResponse: Decodable {
    let error: APIErrorBody
    struct APIErrorBody: Decodable {
        let code: String
        let message: String
    }
}

// MARK: - Home stats

struct MyStatsResponse: Decodable {
    let email: String?
    let reportsAllTime: Int
    let reportsThisWeek: Int
    let pendingCount: Int
    let firstFlagCredits: Int
    let topCategory: String?
}

struct PendingReportsResponse: Decodable {
    let reports: [PendingReport]
}

struct PendingReport: Decodable, Identifiable {
    let id: String
    let number: String
    let category: String?
    let submittedAt: String
    let expiresAt: String
    let corroborationCount: Int
    let threshold: Int
}

struct NetworkStatsResponse: Decodable {
    let totalCorroborated: Int
    let totalActiveCampaigns: Int
    let newThisWeek: Int
    let recentCorroborated: [RecentCorroboratedNumber]
}

struct RecentCorroboratedNumber: Decodable, Identifiable {
    let phone: String
    let corroboratedAt: String?
    let reputationScore: Double?
    let campaignSlug: String?
    let campaignName: String?

    var id: String { phone }
}
