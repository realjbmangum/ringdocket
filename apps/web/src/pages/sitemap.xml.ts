/**
 * Build-time sitemap generator. Enumerates:
 *   - static marketing pages (/, /campaigns, /report-an-error)
 *   - all campaign slugs
 *   - all corroborated phone numbers
 *
 * Exported as a prerendered endpoint so it ships as a static XML file
 * at /sitemap.xml. Cloudflare Pages serves it at the apex.
 *
 * Robots.txt points at this URL. The auth'd /app/* routes are excluded
 * (they're noindex anyway).
 */

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = true;

const SITE = 'https://ringdocket.com';

const STATIC_URLS: Array<{ loc: string; changefreq: string; priority: string }> = [
  { loc: `${SITE}/`,                 changefreq: 'weekly',  priority: '1.0' },
  { loc: `${SITE}/campaigns`,        changefreq: 'daily',   priority: '0.9' },
  { loc: `${SITE}/report-an-error`,  changefreq: 'monthly', priority: '0.3' },
];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const url = (import.meta.env.PUBLIC_SUPABASE_URL as string | undefined)?.trim();
  const key = (import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined)?.trim();

  const entries: Array<{ loc: string; changefreq: string; priority: string }> = [
    ...STATIC_URLS,
  ];

  if (url && key) {
    const client = createClient(url, key, { auth: { persistSession: false } });

    // Campaign slugs — one per row.
    const { data: campaigns } = await client.from('campaigns').select('slug');
    for (const c of (campaigns ?? []) as Array<{ slug: string }>) {
      entries.push({
        loc: `${SITE}/campaigns/${c.slug}`,
        changefreq: 'daily',
        priority: '0.8',
      });
    }

    // Corroborated phone numbers — must mirror the prerender cap in
    // /number/[phone].astro (top 5,000 by reputation_score). Listing
    // numbers here that don't have a corresponding page would feed
    // Google 404s.
    const PAGE = 1000;
    const TARGET = 5000;
    for (let from = 0; from < TARGET; from += PAGE) {
      const to = Math.min(from + PAGE, TARGET) - 1;
      const { data, error } = await client
        .from('numbers')
        .select('phone')
        .eq('current_state', 'corroborated')
        .order('reputation_score', { ascending: false })
        .order('phone', { ascending: true })
        .range(from, to);
      if (error) {
        console.warn('[sitemap] numbers fetch failed:', error.message);
        break;
      }
      const rows = (data ?? []) as Array<{ phone: string }>;
      for (const row of rows) {
        const digits = row.phone.replace(/^\+/, '');
        entries.push({
          loc: `${SITE}/number/${digits}`,
          changefreq: 'weekly',
          priority: '0.5',
        });
      }
      if (rows.length < PAGE) break;
    }
  }

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries
      .map(
        (e) =>
          `  <url><loc>${escapeXml(e.loc)}</loc><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`,
      )
      .join('\n') +
    '\n</urlset>\n';

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
