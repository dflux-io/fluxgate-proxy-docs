import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import HttpMethod from '../../components/HttpMethod';
import { Link } from 'react-router-dom';

export default function Routing() {
  return (
    <DocPage
      slug="api/routing"
      lede="CRUD for content-based routing rules. See Routing schema for the rule shape and Routing engine for the evaluation model."
    >
      <h2 id="endpoints">Endpoints</h2>

      <p><HttpMethod method="GET" /> <code>/admin/routing-rules</code></p>
      <p>Lists all routing rules.</p>

      <p><HttpMethod method="POST" /> <code>/admin/routing-rules</code></p>
      <p>Creates a routing rule. 409 if a rule by that name exists.</p>

      <p><HttpMethod method="GET" /> <code>/admin/routing-rules/{`{name}`}</code></p>
      <p>Returns one routing rule.</p>

      <p><HttpMethod method="PUT" /> <code>/admin/routing-rules/{`{name}`}</code></p>
      <p>Updates a routing rule. Upsert.</p>

      <p><HttpMethod method="DELETE" /> <code>/admin/routing-rules/{`{name}`}</code></p>
      <p>Deletes a routing rule. Idempotent.</p>

      <h2 id="examples">Examples</h2>

      <h3 id="canary">Canary 5%</h3>
      <CodeBlock lang="bash" code={`curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:8091/admin/routing-rules \\
  -d '{
    "name": "udm-canary-5pct",
    "priority": 50,
    "match": {"nf_type": "UDM"},
    "targets": [
      {"address": "http://udm-prod.svc:8080",   "weight": 95},
      {"address": "http://udm-canary.svc:8080", "weight": 5}
    ]
  }'`} />

      <h3 id="cutover">Cutover via weight</h3>
      <p>Shift the canary to 100% in one update:</p>
      <CodeBlock lang="bash" code={`curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X PUT https://fgp.svc:8091/admin/routing-rules/udm-canary-5pct \\
  -d '{
    "name": "udm-canary-5pct",
    "priority": 50,
    "match": {"nf_type": "UDM"},
    "targets": [
      {"address": "http://udm-prod.svc:8080",   "weight": 0},
      {"address": "http://udm-canary.svc:8080", "weight": 100}
    ]
  }'`} />

      <h3 id="maintenance-window">Maintenance window</h3>
      <CodeBlock lang="bash" code={`curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:8091/admin/routing-rules \\
  -d '{
    "name": "ausf-sunday-maintenance",
    "priority": 5,
    "match": {
      "nf_type": "AUSF",
      "time_window": {
        "timezone": "Europe/Lisbon",
        "days": ["Sun"],
        "start": "02:00",
        "end": "04:00"
      }
    },
    "targets": [
      {"address": "http://ausf-failover.svc:8080", "weight": 100}
    ]
  }'`} />

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/concepts/routing-engine">Routing engine</Link>.</li>
        <li><Link to="/reference/routing-schema">Routing schema</Link>.</li>
        <li><Link to="/api/producers-and-profiles">Admin API → Producers and profiles</Link> — runtime peer ops.</li>
      </ul>
    </DocPage>
  );
}
