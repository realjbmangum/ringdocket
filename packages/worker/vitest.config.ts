import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          compatibilityDate: '2026-04-18',
          compatibilityFlags: ['nodejs_compat'],
          bindings: {
            SUPABASE_URL: 'https://test.supabase.co',
            SUPABASE_ANON_KEY: 'test-anon',
            SUPABASE_SERVICE_ROLE_KEY: 'test-srk',
            BLOCKLIST_PUBLIC_URL: 'https://blocklist.test.ringdocket.com',
          },
          kvNamespaces: ['RATE_LIMIT'],
          r2Buckets: ['BLOCKLIST', 'REPORTS'],
        },
      },
    },
  },
});
