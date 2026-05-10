import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import DocPage from '../components/DocPage';
import SectionCard from '../components/SectionCard';
import { sectionMeta } from '../manifest';

export default function Index() {
  const sections: { to: string; group: string; title: string; description: string }[] = [
    {
      to: '/introduction',
      group: 'Introduction',
      title: 'Start here',
      description: 'What fluxgate-proxy is, where it sits in your signaling plane, and when to pick it.',
    },
    {
      to: '/concepts/architecture',
      group: 'Concepts',
      title: 'Mental model',
      description: 'How one filter chain handles both 5G SBI and 4G Diameter, and what each stage does.',
    },
    {
      to: '/tutorials/first-sbi-policy',
      group: 'Tutorials',
      title: 'Hands-on',
      description: 'Walk-throughs: deploy your first policy, ship a transformation rule, bring up a Diameter peer.',
    },
    {
      to: '/guides/deploying',
      group: 'Guides',
      title: 'How-tos',
      description: 'Day-two operations: deploying, securing the admin API, audit, metrics, Postgres, hot reload.',
    },
    {
      to: '/reference/config-schema',
      group: 'Reference',
      title: 'Look it up',
      description: 'Authoritative schemas — every CLI flag, every YAML block, every Prometheus metric.',
    },
    {
      to: '/api/overview',
      group: 'API',
      title: 'Admin API',
      description: 'The admin HTTP surface: policy, rate limits, transforms, routing, peers, audit, health.',
    },
  ];

  return (
    <DocPage slug="" bare>
      {/* Hero */}
      <div className="not-prose mb-12 rounded-2xl border border-surface-border bg-surface-muted px-8 py-10 panel-glow">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-accent">
          <Sparkles size={14} strokeWidth={2} aria-hidden />
          fluxgate-proxy docs
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">
          5G SBI &amp; 4G Diameter signaling proxy
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">
          One Go binary that sits between NF consumers and producers, applying authentication,
          policy, rate limiting, transformation, content-based routing, and audit — across both
          HTTP/2 SBI and Diameter — at wire speed.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <Link
            to="/introduction"
            className="inline-flex items-center rounded-md bg-accent px-3 py-1.5 font-medium text-accent-fg transition-opacity hover:opacity-90"
          >
            Get started →
          </Link>
          <Link
            to="/concepts/architecture"
            className="inline-flex items-center rounded-md border border-surface-border bg-surface px-3 py-1.5 font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Read the concepts
          </Link>
        </div>
      </div>

      {/* Card grid */}
      <div className="not-prose grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const { Icon } = sectionMeta(s.group);
          return (
            <SectionCard
              key={s.to}
              to={s.to}
              Icon={Icon}
              section={s.group}
              title={s.title}
              description={s.description}
            />
          );
        })}
      </div>
    </DocPage>
  );
}
