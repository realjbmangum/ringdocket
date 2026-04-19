/**
 * Typed write helpers for the BLOCKLIST R2 bucket.
 *
 * Layout (V1):
 *   - v{YYYYMMDD}.json  — full snapshot, immutable per day, 24h cache
 *   - current.json      — manifest pointing at the latest snapshot, 60s cache
 *
 * Cache headers:
 *   - Snapshots get 24h max-age. They never change once written for a given
 *     day; safe to cache aggressively at the edge.
 *   - The manifest gets 60s. Clients poll it to discover new versions, so
 *     long caches would defeat propagation.
 *
 * iOS Call Directory Extension contract: numbers in the payload MUST be
 * sorted ascending. Enforce that at write time, not at read time.
 */
import type {
  BlockListManifest,
  BlockListPayload,
} from '@ringdocket/shared';

const SNAPSHOT_CACHE_CONTROL = 'public, max-age=86400'; // 24h
const MANIFEST_CACHE_CONTROL = 'public, max-age=60';

/** Returns the R2 key for a snapshot of a given YYYYMMDD version. */
export function snapshotKey(version: string): string {
  return `v${version}.json`;
}

/** Returns the R2 key for the manifest. */
export function manifestKey(): string {
  return 'current.json';
}

/**
 * Write a block list snapshot to R2 at `v{version}.json`. Returns the
 * serialized JSON string the client will see byte-for-byte — pass it to
 * `sha256Hex` to compute the manifest checksum so the bytes hashed match
 * the bytes served.
 */
export async function writeSnapshot(
  bucket: R2Bucket,
  payload: BlockListPayload,
): Promise<string> {
  const json = JSON.stringify(payload);
  await bucket.put(snapshotKey(payload.version), json, {
    httpMetadata: {
      contentType: 'application/json',
      cacheControl: SNAPSHOT_CACHE_CONTROL,
    },
  });
  return json;
}

/** Write the manifest to R2 at `current.json`. */
export async function writeManifest(
  bucket: R2Bucket,
  manifest: BlockListManifest,
): Promise<void> {
  const json = JSON.stringify(manifest);
  await bucket.put(manifestKey(), json, {
    httpMetadata: {
      contentType: 'application/json',
      cacheControl: MANIFEST_CACHE_CONTROL,
    },
  });
}
