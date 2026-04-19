import { describe, it, expect, beforeEach, vi } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { PendingReportRowSchema, ReportAcceptedResponseSchema } from '@ringdocket/shared';

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------
// We mock @supabase/supabase-js so the tests do not require a real Supabase
// project. The mock exposes `__authResponse` and `__insertHandler` hooks via
// module-level state so individual tests can override behavior.
// ---------------------------------------------------------------------------

interface MockState {
  authResponse: { data: { user: { id: string } | null }; error: { message: string } | null };
  lastInsertedRow: unknown | null;
  insertError: { message: string } | null;
}

// vi.mock is hoisted to the top of the file. Module-level `const`s are not
// available to the factory unless declared via vi.hoisted().
const mockState = vi.hoisted<MockState>(() => ({
  authResponse: {
    data: { user: { id: '00000000-0000-0000-0000-000000000001' } },
    error: null,
  },
  lastInsertedRow: null,
  insertError: null,
}));

vi.mock('@supabase/supabase-js', () => {
  const createClient = () => ({
    auth: {
      getUser: async (_token: string) => mockState.authResponse,
    },
    from: (_table: string) => ({
      insert: (row: unknown) => {
        mockState.lastInsertedRow = row;
        return {
          select: () => ({
            single: async () => {
              if (mockState.insertError) {
                return { data: null, error: mockState.insertError };
              }
              const inserted = {
                id: '99999999-9999-9999-9999-999999999999',
                submitted_at: new Date().toISOString(),
                ...(row as object),
              };
              return { data: inserted, error: null };
            },
          }),
        };
      },
    }),
  });
  return { createClient };
});

const VALID_USER_ID = '00000000-0000-0000-0000-000000000001';
const VALID_DEVICE_ID = '22222222-2222-4222-8222-222222222222';
const VALID_TOKEN = 'fake-jwt-token';

const VALID_BODY = {
  number: '+14025550142',
  category: 'auto_warranty',
  notes: 'Robocall about extended warranty',
};

function makeRequest(opts: {
  body?: unknown;
  authorization?: string | null;
  deviceId?: string | null;
  ip?: string;
} = {}): Request {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'CF-Connecting-IP': opts.ip ?? '203.0.113.42',
  };
  if (opts.authorization !== null) {
    headers['Authorization'] = opts.authorization ?? `Bearer ${VALID_TOKEN}`;
  }
  if (opts.deviceId !== null) {
    headers['X-Device-Id'] = opts.deviceId ?? VALID_DEVICE_ID;
  }
  return new Request('http://example.com/api/report', {
    method: 'POST',
    headers,
    body: opts.body === undefined ? JSON.stringify(VALID_BODY) : JSON.stringify(opts.body),
  });
}

async function clearKv(kv: KVNamespace) {
  const list = await kv.list();
  for (const k of list.keys) {
    await kv.delete(k.name);
  }
}

beforeEach(async () => {
  await clearKv(env.RATE_LIMIT);
  mockState.authResponse = {
    data: { user: { id: VALID_USER_ID } },
    error: null,
  };
  mockState.lastInsertedRow = null;
  mockState.insertError = null;
});

