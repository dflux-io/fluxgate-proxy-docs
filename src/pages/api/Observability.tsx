import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import HttpMethod from '../../components/HttpMethod';
import { Link } from 'react-router-dom';

export default function Observability() {
  return (
    <DocPage
      slug="api/observability"
      lede="Deep health, config validation, and an aggregate metrics summary on the admin API. The Prometheus /metrics endpoint sits on the SBI listener, not under /admin; see the Metrics reference."
    >
      <h2 id="health">Deep health</h2>
      <p><HttpMethod method="GET" /> <code>/admin/health/deep</code></p>
      <p>
        Runs three coarse subsystem checks — whether any producers are configured, whether the
        control-plane store is reachable, and the state of the Diameter relay — and reports each
        result. Returns <code>200</code> when no check fails, otherwise <code>503</code>. Use as a
        Kubernetes readiness probe.
      </p>
      <CodeBlock lang="json" code={`{
  "status": "healthy",
  "timestamp": "2026-06-09T12:00:00Z",
  "checks": {
    "producers": "ok",
    "store": "ok",
    "diameter": "disabled"
  }
}`} />
      <p>
        <code>status</code> is <code>healthy</code>, <code>degraded</code>, or <code>unhealthy</code>.
        Each entry under <code>checks</code> is <code>ok</code>, <code>degraded</code>,
        <code>fail</code>, or — for an unconfigured Diameter relay — <code>disabled</code>.
      </p>

      <h2 id="validation">Config validation</h2>
      <p><HttpMethod method="POST" /> <code>/admin/config/validate</code></p>
      <p>
        Validates a candidate config payload (YAML or JSON, selected by the <code>Content-Type</code>
        header) without applying it. Returns <code>{`{"valid": true}`}</code> on success, or
        <code>{`{"valid": false, "errors": ["..."]}`}</code> with one string per validation failure.
      </p>
      <CodeBlock lang="json" code={`{
  "valid": false,
  "errors": [
    "admin.listen: missing port",
    "rate_limits[0].requests_per_second: must be > 0"
  ]
}`} />

      <h2 id="metrics-summary">Metrics summary</h2>
      <p><HttpMethod method="GET" /> <code>/admin/metrics/summary</code></p>
      <p>
        An aggregate snapshot of the registered metric families, rolled up for at-a-glance use.
        Distinct from the full <code>/metrics</code> Prometheus exposition on the SBI listener (see
        the <Link to="/reference/metrics">Metrics reference</Link>).
      </p>
      <p>Query parameters:</p>
      <ul>
        <li><code>prefix</code> — include only metric families whose name starts with this string.</li>
        <li><code>max_series</code> — cap the number of emitted series (default 10000).</li>
      </ul>
      <p>
        Series are grouped under <code>families</code>, keyed by metric name. When the
        <code>max_series</code> cap is hit, the response adds <code>{`"truncated": true`}</code> so a
        caller knows to narrow the request with <code>prefix</code>.
      </p>

      <h2 id="examples">Examples</h2>
      <CodeBlock lang="bash" code={`# Kubernetes readiness
curl -fsH "X-Admin-Key: $FGP_ADMIN_KEY" https://fgp.svc:9091/admin/health/deep

# Pre-deploy config validate
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:9091/admin/config/validate \\
  -d @candidate-config.json

# Aggregate metrics for the rate-limit subsystem
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  "https://fgp.svc:9091/admin/metrics/summary?prefix=fgp_ratelimit_&max_series=500" | jq`} />

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/reference/metrics">Metrics reference</Link> — the full Prometheus series list.</li>
        <li><Link to="/guides/observability">Observability guide</Link> — scrape, dashboards, alerts, tracing.</li>
        <li><Link to="/guides/audit-and-compliance">Auditing and compliance</Link> — shipping structured decision logs.</li>
      </ul>
    </DocPage>
  );
}
