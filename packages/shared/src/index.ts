/**
 * @ringdocket/shared — Zod schemas + TypeScript types shared across
 * the worker, web dashboard, and iOS app.
 *
 * Any DB-facing shape here MUST match the Postgres schema defined in
 * supabase/migrations/001_initial_schema.sql. Schema drift between this
 * file and the DB is a bug.
 *
 * Casing convention:
 * - API boundaries (request/response bodies) use camelCase
 * - DB row shapes use snake_case to match Postgres columns
 * - Mappers convert between them at the Worker layer
 */

import { z } from 'zod';

// ============================================================================
// Postgres enums — these must match the CREATE TYPE statements exactly
// ============================================================================

export const ScamCategorySchema = z.enum([
  'auto_warranty',
  'irs_impersonation',
  'medicare_card_renewal',
  'utility_shutoff',
  'social_security',
  'bank_fraud',
  'tech_support',
  'political',
  'unknown',
  'other',
]);
export type ScamCategory = z.infer<typeof ScamCategorySchema>;

export const NumberStateSchema = z.enum(['pending', 'corroborated', 'retired']);
export type NumberState = z.infer<typeof NumberStateSchema>;

export const SubscriptionTierSchema = z.enum([
  'free',
  'full',
  'founding_flagger',
]);
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

export const SubscriptionStatusSchema = z.enum([
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
  'paused',
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export const AppealStatusSchema = z.enum([
  'open',
  'reviewing',
  'resolved',
  'rejected',
]);
export type AppealStatus = z.infer<typeof AppealStatusSchema>;

export const RetirementReasonSchema = z.enum([
  'fcc_enforcement',
  'ftc_enforcement',
  'itg_traceback',
  'activity_decay',
  'admin_manual',
]);
export type RetirementReason = z.infer<typeof RetirementReasonSchema>;

// ============================================================================
// Primitives
// ============================================================================

/** E.164 phone number. Matches the Postgres CHECK constraint on phone columns. */
export const E164PhoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Must be E.164 format, e.g., +14025550142');
export type E164Phone = z.infer<typeof E164PhoneSchema>;

export const UuidSchema = z.string().uuid();
export type Uuid = z.infer<typeof UuidSchema>;

export const TimestampSchema = z.string().datetime();
export type Timestamp = z.infer<typeof TimestampSchema>;

/** IPv4 /24 subnet in CIDR notation, e.g., "192.168.1.0/24". */
export const IpSubnetSchema = z
  .string()
  .regex(
    /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})\/24$/,
    'Must be IPv4 /24 CIDR, e.g., 192.168.1.0/24',
  );
export type IpSubnet = z.infer<typeof IpSubnetSchema>;

/** iOS install UUID, stored in Keychain, same shape as UUID v4. */
export const DeviceFingerprintSchema = UuidSchema;
export type DeviceFingerprint = z.infer<typeof DeviceFingerprintSchema>;

// ============================================================================
// Report / PendingReport
// ============================================================================

/**
 * Client-submitted report body (camelCase).
 * The iOS app POSTs this shape to /api/report.
 *
 * The Worker fills in:
 * - deviceFingerprint from a client header (X-Device-Id)
 * - ipSubnet from CF-Connecting-IP (truncated to /24)
 * - userId from the verified Supabase JWT
 */
export const ReportInputSchema = z.object({
  number: E164PhoneSchema,
  category: ScamCategorySchema,
  notes: z.string().max(280).optional(),
});
export type ReportInput = z.infer<typeof ReportInputSchema>;

/** DB row shape for pending_reports table (snake_case). */
export const PendingReportRowSchema = z.object({
  id: UuidSchema,
  user_id: UuidSchema,
  number: E164PhoneSchema,
  category: ScamCategorySchema,
  notes: z.string().nullable(),
  device_fingerprint: DeviceFingerprintSchema,
  ip_subnet: IpSubnetSchema,
  submitted_at: TimestampSchema,
});
export type PendingReportRow = z.infer<typeof PendingReportRowSchema>;

/** DB row shape for reports (post-corroboration, immutable, user_id nullable after deletion). */
export const ReportRowSchema = z.object({
  id: UuidSchema,
  user_id: UuidSchema.nullable(),
  number: E164PhoneSchema,
  category: ScamCategorySchema,
  notes: z.string().nullable(),
  corroboration_sequence: z.number().int().min(1),
  submitted_at: TimestampSchema,
});
export type ReportRow = z.infer<typeof ReportRowSchema>;

/** Response from POST /api/report. */
export const ReportAcceptedResponseSchema = z.object({
  id: UuidSchema,
  status: z.literal('pending'),
  receivedAt: TimestampSchema,
});
export type ReportAcceptedResponse = z.infer<
  typeof ReportAcceptedResponseSchema
>;

// ============================================================================
// Phone number record (the source of block list truth)
// ============================================================================

