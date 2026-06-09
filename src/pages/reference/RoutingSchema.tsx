import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function RoutingSchema() {
  return (
    <DocPage
      slug="reference/routing-schema"
      lede="The shape of a routing rule. A condition (path / method / NF type / SUPI range / time window and more) decides when the rule fires; a single target decides where the request goes, with weighting, failover, and sticky-session controls."
    >
      <h2 id="top-level">Top-level shape</h2>
      <p>
        A <code>RoutingRule</code> pairs a flat <code>condition</code> object with a single{' '}
        <code>target</code> object. A rule is ignored unless <code>enabled</code> is{' '}
        <code>true</code>.
      </p>
      <CodeBlock lang="json" code={`{
  "name": "string",
  "description": "string (optional)",
  "enabled": true,
  "priority": 100,
  "condition": {
    "path_patterns":    ["/nudm-sdm/v2/*"],
    "methods":          ["GET", "POST"],
    "source_nf_types":  ["AMF"],
    "target_nf_types":  ["UDM"],
    "api_versions":     ["v2"],
    "dnns":             ["internet"],
    "supi_ranges":      [ /* SupiRangeConfig[] */ ],
    "time_windows":     [ /* TimeWindow[] */ ],
    "header_match":     {"X-Tenant": "eu-west"},
    "body_field_match": {"snssai.sst": "1"},
    "protocols":        ["sbi"],
    "diameter_apps":    [16777251],
    "command_codes":    [316],
    "origin_realms":    ["epc.mnc001.mcc001.3gppnetwork.org"]
  },
  "target": { /* RoutingTarget */ }
}`} />
      <p>
        Every matcher in <code>condition</code> is optional; an empty matcher is a wildcard. A
        request matches a rule only when <em>all</em> populated matchers pass. The Diameter
        matchers (<code>diameter_apps</code>, <code>command_codes</code>,{' '}
        <code>origin_realms</code> / <code>origin_hosts</code> /{' '}
        <code>destination_realms</code> / <code>destination_hosts</code>) and the common SBI
        matchers are shared with the policy and rate-limit schemas — see{' '}
        <Link to="/reference/policy-schema">Policy schema</Link>.
      </p>

      <h2 id="evaluation">Evaluation</h2>
      <ul>
        <li>
          Only rules with <code>enabled: true</code> are evaluated. They are ordered by{' '}
          <code>priority</code> ascending (lowest first); ties break by <code>name</code>{' '}
          ascending so the decision is deterministic across restarts and replicas. The first
          matching rule wins.
        </li>
        <li>
          If no rule matches, the proxy falls back to the producer pool — NRF-discovered
          producers for the request's NF type.
        </li>
        <li>
          If neither produces a target, the request is rejected with the appropriate
          protocol-level error (<code>503</code> on SBI, <code>DIAMETER_UNABLE_TO_DELIVER</code>{' '}
          on Diameter).
        </li>
      </ul>

      <h2 id="condition-fields">Condition fields</h2>

      <h3 id="path-method-nf">path_patterns, methods, NF types</h3>
      <p>
        <code>path_patterns</code> is a list of glob-style path patterns (not a bare prefix);
        <code>methods</code> is a list of HTTP methods. NF type matching is split into{' '}
        <code>source_nf_types</code> (the consumer) and <code>target_nf_types</code> (the
        producer NF type the request is bound for) — there is no single <code>nf_type</code>{' '}
        condition field.
      </p>

      <h3 id="supi-ranges">supi_ranges</h3>
      <p>
        A list of <code>SupiRangeConfig</code> entries. Each entry is either a numeric range
        (<code>start</code> + <code>end</code>) or a pattern (<code>pattern</code>). Use a
        pattern for "all SUPIs in PLMN 001/01"; use a range to carve a contiguous SUPI block out
        for a tenant.
      </p>
      <CodeBlock lang="json" code={`"supi_ranges": [
  {"pattern": "imsi-001010*"},
  {"start": "imsi-001010000000000", "end": "imsi-001010000999999"}
]`} />

      <h3 id="time-windows">time_windows</h3>
      <p>
        A list of <code>TimeWindow</code> entries. The rule's time condition passes when the
        current time falls inside any window. Outside every window the rule does not match and
        the engine falls through to the next rule. Useful for maintenance windows that route
        around a producer at a fixed time, or for off-peak routing changes.
      </p>
      <ul>
        <li><code>timezone</code> — IANA timezone name. Default <code>UTC</code>.</li>
        <li>
          <code>days_of_week</code> — full day names (<code>Monday</code> … <code>Sunday</code>).
          Three-letter abbreviations are rejected by validation. Empty means all days.
        </li>
        <li>
          <code>start_time</code> / <code>end_time</code> — <code>HH:MM</code>, both required.
        </li>
      </ul>
      <Callout type="warning">
        A window does not wrap across midnight. The window matches only while the current time is
        at or after <code>start_time</code> and strictly before <code>end_time</code>, so a
        window with <code>start_time</code> later than <code>end_time</code> matches nothing.
        Split an overnight window into two rules (one ending at <code>23:59</code>, one starting
        at <code>00:00</code>).
      </Callout>

      <h3 id="header-body-match">header_match, body_field_match</h3>
      <p>
        <code>header_match</code> matches request header values by name; <code>body_field_match</code>{' '}
        matches dotted JSON body field paths. Both are exact-match string maps where every entry
        must match.
      </p>

      <h2 id="routing-target">RoutingTarget</h2>
      <p>
        A rule has exactly one <code>target</code>. Addresses live under <code>producers</code>{' '}
        (weighted round-robin across endpoints) or <code>weighted_targets</code> (a canary /
        percentage split). A target must specify at least one of <code>nf_type</code>,{' '}
        <code>producers</code>, or <code>weighted_targets</code>.
      </p>
      <CodeBlock lang="json" code={`{
  "nf_type": "UDM",
  "producers": [
    {"address": "http://udm-eu-1.svc:8080", "weight": 50},
    {"address": "http://udm-eu-2.svc:8080", "weight": 50}
  ],
  "weighted_targets": [],
  "sticky_key": "supi",
  "sticky_ttl": "300s",
  "failover": {
    "producers": [{"address": "http://udm-failover.svc:8080"}],
    "trigger_on_status": [503],
    "trigger_on_result_code": [3002, 3004],
    "max_retries": 2
  }
}`} />

      <ul>
        <li>
          <strong>nf_type</strong> — when set without explicit endpoints, the request is routed
          to the NRF-discovered pool for that NF type.
        </li>
        <li>
          <strong>producers</strong> — a list of <code>{`{address, weight}`}</code> endpoints
          selected by weighted random choice. <code>address</code> is a producer URL (SBI) or
          Diameter peer URI. A non-positive <code>weight</code> is coerced to <code>1</code>,
          so a weight of <code>0</code> still receives traffic — it does not drain a producer.
        </li>
        <li>
          <strong>weighted_targets</strong> — a list of <code>{`{address, weight}`}</code> for a
          canary or percentage split. Each <code>weight</code> must be <code>1</code>–
          <code>100</code> and the set must sum to exactly <code>100</code>; validation rejects
          anything else.
        </li>
        <li>
          <strong>sticky_key</strong> — the field used to pin a flow to one target. Configurable
          across six values: <code>supi</code>, <code>gpsi</code>, <code>imsi</code>,{' '}
          <code>session_id</code>, <code>origin_host</code>, <code>request_id</code>. The
          extracted value is looked up in a TTL-bounded sticky store; a hit reuses the prior
          target, otherwise a fresh selection is made and stored. (This is a TTL store keyed by
          the extracted value, not consistent hashing.)
        </li>
        <li>
          <strong>sticky_ttl</strong> — required when <code>sticky_key</code> is set, and must be{' '}
          greater than zero. Duration string, e.g. <code>"300s"</code>.
        </li>
        <li>
          <strong>failover</strong> — fallback producers engaged when the primary target fails.
          <code>trigger_on_status</code> lists HTTP status codes that trigger SBI failover;{' '}
          <code>trigger_on_result_code</code> lists Diameter Result-Code values that turn an
          otherwise-successful answer into a failover trigger (e.g. <code>3002</code>{' '}
          <code>DIAMETER_UNABLE_TO_DELIVER</code>); <code>max_retries</code> caps re-attempts.
          <code>failover.producers</code> is required when <code>failover</code> is set.
        </li>
      </ul>

      <h2 id="examples">Examples</h2>

      <h3 id="canary">Canary 5%</h3>
      <CodeBlock lang="json" code={`{
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
}`} />

      <h3 id="supi-shard">SUPI shard</h3>
      <CodeBlock lang="json" code={`{
  "name": "udm-shard-tenant-eu",
  "enabled": true,
  "priority": 10,
  "condition": {
    "target_nf_types": ["UDM"],
    "supi_ranges": [{"pattern": "imsi-001010*"}]
  },
  "target": {
    "producers": [
      {"address": "http://udm-eu-1.svc:8080", "weight": 50},
      {"address": "http://udm-eu-2.svc:8080", "weight": 50}
    ],
    "sticky_key": "supi",
    "sticky_ttl": "300s"
  }
}`} />

      <h3 id="maintenance-window">Maintenance window</h3>
      <CodeBlock lang="json" code={`{
  "name": "ausf-maintenance",
  "enabled": true,
  "priority": 5,
  "condition": {
    "target_nf_types": ["AUSF"],
    "time_windows": [{
      "timezone": "Europe/Lisbon",
      "days_of_week": ["Sunday"],
      "start_time": "02:00",
      "end_time": "04:00"
    }]
  },
  "target": {
    "producers": [{"address": "http://ausf-failover.svc:8080"}]
  }
}`} />

      <h3 id="diameter-realm">Diameter realm route</h3>
      <p>
        Realm-based Diameter routing lives under the <code>diameter.routes[]</code> config block,
        independent of the routing-rule CRUD documented here: the routing engine is for
        content-based picking, while Diameter realm routes ship with the rest of the Diameter
        config. See <Link to="/reference/config-schema">Config schema</Link>.
      </p>

      <h2 id="where-next">Where to go next</h2>
      <ul>
        <li><Link to="/concepts/routing-engine">Routing engine</Link> — how rules are evaluated.</li>
        <li><Link to="/api/routing">Admin API → Routing</Link> — managing rules over the admin API.</li>
        <li><Link to="/concepts/nrf-and-producers">NRF and producers</Link> — pool-based fallback.</li>
      </ul>
    </DocPage>
  );
}
