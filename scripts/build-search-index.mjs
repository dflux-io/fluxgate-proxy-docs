// Build-time content extractor for the search modal.
//
// Walks src/pages/**/*.tsx, strips JSX, splits each page into sections
// keyed by H2 IDs, and writes public/search-index.json. The runtime modal
// loads that file, builds a MiniSearch index in-browser, and serves
// queries from there.
//
// Each entry is one (page or section) — searching matches against the
// title, the heading, and a truncated body excerpt. Section entries
// link to `<slug>#<heading-id>` so results jump straight to the section
// instead of the page top.
//
// Run: node scripts/build-search-index.mjs   (also runs from `prebuild`)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PAGES_ROOT = path.join(ROOT, 'src', 'pages');
const MANIFEST_PATH = path.join(ROOT, 'src', 'manifest.ts');
const OUT_PATH = path.join(ROOT, 'public', 'search-index.json');

// ---------------------------------------------------------------------------
// Manifest parsing — we don't import manifest.ts (TS file, ESM-from-node is
// hairy); just regex out the slug+title+group rows. The manifest is the
// single source of truth for page metadata, so we read it rather than
// inferring from file paths.
// ---------------------------------------------------------------------------

function loadManifest() {
  const src = fs.readFileSync(MANIFEST_PATH, 'utf-8');
  // Match: { slug: 'guides/writing', title: 'Writing flows and suites', group: 'Guides' }
  const re = /\{\s*slug:\s*'([^']*)'\s*,\s*title:\s*'([^']+)'\s*,\s*group:\s*'([^']+)'\s*\}/g;
  const pages = new Map();
  for (const m of src.matchAll(re)) {
    pages.set(m[1], { slug: m[1], title: m[2], group: m[3] });
  }
  // Plus the index page (manually defined in manifest.ts) — title derives from
  // the manifest's projectName so this script stays project-agnostic.
  const projectName = src.match(/const projectName = '([^']+)'/)?.[1] ?? 'docs';
  pages.set('', { slug: '', title: `${projectName} docs`, group: '' });
  return pages;
}

// ---------------------------------------------------------------------------
// TSX scanning
// ---------------------------------------------------------------------------

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

// ---------------------------------------------------------------------------
// JSX → plain text
// ---------------------------------------------------------------------------

