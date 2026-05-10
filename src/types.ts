export interface ManifestPage {
  slug: string;     // URL path; '' for the index page
  title: string;
  group: string;    // group title from the manifest, or '' for ungrouped
}

export interface ManifestGroup {
  title: string;
  pages: ManifestPage[];
}

export interface Manifest {
  projectName: string;
  groups: ManifestGroup[];
  pages: ManifestPage[];      // flat ordered list for prev/next + slug lookup
}

export interface OutlineHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export type Theme = 'light' | 'dark';
