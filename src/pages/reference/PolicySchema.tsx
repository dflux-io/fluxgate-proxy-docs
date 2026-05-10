import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import { Link } from 'react-router-dom';

export default function PolicySchema() {
  return (
    <DocPage
      slug="reference/policy-schema"
      lede="The shape of every record under /admin/policy: PolicyRule, RateLimitRule, AVPMatcher, plus the tenant, threat-detection, and anomaly-scoring blocks. Same shapes accepted as JSON over the admin API or as JSON files passed to fgpctl with @file."
    >
      <h2 id="policy-rule">PolicyRule</h2>
      <CodeBlock lang="json" code={`{
  "name": "string",
  "action": "allow | deny",
  "description": "string (optional)",
  "match": {
    "method": "GET | POST | PUT | PATCH | DELETE | OPTIONS | HEAD",
    "path": "string (exact match)",
    "path_prefix": "string",
    "path_regex": "string (RE2)",
    "nf_type": "UDM | AUSF | PCF | UDR | SMF | AMF | NSSF | …",
    "source_nf_type": "string",
    "source_ip_cidrs": ["10.0.0.0/8", "192.168.1.0/24"],
    "tenant": "string (tenant id)",
    "supi_prefix": "imsi-001010",
    "gpsi_prefix": "msisdn-1555",
    "dnn": "string",
    "snssai": {"sst": 1, "sd": "010203"},
    "avp": { /* AVPMatcher, see below */ }
  }
}`} />

      <h3 id="match-semantics">Match semantics</h3>
      <ul>
        <li>A populated field is a constraint. Empty fields do not constrain.</li>
        <li>All populated fields must match for the rule to fire (logical AND across fields).</li>
        <li>SUPI / GPSI / DNN / S-NSSAI are extracted from the request URI and/or body where applicable.</li>
        <li>SBI-only fields (<code>method</code>, <code>path*</code>, <code>nf_type</code>) and Diameter-only fields (<code>avp</code>) coexist; a rule that populates only SBI fields will never match a Diameter request.</li>
      </ul>

      <h3 id="evaluation-order">Evaluation order</h3>
      <p>
        Rules are evaluated in <strong>store order</strong>. First match wins. There is no
        <code>priority</code> field on <code>PolicyRule</code>. See{' '}
        <Link to="/concepts/policy-engine">Policy engine</Link> for the model.
      </p>

      <h2 id="avp-matcher">AVPMatcher (Diameter)</h2>
      <CodeBlock lang="json" code={`{
  "command_code": 318,           // optional: match only this command
  "application_id": 16777251,    // optional: match only this app id
  "avps": [
    {
      "code": 1,                 // User-Name (string)
      "vendor_id": 0,
      "equals": "001010000000001@nai.epc.example.com"
    },
    {
      "code": 1032,              // RAT-Type (enum)
      "vendor_id": 10415,
      "in": [1004, 1006]
    },
    {
      "code": 1407,              // ULR-Flags (unsigned32)
      "vendor_id": 10415,
      "bit_set": 1
    }
  ]
}`} />

      <p>Each entry in <code>avps</code> can use:</p>
      <ul>
        <li><code>equals</code> — exact value match.</li>
        <li><code>in</code> — match any value in the list.</li>
        <li><code>prefix</code> — string prefix match.</li>
        <li><code>regex</code> — RE2 match on the AVP's string form.</li>
        <li><code>bit_set</code> / <code>bit_clear</code> — for bitmask AVPs.</li>
        <li><code>min</code> / <code>max</code> — numeric range.</li>
      </ul>
      <p>
        All AVP matchers within a single matcher are ANDed. Nested grouped AVPs are addressed
        with dotted codes (<code>700.701</code>) in the <code>code</code> field.
      </p>

      <h2 id="rate-limit-rule">RateLimitRule</h2>
      <CodeBlock lang="json" code={`{
  "name": "string",
  "rate": 100,                  // tokens / second
  "burst": 200,                 // bucket capacity
  "key": "consumer | supi | nf_type | consumer+supi | …",
  "match": {
    /* same shape as PolicyRule.match */
  },
  "description": "string (optional)"
}`} />

      <p>
        See <Link to="/guides/rate-limiting">Rate limiting</Link> for the operator patterns and
        cardinality caveats.
      </p>

      <h2 id="tenant">Tenant</h2>
      <CodeBlock lang="json" code={`{
  "name": "tenant-eu-west",
  "plmn": {"mcc": "001", "mnc": "01"},
  "description": "EU West tenant",
  "quotas": {
    "requests_per_second": 5000,
    "burst": 10000
  }
}`} />

      <p>
        Tenants are looked up at request time from the PLMN encoded in the SUPI (SBI) or
        Origin-Realm (Diameter). A request without a resolved tenant matches the empty-tenant
        bucket — rules can target that explicitly if you want to deny untenanted traffic.
      </p>

      <h2 id="threat-detection">Threat-detection config</h2>
      <CodeBlock lang="json" code={`{
  "imsi_catcher": {
    "enabled": true,
    "window_seconds": 60,
    "threshold": 100,
    "action": "deny | observe"
  },
  "location_tracking": {
    "enabled": true,
    "window_seconds": 300,
    "consumer_diversity_threshold": 5,
    "action": "deny | observe"
  }
}`} />

      <h2 id="anomaly-scoring">Anomaly-scoring config</h2>
      <CodeBlock lang="json" code={`{
  "enabled": true,
  "window_seconds": 60,
  "thresholds": {
    "deny": 90,
    "observe": 60
  },
  "weights": {
    "rare_path": 30,
    "off_hours": 10,
    "unknown_consumer": 25,
    "high_error_rate": 35
  }
}`} />

      <h2 id="full-policy">Full policy document</h2>
      <p>
        The full document returned by <code>GET /admin/policy</code> and accepted by{' '}
        <code>PUT /admin/policy</code> bundles every block above:
      </p>
      <CodeBlock lang="json" code={`{
  "version": 42,
  "default_action": "deny",
  "rules": [ /* PolicyRule[] */ ],
  "rate_limits": [ /* RateLimitRule[] */ ],
  "tenants": [ /* Tenant[] */ ],
  "threat_detection": { /* … */ },
  "anomaly_scoring": { /* … */ }
}`} />

      <p>Transformations and routing rules live under their own admin endpoints — see <Link to="/reference/transformation-schema">Transformation schema</Link> and <Link to="/reference/routing-schema">Routing schema</Link>.</p>

      <h2 id="validation">Validation</h2>
      <p>
        <code>POST /admin/policy/validate</code> runs the same shape-and-semantic checks the
        store does on update, without committing. Use it before deploying. See{' '}
        <Link to="/api/policy">Admin API → Policy</Link>.
      </p>
    </DocPage>
  );
}
