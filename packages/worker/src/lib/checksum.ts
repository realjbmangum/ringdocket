/**
 * SHA-256 helpers backed by the Web Crypto API.
 *
 * Why Web Crypto and not `node:crypto` or a third-party library:
 *   - `crypto.subtle` is built into the Workers runtime — zero bundle cost.
 *   - Avoids the `node:crypto` import path and the `nodejs_compat` flag
 *     dance for a one-line operation.
 *   - Returning lowercase hex matches the `BlockListManifestSchema`
 *     `/^[a-f0-9]{64}$/` regex contract in `@ringdocket/shared`.
 */

/**
 * Compute the SHA-256 of the input and return it as a 64-char lowercase
 * hex string. Strings are encoded as UTF-8 before hashing.
 */
export async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const data =
    typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hashBuf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
