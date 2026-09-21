/**
 * GSC “Indexed, though blocked by robots.txt” acceptance (Nora triage 2026-09-21).
 * No live traffic numbers — file-level checks only.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const robots = readFileSync(join(root, 'public/robots.txt'), 'utf8');
const login = readFileSync(join(root, 'src/pages/login.astro'), 'utf8');
const redirects = readFileSync(join(root, 'public/_redirects'), 'utf8');

test('robots.txt keeps /app/ disallowed', () => {
  assert.match(robots, /^Disallow:\s*\/app\/$/m);
});

test('robots.txt does not Disallow /report-an-error', () => {
  assert.doesNotMatch(robots, /Disallow:\s*\/report-an-error/);
});

test('robots.txt does not Disallow /login', () => {
  assert.doesNotMatch(robots, /Disallow:\s*\/login/);
});

test('login page HTML declares noindex,follow', () => {
  assert.match(login, /robots="noindex,follow"/);
});

test('apex /login and /login/ still 301 to the app subdomain', () => {
  assert.match(
    redirects,
    /https:\/\/ringdocket\.com\/login\s+https:\/\/app\.ringdocket\.com\/login\s+301/,
  );
  assert.match(
    redirects,
    /https:\/\/ringdocket\.com\/login\/\s+https:\/\/app\.ringdocket\.com\/login\s+301/,
  );
});