export const PhoneNumberRowSchema = z.object({
  id: UuidSchema,
  /** Column name in the `numbers` table is `phone`, NOT `number`. The other phone-bearing tables (reports, pending_reports, ftc_complaints) use `number`. Don't unify without a migration. */
  phone: E164PhoneSchema,
  current_state: NumberStateSchema,
  campaign_id: UuidSchema.nullable(),
  reputation_score: z.number(),
  first_flag_user_id: UuidSchema.nullable(),
  first_flag_at: TimestampSchema.nullable(),
  corroborated_at: TimestampSchema.nullable(),
  retired_at: TimestampSchema.nullable(),
  retired_reason: RetirementReasonSchema.nullable(),
  created_at: TimestampSchema,
});
export type PhoneNumberRow = z.infer<typeof PhoneNumberRowSchema>;

// ============================================================================
// Campaign
// ============================================================================

export const CampaignRowSchema = z.object({
  id: UuidSchema,
  slug: z.string().min(1),
  name: z.string().min(1),
  narrative_summary: z.string(),
  carriers_implicated: z.array(z.string()),
  active_since: TimestampSchema,
  retired_at: TimestampSchema.nullable(),
  takedown_source: z.string().nullable(),
  takedown_case_id: z.string().nullable(),
  created_at: TimestampSchema,
});
export type CampaignRow = z.infer<typeof CampaignRowSchema>;

// ============================================================================
// Block list — what ships to iOS overnight
// ============================================================================

/** Manifest at r2://blocklist/current.json. iOS polls this to check for new versions. */
export const BlockListManifestSchema = z.object({
  version: z.string().regex(/^\d{8}$/, 'Version is YYYYMMDD'),
  generatedAt: TimestampSchema,
  numberCount: z.number().int().min(0),
  fileUrl: z.string().url(),
  fileChecksum: z.string().regex(/^[a-f0-9]{64}$/, 'SHA-256 hex'),
});
export type BlockListManifest = z.infer<typeof BlockListManifestSchema>;

/**
 * The actual block list payload iOS downloads.
 * Numbers are sorted ascending — required by iOS Call Directory Extension.
 */
export const BlockListPayloadSchema = z.object({
  version: z.string().regex(/^\d{8}$/),
  generatedAt: TimestampSchema,
  numbers: z.array(E164PhoneSchema),
});
export type BlockListPayload = z.infer<typeof BlockListPayloadSchema>;

// ============================================================================
// User
// ============================================================================

export const EmailPrefsSchema = z.object({
  weekly_digest: z.boolean(),
  monthly_impact: z.boolean(),
  quarterly_takedown: z.boolean(),
});
export type EmailPrefs = z.infer<typeof EmailPrefsSchema>;

export const UserRowSchema = z.object({
  id: UuidSchema,
  display_name: z.string().nullable(),
  first_flag_credit_count: z.number().int().min(0),
  impact_score: z.number().int().min(0),
  email_prefs: EmailPrefsSchema,
  created_at: TimestampSchema,
});
export type UserRow = z.infer<typeof UserRowSchema>;

// ============================================================================
// Badges
// ============================================================================

export const BadgeRowSchema = z.object({
  id: UuidSchema,
  slug: z.string(),
  display_name: z.string(),
  description: z.string(),
  icon_key: z.string(),
  criteria_json: z.record(z.unknown()),
  created_at: TimestampSchema,
});
export type BadgeRow = z.infer<typeof BadgeRowSchema>;

export const UserBadgeRowSchema = z.object({
  user_id: UuidSchema,
  badge_id: UuidSchema,
  awarded_at: TimestampSchema,
});
export type UserBadgeRow = z.infer<typeof UserBadgeRowSchema>;

// ============================================================================
// Subscriptions
// ============================================================================

export const SubscriptionRowSchema = z.object({
  user_id: UuidSchema,
  revenuecat_subscriber_id: z.string().nullable(),
  status: SubscriptionStatusSchema,
  tier: SubscriptionTierSchema,
  current_period_end: TimestampSchema.nullable(),
  cancel_at: TimestampSchema.nullable(),
  created_at: TimestampSchema,
});
export type SubscriptionRow = z.infer<typeof SubscriptionRowSchema>;

// ============================================================================
// Delist appeals
// ============================================================================

/** Public form submission at /report-an-error. No auth required. */
export const DelistAppealInputSchema = z.object({
  challengedNumber: E164PhoneSchema,
  submitterEmail: z.string().email(),
  reason: z.string().min(10).max(1000),
});
export type DelistAppealInput = z.infer<typeof DelistAppealInputSchema>;

