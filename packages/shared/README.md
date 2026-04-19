# @ringdocket/shared

Zod schemas + TypeScript types shared across the Ringdocket worker, web, and iOS codebases.

## What lives here

- **Postgres enums** — `ScamCategory`, `NumberState`, `SubscriptionTier`, etc. Must match `001_initial_schema.sql`.
- **Primitives** — `E164Phone`, `Uuid`, `Timestamp`, `IpSubnet`, `DeviceFingerprint`.
- **DB row shapes (snake_case)** — `PendingReportRow`, `ReportRow`, `PhoneNumberRow`, `CampaignRow`, etc.
- **API shapes (camelCase)** — `ReportInput`, `ReportAcceptedResponse`, `BlockListManifest`, `DelistAppealInput`.
- **Constants** — corroboration thresholds, rate limit caps, quota values.

## Casing rule

- **API boundaries** (request/response bodies between worker ↔ iOS or worker ↔ web): `camelCase`
- **DB row shapes** (mirror Postgres columns): `snake_case`
- Mappers do conversion at the Worker layer. This is deliberate: the DB uses snake_case, the TypeScript/JavaScript ecosystem uses camelCase.

## Usage in the worker

```ts
import {
  ReportInputSchema,
  ReportAcceptedResponseSchema,
  ApiErrorResponseSchema,
} from '@ringdocket/shared';

const parsed = ReportInputSchema.safeParse(await req.json());
if (!parsed.success) {
  return Response.json(
    {
      error: 'Invalid report payload',
      code: 'invalid_input',
      details: { issues: parsed.error.issues },
    } satisfies z.infer<typeof ApiErrorResponseSchema>,
    { status: 400 },
  );
}
```

## Usage in the iOS app (future)

The Swift app will regenerate equivalents from this package via codegen. V1 will hand-maintain parallel Swift types; V2 can automate with e.g. `quicktype` against the Zod → JSON Schema output.

## Don't do this

- Don't import from relative paths in consumers — always `@ringdocket/shared`.
- Don't add runtime dependencies beyond `zod`. This package is the lightweight contract layer — no HTTP clients, no Supabase, no framework code.
- Don't duplicate schemas across packages. If a type is used in more than one place, it lives here.
