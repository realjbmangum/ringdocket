/**
 * Type augmentation: tell `cloudflare:test` what bindings the test
 * environment exposes. Mirrors the `miniflare.bindings` block in
 * `vitest.config.ts`.
 */
import type { Env } from '../src/types';

declare module 'cloudflare:test' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface ProvidedEnv extends Env {}
}