export const DelistAppealRowSchema = z.object({
  id: UuidSchema,
  challenged_number: E164PhoneSchema,
  submitter_email: z.string().email(),
  reason: z.string(),
  status: AppealStatusSchema,
  submitted_at: TimestampSchema,
  resolved_at: TimestampSchema.nullable(),
});
export type DelistAppealRow = z.infer<typeof DelistAppealRowSchema>;

// ============================================================================
// FTC DNC Complaints API (https://api.ftc.gov/v0/dnc-complaints)
// ============================================================================

/**
 * Raw complaint record as returned by the FTC API.
 *
 * The FTC API returns a JSON-API-ish envelope: `{ data: [{ id, attributes }], meta, links }`.
 * `attributes` uses kebab-case field names. Dates are "YYYY-MM-DD HH:MM:SS"
 * (NOT strict ISO 8601 despite what the FTC docs claim).
 *
 * `company-phone-number` is frequently empty — complaints without a phone
 * number are useless for block-list hydration and should be skipped.
 */
export const FtcComplaintAttributesSchema = z.object({
  'company-phone-number': z.string(),
  'created-date': z.string(),
  'violation-date': z.string(),
  'consumer-city': z.string().optional().default(''),
  'consumer-state': z.string().optional().default(''),
  'consumer-area-code': z.string().optional().default(''),
  subject: z.string().optional().default(''),
  'recorded-message-or-robocall': z
    .union([z.literal('Y'), z.literal('N'), z.literal('')])
    .default(''),
  seq: z.number().int().optional(),
});
export type FtcComplaintAttributes = z.infer<typeof FtcComplaintAttributesSchema>;

export const FtcComplaintEnvelopeSchema = z.object({
  type: z.literal('dnc_complaint'),
  id: z.string().min(1),
  attributes: FtcComplaintAttributesSchema,
});
export type FtcComplaintEnvelope = z.infer<typeof FtcComplaintEnvelopeSchema>;

export const FtcComplaintListResponseSchema = z.object({
  data: z.array(FtcComplaintEnvelopeSchema),
  meta: z
    .object({
      'records-this-page': z.number().int().nonnegative().optional(),
      // record-total is unreliable — API sometimes returns the last record's
      // data here instead of a count. Don't trust it for pagination termination.
    })
    .passthrough(),
  links: z
    .object({
      self: z.string().url().optional(),
    })
    .passthrough()
    .optional(),
});
export type FtcComplaintListResponse = z.infer<typeof FtcComplaintListResponseSchema>;

/**
 * DB row shape for ftc_complaints table (post-migration 005).
 *
 * `ftc_id` is the FTC's hash string (e.g., "1f639a391450becbe65095b4cd574ff2")
 * used as the natural key for upsert idempotency. Added in migration 005.
 */
export const FtcComplaintRowSchema = z.object({
  id: UuidSchema,
  ftc_id: z.string().min(1),
  number: E164PhoneSchema,
  reason: z.string().nullable(),
  state: z.string().nullable(),
  consumer_city: z.string().nullable(),
  consumer_area_code: z.string().nullable(),
  is_robocall: z.boolean().nullable(),
  filed_at: TimestampSchema.nullable(),
  source_url: z.string().nullable(),
  ingested_at: TimestampSchema,
  created_at: TimestampSchema,
});
export type FtcComplaintRow = z.infer<typeof FtcComplaintRowSchema>;

/** Insert payload for ftc_complaints — shape the cron sends to Supabase. */
export const FtcComplaintInsertSchema = FtcComplaintRowSchema.omit({
  id: true,
  ingested_at: true,
  created_at: true,
});
export type FtcComplaintInsert = z.infer<typeof FtcComplaintInsertSchema>;

// ============================================================================
// Rate limiting constants — must match the PRD + security review
// ============================================================================

/** Free tier: 5 reports per calendar month (UTC). */
export const FREE_TIER_MONTHLY_REPORT_QUOTA = 5;

/** Paid tier: >20 reports in any rolling 1-hour window triggers hold-for-review. */
export const PAID_TIER_VELOCITY_THRESHOLD = 20;

/** Cloudflare-enforced: 30 requests/minute per IP on POST /api/reports. */
export const API_RATE_LIMIT_PER_IP_PER_MINUTE = 30;

/** Corroboration: 3 distinct verified accounts within 14 days. */
export const CORROBORATION_THRESHOLD_ACCOUNTS = 3;
export const CORROBORATION_WINDOW_DAYS = 14;

// ============================================================================
// API error envelope — use for all non-2xx responses
// ============================================================================

export const ApiErrorCodeSchema = z.enum([
  'invalid_input',
  'unauthorized',
  'forbidden',
  'rate_limited',
  'quota_exceeded',
  'not_found',
  'conflict',
  'internal',
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

export const ApiErrorResponseSchema = z.object({
  error: z.string(),
  code: ApiErrorCodeSchema,
  details: z.record(z.unknown()).optional(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// Re-export zod so consumers don't need their own version pin.
export { z };
