import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import { Link } from 'react-router-dom';

export default function RoutingSchema() {
  return (
    <DocPage
      slug="reference/routing-schema"
      lede="The shape of a routing rule. Match conditions (path / NF / SUPI / tenant / time window / AVP) decide when the rule fires; the targets list decides where the request goes, with weight, drain, and sticky-session controls."
    >
      <h2 id="top-level">Top-level shape</h2>
      <CodeBlock lang="json" code={`{
  "name": "string",
  "description": "string (optional)",
  "priority": 100,
  "match": {
    "method": "GET | POST | …",
    "path_prefix": "string",
    "nf_type": "UDM | AUSF | …",
    "supi_range": {
      "from": "imsi-001010000000000",
      "to":   "imsi-001010000999999",
      "prefix": "imsi-001010"
    },
    "tenant": "string",
    "time_window": {
      "timezone": "UTC",
      "days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
      "start": "08:00",
      "end": "20:00"
    },
    "avp": { /* AVPMatcher — see /reference/policy-schema */ }
  },
  "targets": [ /* RoutingTarget[] */ ]
}`} />

      <h2 id="evaluation">Evaluation</h2>
      <ul>
        <li>Rules are evaluated by <code>priority</code> ascending (lowest first). First match wins.</li>
        <li>If no rule matches, FGP falls back to the producer pool — NRF-discovered producers for the request's NF type, weighted by their NRF profile.</li>
        <li>If neither produces a target, the request is rejected with the appropriate protocol-level error (503 on SBI, <code>DIAMETER_UNABLE_TO_DELIVER</code> on Diameter).</li>
      </ul>

      <h2 id="match-fields">Match fields</h2>

      <h3 id="supi-range">supi_range</h3>
      <p>
        Either a numeric range (<code>from</code> + <code>to</code>) or a prefix
        (<code>prefix</code>). Use a prefix for "all SUPIs in PLMN 001/01"; use a range when
        you need to carve a contiguous SUPI block out for a tenant.
      </p>

      <h3 id="time-window">time_window</h3>
      <p>
        The rule fires only during the window. Outside the window, FGP falls through to the
        next rule. Useful for maintenance windows that route around a producer at a fixed time,
        or for off-peak routing changes.
      </p>
      <ul>
        <li><code>timezone</code> — IANA timezone name. Default <code>UTC</code>.</li>
        <li><code>days</code> — three-letter day list. Empty means all days.</li>
        <li><code>start</code> / <code>end</code> — <code>HH:MM</code>. A window that crosses midnight (<code>start &gt; end</code>) wraps correctly.</li>
      </ul>

      <h3 id="avp">avp</h3>
      <p>
        Diameter AVP matcher; same shape as in policy rules. See{' '}
        <Link to="/reference/policy-schema">Policy schema</Link>.
      </p>

      <h2 id="routing-target">RoutingTarget</h2>
      <CodeBlock lang="json" code={`{
  "address": "http://udm-cluster-a.svc:8080",
  "weight": 95,
  "sticky_session": true,
  "tags": ["region:eu-west", "tier:prod"]
}`} />

      <ul>
        <li><strong>address</strong> — producer URL (SBI) or Diameter peer URI.</li>
        <li>
          <strong>weight</strong> — selection weight relative to other targets on the same
          rule. Set to <code>0</code> to drain without removing.
        </li>
        <li>
          <strong>sticky_session</strong> — when true, FGP consistent-hashes the request's SUPI
          to pick a target. The same SUPI maps to the same target until the target set or
          weights change.
        </li>
        <li>
          <strong>tags</strong> — opaque labels. Useful for filtering in audit/metrics and for
          targeting later automation.
        </li>
      </ul>

      <h2 id="examples">Examples</h2>

      <h3 id="canary">Canary 5%</h3>
      <CodeBlock lang="json" code={`{
  "name": "udm-canary-5pct",
  "priority": 50,
  "match": {"nf_type": "UDM"},
  "targets": [
    {"address": "http://udm-prod.svc:8080",   "weight": 95},
    {"address": "http://udm-canary.svc:8080", "weight": 5}
  ]
}`} />

      <h3 id="supi-shard">SUPI shard</h3>
      <CodeBlock lang="json" code={`{
  "name": "udm-shard-tenant-eu",
  "priority": 10,
  "match": {
    "nf_type": "UDM",
    "supi_range": {"prefix": "imsi-001010"}
  },
  "targets": [
    {"address": "http://udm-eu-1.svc:8080", "weight": 50, "sticky_session": true},
    {"address": "http://udm-eu-2.svc:8080", "weight": 50, "sticky_session": true}
  ]
}`} />

      <h3 id="maintenance-window">Maintenance window</h3>
      <CodeBlock lang="json" code={`{
  "name": "ausf-maintenance",
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
}`} />

      <h3 id="diameter-realm">Diameter realm route</h3>
      <p>
        Diameter routing lives under the <code>diameter.routes[]</code> config block (not the
        general routing-rules CRUD). The two systems are independent — the general routing
        engine is for content-based picking; Diameter routes are realm-based and live with the
        rest of the Diameter config. See{' '}
        <Link to="/reference/config-schema">Config schema</Link>.
      </p>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/concepts/routing-engine">Routing engine</Link>.</li>
        <li><Link to="/api/routing">Admin API → Routing</Link>.</li>
        <li><Link to="/concepts/nrf-and-producers">NRF and producers</Link> — pool-based fallback.</li>
      </ul>
    </DocPage>
  );
}
