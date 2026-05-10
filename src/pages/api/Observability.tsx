import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import HttpMethod from '../../components/HttpMethod';
import { Link } from 'react-router-dom';

export default function Observability() {
  return (
    <DocPage
      slug="api/observability"
      lede="Deep health, config and policy validation, an aggregate metrics summary, and the audit endpoints — both request audit and admin audit. The Prometheus /metrics endpoint sits on the SBI listener, not under /admin; see the Metrics reference."
    >
      <h2 id="health">Deep health</h2>
      <p><HttpMethod method="GET" /> <code>/admin/health/deep</code></p>
      <p>
        Walks the producer pool and reports each producer's reachability. Returns 200 only
        when at least one producer per configured NF type is reachable. Use as a Kubernetes
        readiness probe.
      </p>
      <CodeBlock lang="json" code={`{
  "ok": true,
  "nf_types": {
    "UDM":  {"reachable": 2, "total": 2},
    "AUSF": {"reachable": 1, "total": 2, "unreachable": ["http://ausf-2.svc:8080"]}
  }
}`} />

      <h2 id="validation">Validation</h2>
      <p><HttpMethod method="POST" /> <code>/admin/config/validate</code></p>
      <p>Validates a candidate config file (YAML or JSON) without applying it. Returns either <code>{`{"ok": true}`}</code> or a dotted-path error.</p>

      <p><HttpMethod method="POST" /> <code>/admin/policy/validate</code></p>
      <p>Validates a candidate policy document without applying it. Same shape and semantics as the policy <code>PUT</code> would use.</p>

      <h2 id="metrics-summary">Metrics summary</h2>
      <p><HttpMethod method="GET" /> <code>/admin/metrics/summary</code></p>
      <p>
        Aggregated metrics summary — counters and rates rolled up for at-a-glance use. Distinct
        from the full <code>/metrics</code> Prometheus exposition on the SBI listener (see
        <Link to="/reference/metrics">Metrics reference</Link>).
      </p>

      <h2 id="admin-audit">Admin audit log</h2>
      <p><HttpMethod method="GET" /> <code>/admin/audit/admin-actions</code></p>
      <p>
        Recent mutations to the admin API. Each record carries the actor identity (from API
        key, JWT, or mTLS), endpoint, path params, request id, and result.
      </p>
      <p>Query parameters:</p>
      <ul>
        <li><code>limit</code> — default 100, max 1000.</li>
      </ul>

      <h2 id="audit-query">Request audit query</h2>
      <p>
        The request audit trail is served by the SBI listener at <code>/audit</code>, not the
        admin port. <code>fgpctl audit</code> wraps this; the URL stays on the SBI port because
        the audit data is part of the daemon's runtime surface, not its control plane.
      </p>
      <p><HttpMethod method="GET" /> <code>http(s)://&lt;sbi&gt;/audit?limit=N</code></p>
      <p>
        Returns recent audit records — one per request decision. See{' '}
        <Link to="/guides/audit-and-compliance">Audit and compliance</Link> for the record
        shape and field list.
      </p>

      <h2 id="examples">Examples</h2>
      <CodeBlock lang="bash" code={`# Kubernetes readiness
curl -fsH "X-Admin-Key: $FGP_ADMIN_KEY" https://fgp.svc:8091/admin/health/deep

# Pre-deploy validate
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:8091/admin/policy/validate \\
  -d @candidate-policy.json

# Operator forensics
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  "https://fgp.svc:8091/admin/audit/admin-actions?limit=500" | jq

# Request-decision audit
curl -s "http://fgp.svc:8090/audit?limit=200" | jq`} />

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/reference/metrics">Metrics reference</Link> — the full Prometheus series list.</li>
        <li><Link to="/guides/observability">Observability guide</Link> — scrape, dashboards, alerts, tracing.</li>
        <li><Link to="/guides/audit-and-compliance">Audit and compliance</Link>.</li>
      </ul>
    </DocPage>
  );
}