function stripJsxToText(s) {
  return s
    // Code blocks: keep the code content as searchable text (people grep
    // CLI flags, YAML field names, message types). Mermaid is decoration.
    .replace(/<CodeBlock\s+lang="[^"]*"\s+code=\{`([^`]*)`\}\s*\/>/g, ' $1 ')
    .replace(/<Mermaid\s+code=\{`[^`]*`\}\s*\/>/g, ' ')
    // HttpMethod renders as a pill in the UI but the method name is
    // semantically part of the heading — preserve it for indexing.
    .replace(/<HttpMethod\s+method="([^"]+)"\s*\/>/g, ' $1 ')
    // Inline backtick template literals — unwrap to their contents.
    .replace(/\{`([^`]*)`\}/g, '$1')
    // Other JSX expressions — drop them; they're component props / refs.
    .replace(/\{[^}]*\}/g, ' ')
    // Strip remaining JSX tags
    .replace(/<[^>]+>/g, ' ')
    // Common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#123;/g, '{')
    .replace(/&#125;/g, '}')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-zA-Z]+;/g, ' ')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

function trimToWords(s, max = 280) {
  if (s.length <= max) return s;
  // Cut at the last whitespace before max so we don't truncate mid-word.
  const slice = s.slice(0, max);
  const lastSp = slice.lastIndexOf(' ');
  return (lastSp > 0 ? slice.slice(0, lastSp) : slice) + '…';
}

// ---------------------------------------------------------------------------
// Per-page extraction
// ---------------------------------------------------------------------------

function pageEntries(file, manifest) {
  const slug = slugFromFile(file, manifest);
  if (slug === null) return [];      // not a page we know about (e.g. Glossary subdirs)
  const meta = manifest.get(slug);
  if (!meta) return [];

  let src = fs.readFileSync(file, 'utf-8');

  // Strip imports, exports, function wrappers down to the JSX body.
  src = src.replace(/^import[\s\S]+?from\s+['"][^'"]+['"];?\s*$/gm, '');
  src = src.replace(/export default function[\s\S]*?return\s*\(\s*/, '');
  src = src.replace(/\)\s*;?\s*\}\s*$/, '');

  // Extract `lede` prop value off the DocPage opening, if present.
  const ledeMatch = src.match(/<DocPage\b[^>]*\blede="([^"]+)"/);
  const lede = ledeMatch
    ? ledeMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    : '';

  // Drop the DocPage wrapper tags.
  src = src.replace(/<DocPage\b[^>]*>/, '');
  src = src.replace(/<\/DocPage>/, '');

  // Find H2 markers (with or without extra attributes). Each H2 starts a
  // section; the text between this H2 and the next is the section body.
  const h2Re = /<h2(?:\s+[^>]*)?id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g;
  const positions = [];
  for (const m of src.matchAll(h2Re)) {
    positions.push({ idx: m.index, end: m.index + m[0].length, id: m[1], rawTitle: m[2] });
  }

  const entries = [];

  // Pre-H2 region — this is the page lede + any intro prose before the
  // first section heading. Emit as a "page" entry so a query against the
  // top-level page concept lands on the page root.
  const preEnd = positions.length > 0 ? positions[0].idx : src.length;
  const preText = stripJsxToText(src.slice(0, preEnd));
  const pageBody = trimToWords(`${lede} ${preText}`.trim());
  entries.push({
    id: `${meta.slug}::__page`,
    type: 'page',
    slug: meta.slug,
    pageTitle: meta.title,
    section: meta.group,
    title: meta.title,
    body: pageBody,
  });

  // Each H2 section becomes its own entry.
  for (let i = 0; i < positions.length; i++) {
    const here = positions[i];
    const nextIdx = i + 1 < positions.length ? positions[i + 1].idx : src.length;
    const sectionBody = stripJsxToText(src.slice(here.end, nextIdx));
    const heading = stripJsxToText(here.rawTitle);
    entries.push({
      id: `${meta.slug}::${here.id}`,
      type: 'section',
      slug: `${meta.slug}#${here.id}`,
      pageTitle: meta.title,
      section: meta.group,
      title: heading,
      body: trimToWords(sectionBody),
    });
  }

  return entries;
}

// Derive a slug from a TSX file path. Returns null if unrecognised.
function slugFromFile(file, manifest) {
  const rel = path.relative(PAGES_ROOT, file).replace(/\\/g, '/');
  // Index.tsx → ''
  if (rel === 'Index.tsx') return '';
  // Glossary.tsx → 'glossary'
  if (rel === 'Glossary.tsx') return 'glossary';
  // <group>/<Component>.tsx → look up by reverse-mapping the component name
  // to a slug. Cheaper than reading routes: we can build a name→slug map.
  const componentBase = rel.replace(/\.tsx$/, '').split('/').pop();
  const group = rel.split('/')[0];
  // Try direct: kebab-case the component
  const kebab = componentBase
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  const guess = `${group}/${kebab}`;
  if (manifest.has(guess)) return guess;
  // A few one-offs: api/Subscribers → api/subscribers; api/Overview → api/overview, etc.
  // The kebab transform handles those. Things like "Cli" → "cli" also map fine.
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const manifest = loadManifest();
const files = walk(PAGES_ROOT);
const entries = [];
for (const file of files) {
  entries.push(...pageEntries(file, manifest));
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(entries));
const kb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
console.log(`✓ Wrote ${entries.length} entries (${kb} kB) → ${path.relative(ROOT, OUT_PATH)}`);
