import {
  BookOpen,
  Lightbulb,
  GraduationCap,
  Wrench,
  Library,
  Plug,
  Book,
  type LucideIcon,
} from 'lucide-react';
import type { Manifest, ManifestGroup, ManifestPage } from './types';

// Single source of truth for the docs IA. Edit this file to add, rename,
// or reorder a page; the sidebar renders from the groups, prev/next
// derive from the flat ordered list, and DocPage looks up icon + section
// for the page header. Routes live in App.tsx — they must stay in sync
// with the slugs here.

const projectName = 'fluxgate-proxy';

interface SectionMeta {
  Icon: LucideIcon;
}

const sections: Record<string, SectionMeta> = {
  Introduction: { Icon: BookOpen },
  Concepts:     { Icon: Lightbulb },
  Tutorials:    { Icon: GraduationCap },
  Guides:       { Icon: Wrench },
  Reference:    { Icon: Library },
  API:          { Icon: Plug },
  Glossary:     { Icon: Book },
};

const groups: ManifestGroup[] = [
  {
    title: 'Introduction',
    pages: [
      { slug: 'introduction', title: 'Introduction', group: 'Introduction' },
      { slug: 'introduction/quickstart', title: 'Quickstart', group: 'Introduction' },
    ],
  },
  {
    title: 'Concepts',
    pages: [
      { slug: 'concepts/architecture', title: 'Architecture', group: 'Concepts' },
      { slug: 'concepts/request-pipeline', title: 'Request pipeline', group: 'Concepts' },
      { slug: 'concepts/policy-engine', title: 'Policy engine', group: 'Concepts' },
      { slug: 'concepts/transformation-engine', title: 'Transformation engine', group: 'Concepts' },
      { slug: 'concepts/routing-engine', title: 'Routing engine', group: 'Concepts' },
      { slug: 'concepts/nrf-and-producers', title: 'NRF and producers', group: 'Concepts' },
      { slug: 'concepts/diameter-peering', title: 'Diameter peering', group: 'Concepts' },
    ],
  },
  {
    title: 'Tutorials',
    pages: [
      { slug: 'tutorials/first-sbi-policy', title: 'Your first SBI policy', group: 'Tutorials' },
      { slug: 'tutorials/first-transformation-rule', title: 'Your first transformation rule', group: 'Tutorials' },
      { slug: 'tutorials/diameter-s6a-relay', title: 'Bring up a Diameter S6a relay', group: 'Tutorials' },
    ],
  },
  {
    title: 'Guides',
    pages: [
      { slug: 'guides/deploying', title: 'Deploying FGP', group: 'Guides' },
      { slug: 'guides/securing-the-admin-api', title: 'Securing the admin API', group: 'Guides' },
      { slug: 'guides/policy-versioning', title: 'Policy versioning and rollback', group: 'Guides' },
      { slug: 'guides/rate-limiting', title: 'Rate limiting', group: 'Guides' },
      { slug: 'guides/audit-and-compliance', title: 'Audit and compliance', group: 'Guides' },
      { slug: 'guides/observability', title: 'Observability', group: 'Guides' },
      { slug: 'guides/using-postgres', title: 'Using PostgreSQL', group: 'Guides' },
      { slug: 'guides/hot-reload-and-runtime-ops', title: 'Hot reload and runtime ops', group: 'Guides' },
    ],
  },
  {
    title: 'Reference',
    pages: [
      { slug: 'reference/fgp-cli', title: 'fgp CLI', group: 'Reference' },
      { slug: 'reference/fgpctl', title: 'fgpctl CLI', group: 'Reference' },
      { slug: 'reference/config-schema', title: 'Config schema', group: 'Reference' },
      { slug: 'reference/policy-schema', title: 'Policy schema', group: 'Reference' },
      { slug: 'reference/transformation-schema', title: 'Transformation schema', group: 'Reference' },
      { slug: 'reference/routing-schema', title: 'Routing schema', group: 'Reference' },
      { slug: 'reference/metrics', title: 'Metrics', group: 'Reference' },
    ],
  },
  {
    title: 'API',
    pages: [
      { slug: 'api/overview', title: 'Overview', group: 'API' },
      { slug: 'api/status-and-config', title: 'Status and config', group: 'API' },
      { slug: 'api/policy', title: 'Policy', group: 'API' },
      { slug: 'api/rate-limits', title: 'Rate limits', group: 'API' },
      { slug: 'api/transformations', title: 'Transformations', group: 'API' },
      { slug: 'api/routing', title: 'Routing', group: 'API' },
      { slug: 'api/producers-and-profiles', title: 'Producers and profiles', group: 'API' },
      { slug: 'api/observability', title: 'Observability', group: 'API' },
    ],
  },
  {
    title: 'Glossary',
    pages: [
      { slug: 'glossary', title: 'Glossary', group: 'Glossary' },
    ],
  },
];

const indexPage: ManifestPage = { slug: '', title: 'fluxgate-proxy docs', group: '' };

const flatPages: ManifestPage[] = [
  indexPage,
  ...groups.flatMap((g) => g.pages),
];

export const manifest: Manifest = {
  projectName,
  groups,
  pages: flatPages,
};

export function pageBySlug(slug: string): ManifestPage | undefined {
  return manifest.pages.find((p) => p.slug === slug);
}

export function neighbors(slug: string): { prev?: ManifestPage; next?: ManifestPage } {
  const idx = manifest.pages.findIndex((p) => p.slug === slug);
  if (idx < 0) return {};
  return {
    prev: idx > 0 ? manifest.pages[idx - 1] : undefined,
    next: idx < manifest.pages.length - 1 ? manifest.pages[idx + 1] : undefined,
  };
}

export function sectionMeta(group: string): SectionMeta {
  return sections[group] ?? { Icon: BookOpen };
}
