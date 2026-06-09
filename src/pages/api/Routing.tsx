import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import HttpMethod from '../../components/HttpMethod';
import { Link } from 'react-router-dom';

export default function Routing() {
  return (
    <DocPage
      slug="api/routing"
      lede="CRUD for content-based routing rules through the unified rules surface. See the routing schema for the rule shape and the routing engine for the evaluation model."
    >
      <p>
        All examples assume the <code>X-Admin-Key</code> header and base URL from{' '}
        <Link to="/api/overview">the admin API overview</Link>. Every write here is hot-reloaded —
        no restart, no dropped requests; see <Link to="/api/overview">the overview</Link> for the
        hot-reload guarantee.
      </p>

      <h2 id="endpoints">Endpoints</h2>
      <p>
        Routing rules are managed on the unified rules surface at <code>/admin/rules</code>, shared
        with policy, transformation, and rate-limit rules. Each rule carries a <code>type</code>{' '}
        discriminator; for routing it is <code>"routing"</code>. See{' '}
        <Link to="/api/policy#rules">Admin API → Policy</Link> for the full surface and the global
        name-uniqueness rules.
      </p>

      <p><HttpMethod method="GET" /> <code>/admin/rules?type=routing</code></p>
      <p>
        Lists routing rules. Without the <code>?type=routing</code> filter the response interleaves
        all four rule types, each entry carrying its <code>type</code>.
      </p>

      <p><HttpMethod method="POST" /> <code>/admin/rules</code></p>
      <p>
        Creates a routing rule. The body is a <code>RoutingRule</code> with <code>"type": "routing"</code>.
        Rule names are globally unique across all four types: <code>409</code> if any rule already
        owns the name.
      </p>

      <p><HttpMethod method="GET" /> <code>/admin/rules/{`{name}`}</code></p>
      <p>Returns one rule by name. The response carries an <code>ETag</code> for optimistic concurrency.</p>

      <p><HttpMethod method="PUT" /> <code>/admin/rules/{`{name}`}</code></p>
      <p>
        Updates an existing routing rule. Returns <code>404</code> if no rule owns the name — this is
        not an upsert; create through <code>POST</code> instead. If the body declares a{' '}
        <code>type</code>, it must match the existing rule's type. Send the rule's <code>ETag</code>{' '}
        in <code>If-Match</code> for a guarded update.
      </p>

      <p><HttpMethod method="DELETE" /> <code>/admin/rules/{`{name}`}</code></p>
      <p>Deletes one rule by name. Returns <code>404</code> if no rule owns the name.</p>

      <h2 id="examples">Examples</h2>

      <h3 id="canary">Canary 5%</h3>
      <p>
        A weighted split routes 5% of UDM-targeted traffic to a canary producer. Weights are
        percentages that must sum to 100.
      </p>
      <CodeBlock lang="bash" code={`curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:9091/admin/rules \\
  -d '{
    "type": "routing",
    "name": "udm-canary-5pct",
    "enabled": true,
    "priority": 50,
    "condition": {"target_nf_types": ["UDM"]},
    "target": {
      "weighted_targets": [
        {"address": "http://udm-prod.svc:8080",   "weight": 95},
        {"address": "http://udm-canary.svc:8080", "weight": 5}
      ]
    }
  }'`} />

      <h3 id="cutover">Cutover via weight</h3>
      <p>Shift the canary to 100% in one update:</p>
      <CodeBlock lang="bash" code={`curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  -H "Content-Type: application/json" \\
  -X PUT https://fgp.svc:9091/admin/rules/udm-canary-5pct \\
  -d '{
    "type": "routing",
    "name": "udm-canary-5pct",
    "enabled": true,
    "priority": 50,
    "condition": {"target_nf_types": ["UDM"]},
    "target": {
      "weighted_targets": [
        {"address": "http://udm-canary.svc:8080", "weight": 100}
      ]
    }
  }'`} />

      <h3 id="maintenance-window">Maintenance window</h3>
      <p>
        A time window routes AUSF traffic to a failover producer during a Sunday maintenance slot.
        Days use full names; times are <code>HH:MM</code> in the rule's timezone.
      </p>
      <CodeBlock lang="bash" code={`curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:9091/admin/rules \\
  -d '{
    "type": "routing",
    "name": "ausf-sunday-maintenance",
    "enabled": true,
    "priority": 5,
    "condition": {
      "target_nf_types": ["AUSF"],
      "time_windows": [
        {
          "timezone": "Europe/Lisbon",
          "days_of_week": ["Sunday"],
          "start_time": "02:00",
          "end_time": "04:00"
        }
      ]
    },
    "target": {
      "producers": [
        {"address": "http://ausf-failover.svc:8080"}
      ]
    }
  }'`} />

      <h3 id="sticky-sessions">Sticky sessions</h3>
      <p>
        Set <code>sticky_key</code> to pin a session to one producer by a request field, with a TTL
        on the binding:
      </p>
      <CodeBlock lang="bash" code={`curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:9091/admin/rules \\
  -d '{
    "type": "routing",
    "name": "smf-sticky-by-supi",
    "enabled": true,
    "priority": 20,
    "condition": {"target_nf_types": ["SMF"]},
    "target": {
      "sticky_key": "supi",
      "sticky_ttl": "300s",
      "weighted_targets": [
        {"address": "http://smf-a.svc:8080", "weight": 50},
        {"address": "http://smf-b.svc:8080", "weight": 50}
      ]
    }
  }'`} />

      <h2 id="where-to-go-next">Where to go next</h2>
      <ul>
        <li><Link to="/reference/routing-schema">Routing schema</Link> — the full <code>RoutingRule</code> shape.</li>
        <li><Link to="/concepts/routing-engine">Routing engine</Link> — priority, weighting, and failover semantics.</li>
        <li><Link to="/api/producers-and-profiles">Admin API → Producers and profiles</Link> — runtime peer ops.</li>
        <li><Link to="/api/overview">Admin API overview</Link> — auth, base URL, error model, and idempotency.</li>
      </ul>
    </DocPage>
  );
}