describe('POST /api/report', () => {
  it('returns 200 + ReportAcceptedResponse on a valid request', async () => {
    const res = await SELF.fetch(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    const parsed = ReportAcceptedResponseSchema.safeParse(body);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe('pending');
    }
  });

  it('inserts a row that conforms to PendingReportRowSchema', async () => {
    const res = await SELF.fetch(makeRequest());
    expect(res.status).toBe(200);

    expect(mockState.lastInsertedRow).not.toBeNull();
    // The row passed to insert lacks id + submitted_at (DB defaults), so we
    // synthesize them and validate against the row schema to confirm shape.
    const inserted = {
      id: '99999999-9999-9999-9999-999999999999',
      submitted_at: new Date().toISOString(),
      ...(mockState.lastInsertedRow as object),
    };
    const parsed = PendingReportRowSchema.safeParse(inserted);
    if (!parsed.success) {
      console.error(parsed.error.format());
    }
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.user_id).toBe(VALID_USER_ID);
      expect(parsed.data.number).toBe('+14025550142');
      expect(parsed.data.category).toBe('auto_warranty');
      expect(parsed.data.device_fingerprint).toBe(VALID_DEVICE_ID);
      expect(parsed.data.ip_subnet).toBe('203.0.113.0/24');
    }
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = await SELF.fetch(makeRequest({ authorization: null }));
    expect(res.status).toBe(401);
    const body = await res.json() as { code: string };
    expect(body.code).toBe('unauthorized');
  });

  it('returns 401 when JWT verification fails', async () => {
    mockState.authResponse = {
      data: { user: null },
      error: { message: 'invalid token' },
    };
    const res = await SELF.fetch(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json() as { code: string };
    expect(body.code).toBe('unauthorized');
  });

  it('returns 400 on invalid E.164 number', async () => {
    const res = await SELF.fetch(
      makeRequest({ body: { ...VALID_BODY, number: '4025550142' } }),
    );
    expect(res.status).toBe(400);
    const body = await res.json() as { code: string };
    expect(body.code).toBe('invalid_input');
  });

  it('returns 400 on invalid category', async () => {
    const res = await SELF.fetch(
      makeRequest({ body: { ...VALID_BODY, category: 'made_up_category' } }),
    );
    expect(res.status).toBe(400);
    const body = await res.json() as { code: string };
    expect(body.code).toBe('invalid_input');
  });

  it('returns 400 when X-Device-Id header is missing', async () => {
    const res = await SELF.fetch(makeRequest({ deviceId: null }));
    expect(res.status).toBe(400);
    const body = await res.json() as { code: string };
    expect(body.code).toBe('invalid_input');
  });

  it('returns 400 when X-Device-Id is not a UUID', async () => {
    const res = await SELF.fetch(makeRequest({ deviceId: 'not-a-uuid' }));
    expect(res.status).toBe(400);
    const body = await res.json() as { code: string };
    expect(body.code).toBe('invalid_input');
  });

  it('returns 400 if notes exceed 280 chars', async () => {
    const longNotes = 'x'.repeat(281);
    const res = await SELF.fetch(
      makeRequest({ body: { ...VALID_BODY, notes: longNotes } }),
    );
    expect(res.status).toBe(400);
    const body = await res.json() as { code: string };
    expect(body.code).toBe('invalid_input');
  });

  it('returns 429 with quota_exceeded when user is already at 5/month', async () => {
    // Pre-populate KV with 5 to simulate a free-tier user at quota.
    const yyyymm = (() => {
      const d = new Date();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      return `${d.getUTCFullYear()}-${m}`;
    })();
    await env.RATE_LIMIT.put(`report_count:${VALID_USER_ID}:${yyyymm}`, '5');

    const res = await SELF.fetch(makeRequest());
    expect(res.status).toBe(429);
    const body = await res.json() as { code: string };
    expect(body.code).toBe('quota_exceeded');
  });

  it('increments the KV counter after a successful insert', async () => {
    const yyyymm = (() => {
      const d = new Date();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      return `${d.getUTCFullYear()}-${m}`;
    })();
    const key = `report_count:${VALID_USER_ID}:${yyyymm}`;

    const res = await SELF.fetch(makeRequest());
    expect(res.status).toBe(200);
    const stored = await env.RATE_LIMIT.get(key);
    expect(stored).toBe('1');
  });

  it('strips phone numbers from notes before inserting', async () => {
    const res = await SELF.fetch(
      makeRequest({
        body: {
          ...VALID_BODY,
          notes: 'Call back at +14025550142 ASAP',
        },
      }),
    );
    expect(res.status).toBe(200);
    const inserted = mockState.lastInsertedRow as { notes: string | null };
    expect(inserted.notes).not.toContain('+14025550142');
    expect(inserted.notes).toContain('[phone]');
  });

  it('returns 405 on GET /api/report', async () => {
    const res = await SELF.fetch(
      new Request('http://example.com/api/report', { method: 'GET' }),
    );
    expect(res.status).toBe(405);
  });

  it('returns 404 on unknown routes', async () => {
    const res = await SELF.fetch(
      new Request('http://example.com/api/nope', { method: 'GET' }),
    );
    expect(res.status).toBe(404);
  });
});
