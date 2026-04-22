/**
 * Minimal client for the FTC Do Not Call complaints API.
 *
 * Docs: https://www.ftc.gov/developer/api/v0/endpoints/do-not-call-dnc-reported-calls-data-api
 * Auth: api.data.gov key via `X-Api-Key` header.
 * Rate limit: 1000 requests/hour per key. We don't retry on 429 — the cron
 * catches the error, logs it, and waits until the next scheduled run.
 *
 * The FTC response is a JSON-API-ish envelope with kebab-case attribute
 * keys. We pass raw envelopes out (validated by the schema in @ringdocket/shared)
 * and let the ingestion cron do the snake_case / E.164 conversion.
 */

import {
  FtcComplaintListResponseSchema,
  type FtcComplaintListResponse,
} from '@ringdocket/shared';
import type { Env } from '../types';

const ENDPOINT = 'https://api.ftc.gov/v0/dnc-complaints';
const MAX_ITEMS_PER_PAGE = 50; // FTC-enforced hard cap

export class FtcApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = 'FtcApiError';
  }
}

export interface FtcQueryOptions {
  /** Inclusive from-date in "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS" format. */
  createdDateFrom: string;
  /** Inclusive to-date (same format as from). */
  createdDateTo: string;
  /** 0-based pagination offset. */
  offset?: number;
  /** Max records per page — API caps at 50. */
  itemsPerPage?: number;
}

/**
 * Fetch a single page of complaints. The caller paginates by incrementing
 * `offset` until `data` comes back empty.
 */
export async function fetchFtcComplaintsPage(
  env: Env,
  opts: FtcQueryOptions,
): Promise<FtcComplaintListResponse> {
  if (!env.FTC_API_KEY) {
    throw new FtcApiError('FTC_API_KEY is not configured', 500);
  }

  const items = Math.min(opts.itemsPerPage ?? MAX_ITEMS_PER_PAGE, MAX_ITEMS_PER_PAGE);
  const offset = opts.offset ?? 0;

  // Date values MUST be wrapped in double quotes per the FTC spec.
  const params = new URLSearchParams({
    created_date_from: `"${opts.createdDateFrom}"`,
    created_date_to: `"${opts.createdDateTo}"`,
    items_per_page: String(items),
    offset: String(offset),
    sort_order: 'ASC',
  });

  const res = await fetch(`${ENDPOINT}?${params}`, {
    headers: {
      'X-Api-Key': env.FTC_API_KEY,
      Accept: 'application/json',
    },
  });

  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After');
    throw new FtcApiError(
      'FTC API rate limit exceeded',
      429,
      retryAfter ? parseInt(retryAfter, 10) : null,
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new FtcApiError(
      `FTC API ${res.status} ${res.statusText}: ${body.slice(0, 200)}`,
      res.status,
    );
  }

  const json = await res.json();
  const parsed = FtcComplaintListResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new FtcApiError(
      `FTC API response failed schema validation: ${parsed.error.message}`,
      502,
    );
  }
  return parsed.data;
}

/**
 * Iterate every page in a date range. Yields records one at a time so the
 * caller can stream-insert rather than buffering entire responses in memory.
 *
 * Termination: stops when a page returns `data.length === 0`.
 * Safety: hard cap at 1000 pages (= 50,000 records) per run to avoid runaway.
 */
export async function* iterateFtcComplaints(
  env: Env,
  dateRange: { createdDateFrom: string; createdDateTo: string },
): AsyncGenerator<
  FtcComplaintListResponse['data'][number],
  void,
  void
> {
  const MAX_PAGES = 1000;
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await fetchFtcComplaintsPage(env, {
      ...dateRange,
      offset,
      itemsPerPage: MAX_ITEMS_PER_PAGE,
    });

    if (response.data.length === 0) return;

    for (const record of response.data) {
      yield record;
    }

    if (response.data.length < MAX_ITEMS_PER_PAGE) return;
    offset += MAX_ITEMS_PER_PAGE;
  }
}
