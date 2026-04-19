#!/usr/bin/env node
/**
 * End-to-end verification of POST /api/report against the deployed worker.
 *
 * Prereqs:
 *  1. A test user exists in Supabase (Auth → Users → Add user with Auto Confirm enabled)
 *  2. The worker is deployed and has SUPABASE_SERVICE_ROLE_KEY set as a Secret
 *
 * Usage:
 *   node scripts/test-report.mjs
 *
 * Override defaults with env vars:
 *   TEST_EMAIL=... TEST_PASSWORD=... node scripts/test-report.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://odezxbaalqglfdjxbsyy.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZXp4YmFhbHFnbGZkanhic3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NTAyMTAsImV4cCI6MjA5MjEyNjIxMH0.QfjHZXPiCz6y42NQxf0-nqkVQP8WFs3rtBkK1X7Vb_Y';
const WORKER_URL = 'https://ringdocket-worker.bmangum1.workers.dev';

const email = process.env.TEST_EMAIL ?? 'test-001@ringdocket.com';
const password = process.env.TEST_PASSWORD ?? 'ringdocket-test-password-2026';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function header(title) {
  console.log(`\n\x1b[36m━━ ${title} ━━\x1b[0m`);
}

header(`Signing in as ${email}`);
let { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
  email,
  password,
});
if (authErr) {
  console.log(`  sign-in failed (${authErr.message}) — attempting signUp…`);
  const { data: signup, error: signupErr } = await supabase.auth.signUp({
    email,
    password,
  });
  if (signupErr) {
    console.error(`\x1b[31m✗ signUp also failed:\x1b[0m ${signupErr.message}`);
    process.exit(1);
  }
  if (!signup.session) {
    console.error(
      `\x1b[31m✗ signUp succeeded but no session returned.\x1b[0m\n` +
        `\nSupabase email confirmation is enabled. Either:\n` +
        `  A) Go to the Supabase dashboard → Authentication → Users and click\n` +
        `     the three-dot menu next to ${email} → "Confirm email", then rerun\n` +
        `     this script, OR\n` +
        `  B) Disable email confirmation globally in Authentication → Providers →\n` +
        `     Email → turn off "Confirm email" — NOT recommended for production\n` +
        `     but fine for test projects`,
    );
    process.exit(1);
  }
  auth = signup;
  console.log(`\x1b[32m✓\x1b[0m Created new test user`);
}
const jwt = auth.session?.access_token;
const userId = auth.user?.id;
if (!jwt || !userId) {
  console.error(`\x1b[31m✗ No session returned\x1b[0m`);
  process.exit(1);
}
console.log(`\x1b[32m✓\x1b[0m User ID: ${userId}`);
console.log(`\x1b[32m✓\x1b[0m JWT: ${jwt.slice(0, 32)}…`);

header(`POST ${WORKER_URL}/api/report`);
const payload = {
  number: '+14025550142',
  category: 'auto_warranty',
  notes: 'Test report from scripts/test-report.mjs',
};
console.log('Body:', JSON.stringify(payload, null, 2));

const res = await fetch(`${WORKER_URL}/api/report`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${jwt}`,
    'X-Device-Id': '22222222-2222-4222-8222-222222222222',
    // DO NOT set CF-Connecting-IP here. Cloudflare's edge strips and 403s
    // spoofed values; it auto-adds the real client IP. Only set this header
    // against `wrangler dev` running locally (no CF edge in front).
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

const body = await res.json().catch(() => null);
const statusColor = res.ok ? '\x1b[32m' : '\x1b[31m';
console.log(
  `\n${statusColor}HTTP ${res.status} ${res.statusText}\x1b[0m`,
);
console.log(JSON.stringify(body, null, 2));

if (!res.ok) {
  console.error('\n\x1b[31m✗ Request failed — check the details above\x1b[0m');
  process.exit(1);
}

header('Verifying row landed in pending_reports');
const { data: rows, error: rowsErr } = await supabase
  .from('pending_reports')
  .select('id, number, category, notes, user_id, submitted_at')
  .eq('user_id', userId)
  .eq('number', payload.number)
  .order('submitted_at', { ascending: false })
  .limit(1);

if (rowsErr) {
  console.error(
    `\x1b[31m✗ Could not query pending_reports:\x1b[0m ${rowsErr.message}\n  (this may be expected — RLS blocks cross-user reads. The row DID land if the worker returned 200.)`,
  );
} else if (rows && rows.length > 0) {
  console.log(`\x1b[32m✓\x1b[0m Row confirmed:`);
  console.log(JSON.stringify(rows[0], null, 2));
} else {
  console.warn(
    `\x1b[33m⚠ No row returned via RLS query\x1b[0m (worker returned success, so the row likely exists — check via Supabase SQL editor as postgres role)`,
  );
}

header('Done');
console.log(
  `Next: send a second report from a DIFFERENT user + device to the same number.\n` +
    `Once 3 distinct users corroborate within 14 days, the corroboration trigger\n` +
    `will promote the number to the public block list.`,
);
