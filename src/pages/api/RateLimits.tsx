import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import HttpMethod from '../../components/HttpMethod';
import { Link } from 'react-router-dom';

export default function RateLimits() {
  return (
    <DocPage
      slug="api/rate-limits"
      lede="CRUD for rate-limit rules. See Policy schema for the rule shape and the Rate limiting guide for the operator-flow patterns."
    >
      <h2 id="endpoints">Endpoints</h2>

      <p><HttpMethod method="GET" /> <code>/admin/rate-limits</code></p>
      <p>Lists all rate-limit rules.</p>

      <p><HttpMethod method="POST" /> <code>/admin/rate-limits</code></p>
      <p>Creates a rate-limit rule. 409 if a rule by that name exists.</p>

      <p><HttpMethod method="GET" /> <code>/admin/rate-limits/{`{name}`}</code></p>
      <p>Returns one rate-limit rule.</p>

      <p><HttpMethod method="PUT" /> <code>/admin/rate-limits/{`{name}`}</code></p>
      <p>Updates a rate-limit rule. Upsert.</p>

      <p><HttpMethod method="DELETE" /> <code>/admin/rate-limits/{`{name}`}</code></p>
      <p>Deletes a rate-limit rule. Idempotent.</p>

      <h2 id="examples">Examples</h2>
      <CodeBlock lang="bash" code={`# list
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  https://fgp.svc:8091/admin/rate-limits | jq

# create a per-consumer cap on UDM traffic
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:8091/admin/rate-limits \\
  -d '{
    "name": "per-consumer-udm",
    "rate": 100,
    "burst": 200,
    "key": "consumer",
    "match": {"nf_type": "UDM"}
  }'

# bump the burst
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X PUT https://fgp.svc:8091/admin/rate-limits/per-consumer-udm \\
  -d '{
    "name": "per-consumer-udm",
    "rate": 100,
    "burst": 500,
    "key": "consumer",
    "match": {"nf_type": "UDM"}
  }'

# remove it
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  -X DELETE https://fgp.svc:8091/admin/rate-limits/per-consumer-udm`} />

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/reference/policy-schema">Policy schema</Link> — <code>RateLimitRule</code> shape.</li>
        <li><Link to="/guides/rate-limiting">Rate limiting</Link> — operator patterns, key choice, cardinality.</li>
        <li><Link to="/reference/metrics">Metrics</Link> — <code>fgp_rate_limit_exceeded_total</code>.</li>
      </ul>
    </DocPage>
  );
}
