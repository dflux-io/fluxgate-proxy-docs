import { useEffect, useMemo, useState } from 'react';
import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { metricsSummary } from '../../generated/metricsSummary';
import { getMetrics, type MetricsCatalog, type MetricDef } from '../../lib/metrics';

const GROUP_LABEL: Record<string, string> = { proxy: 'Proxy', diameter: 'Diameter relay' };
const TYPE_TONE: Record<string, string> = {
  counter: 'text-blue-500 dark:text-blue-400',
  gauge: 'text-emerald-600 dark:text-emerald-400',
  histogram: 'text-amber-600 dark:text-amber-400',
  summary: 'text-violet-600 dark:text-violet-400',
};

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-muted px-4 py-3 panel-glow">
      <div className="text-2xl font-semibold tracking-tight text-ink">{value}</div>
      <div className="mt-0.5 text-xs text-ink-muted">{label}</div>
    </div>
  );
}

export default function Metrics() {
  const [catalog, setCatalog] = useState<MetricsCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMetrics().then(setCatalog).catch((e) => setError(String(e)));
  }, []);

  const grouped = useMemo(() => {
    if (!catalog) return [];
    const m = new Map<string, MetricDef[]>();
    for (const x of catalog.metrics) {
      if (!m.has(x.group)) m.set(x.group, []);
      m.get(x.group)!.push(x);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [catalog]);

  return (
    <DocPage
      slug="reference/metrics"
      lede="Every Prometheus series fluxgate-proxy exports, generated directly from the metric definitions in the source so the list never drifts. Standard Go runtime and process collectors are also exposed but omitted here."
    >
      <div className="not-prose grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard value={metricsSummary.total} label="metrics" />
        <StatCard value={metricsSummary.byType.counter ?? 0} label="counters" />
        <StatCard value={metricsSummary.byType.gauge ?? 0} label="gauges" />
        <StatCard value={metricsSummary.byType.histogram ?? 0} label="histograms" />
      </div>

      <h2 id="scrape">Scrape</h2>
      <p>
        The <code>{`/metrics`}</code> endpoint is served on both the SBI listener (<code>{`:8090`}</code>)
        and the admin listener (<code>{`:9091`}</code>), so metrics are reachable regardless of which
        listener your collector targets.
      </p>
      <CodeBlock lang="bash" code={`curl -s http://fgp.svc:9091/metrics\ncurl -s http://fgp.svc:8090/metrics`} />

      <Callout type="note">
        Counters and histograms that carry labels are registered lazily — a series first appears once
        it is observed, so an idle proxy exposes only a subset. The table below lists every metric the
        proxy can emit, from the source definitions.
      </Callout>

      {error && (
        <Callout type="warning" title="Metrics catalog unavailable">
          Could not load the metrics data ({error}). Run <code>{`npm run build:metrics`}</code> locally to regenerate it.
        </Callout>
      )}
      {!catalog && !error && <p className="text-sm text-ink-muted">Loading metrics…</p>}

      {grouped.map(([group, items]) => (
        <section key={group}>
          <h2 id={group}>{GROUP_LABEL[group] ?? group} metrics</h2>
          <div className="not-prose overflow-hidden rounded-lg border border-surface-border">
            <table className="w-full border-collapse text-sm">
              <tbody>
                {items.map((m, i) => (
                  <tr key={m.name} className={i % 2 ? 'bg-surface-muted/40' : ''} id={m.name}>
                    <td className="border-b border-surface-border px-3 py-2 align-top">
                      <div className="font-mono text-[13px] text-ink">{m.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${TYPE_TONE[m.type] ?? 'text-ink-subtle'}`}>
                          {m.type}
                        </span>
                        {m.labels.map((l) => (
                          <span key={l} className="rounded bg-surface-subtle px-1.5 py-0.5 font-mono text-[10px] text-ink-subtle">
                            {l}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="border-b border-surface-border px-3 py-2 align-top text-ink-muted">{m.help}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <p className="mt-8 text-xs text-ink-subtle">
        Generated from the source on {metricsSummary.generatedAt}. Regenerate with <code>{`npm run build:metrics`}</code>.
      </p>
    </DocPage>
  );
}
