// Generate public/sitemap.xml from the manifest's slug list.
//
// Base URL is read from the SITE_URL env var (set in Vercel project settings),
// defaulting to the canonical Vercel preview URL. Robots get a sitemap they
// can index; humans get nothing — clients hit the SPA anyway.
//
// Run: node scripts/build-sitemap.mjs   (also runs from `build`)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'src', 'manifest.ts');
const OUT_SITEMAP = path.join(ROOT, 'public', 'sitemap.xml');
const OUT_ROBOTS = path.join(ROOT, 'public', 'robots.txt');

const SITE_URL = (process.env.SITE_URL || 'https://fluxgate-proxy-docs.vercel.app').replace(/\/+$/, '');

function loadSlugs() {
  const src = fs.readFileSync(MANIFEST_PATH, 'utf-8');
  const re = /\{\s*slug:\s*'([^']*)'\s*,\s*title:\s*'[^']+'\s*,\s*group:\s*'[^']*'\s*\}/g;
  const slugs = [''];
  for (const m of src.matchAll(re)) slugs.push(m[1]);
  return slugs;
}

const today = new Date().toISOString().slice(0, 10);
const slugs = loadSlugs();
const urls = slugs.map((slug) => `  <url>
    <loc>${SITE_URL}/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

fs.mkdirSync(path.dirname(OUT_SITEMAP), { recursive: true });
fs.writeFileSync(OUT_SITEMAP, sitemap);
fs.writeFileSync(OUT_ROBOTS, robots);
console.log(`✓ Wrote ${slugs.length} URLs → public/sitemap.xml`);
console.log(`✓ Wrote public/robots.txt`);
