import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import { Link } from 'react-router-dom';

export default function PolicySchema() {
  return (
    <DocPage
      slug="reference/policy-schema"
      lede="The shape of every record under /admin/policy: PolicyRule, AVPMatcher, and RateLimitRule, plus the full PolicyConfig document. The same shapes are returned as JSON over the admin API or accepted as JSON files passed to fgpctl with @file."
    >
      <h2 id="policy-rule">PolicyRule</h2>
      <p>
        A <code>PolicyRule</code> is a flat object. The request matchers shared with
        transformation and routing rules (<code>CommonConditions</code>) are promoted onto the
        rule body, so there is no nested <code>match</code> wrapper.
      </p>
      <CodeBlock lang="json" code={`{
  "name": "string",
  "priority": 100,                          // lower evaluates first; ties broken by name
  "action": "allow | deny",

  // CommonConditions — SBI request matchers (all arrays; OR within, AND across)
  "path_patterns": ["/nudm-sdm/v2/*"],      // glob patterns on the request path
  "methods": ["GET", "POST"],
  "source_nf_types": ["AMF"],
  "target_nf_types": ["UDM"],
  "snssais": [{"sst": 1, "sd": "010203"}],
  "visited_plmns": [{"mcc": "001", "mnc": "01"}],

  // CommonConditions — protocol scope (empty = both SBI and Diameter)
  "protocols": ["sbi", "diameter"],

  // CommonConditions — Diameter matchers
  "diameter_apps": [16777251],
  "command_codes": [316],
  "origin_realms": ["epc.mnc001.mcc001.3gppnetwork.org"],
  "origin_hosts": ["mme01.epc.example.com"],
  "destination_realms": ["epc.example.com"],
  "destination_hosts": ["hss01.epc.example.com"],
  "imsi_ranges": [{"start": "001010000000000", "end": "001010000099999"}],

  // Policy-specific matchers
  "supi_ranges": [{"pattern": "imsi-001010*"}],
  "gpsi_patterns": ["msisdn-1555*"],
  "dnns": ["internet"],
  "diameter_app_ranges": [[16777251, 16777252]],
  "avps": [ /* AVPMatcher[], see below */ ]
}`} />

      <h3 id="match-semantics">Match semantics</h3>
      <ul>
        <li>A populated field is a constraint. Empty fields are wildcards and do not constrain.</li>
        <li>All populated fields must match for the rule to fire (logical AND across fields). Within a single array, values are OR-ed.</li>
        <li>
          SUPI / GPSI / DNN / S-NSSAI are extracted from the request URI and/or body where
          applicable. <code>supi_ranges</code> entries take <code>start</code>/<code>end</code>{' '}
          or a <code>pattern</code>; <code>snssais</code> entries take <code>sst</code> (and
          optional <code>sd</code>).
        </li>
        <li>
          SBI-only fields (<code>path_patterns</code>, <code>methods</code>,{' '}
          <code>source_nf_types</code>, <code>target_nf_types</code>, <code>snssais</code>,{' '}
          <code>visited_plmns</code>) and Diameter-only fields (<code>avps</code>,{' '}
          <code>command_codes</code>, <code>diameter_apps</code>, <code>origin_realms</code>, …)
          coexist; a rule that populates only SBI fields will never match a Diameter request.
        </li>
      </ul>

      <h3 id="evaluation-order">Evaluation order</h3>
      <p>
        Rules are evaluated by <strong>priority ascending</strong> (lower{' '}
        <code>priority</code> first), with equal priorities broken by <code>name</code> ascending
        for deterministic ordering across restarts and replicas. The first matching rule decides
        allow or deny. See <Link to="/concepts/policy-engine">Policy engine</Link> for the model.
      </p>

      <h2 id="avp-matcher">AVPMatcher (Diameter)</h2>
      <p>
        An <code>AVPMatcher</code> matches a single AVP by <code>code</code> + <code>vendor_id</code>{' '}
        against a set of allowed string values and/or a regex on the value's string form. At least
        one of <code>equals</code> or <code>regex</code> must be set. Command and application
        matching live on the rule itself (<code>command_codes</code> / <code>diameter_apps</code>),
        not on the matcher.
      </p>
      <CodeBlock lang="json" code={`{
  "code": 1,                                       // User-Name (string)
  "vendor_id": 0,
  "equals": ["001010000000001@nai.epc.example.com"]
}`} />

      <p>Each <code>AVPMatcher</code> supports:</p>
      <ul>
        <li><code>code</code> — the AVP code (required).</li>
        <li><code>vendor_id</code> — vendor ID; omit or <code>0</code> for base protocol.</li>
        <li><code>equals</code> — array of allowed values; the AVP matches if it equals any of them (any-of).</li>
        <li><code>regex</code> — RE2 match on the AVP's string form. OR-ed with <code>equals</code>.</li>
      </ul>
      <p>
        Multiple <code>AVPMatcher</code> entries on a rule are AND-ed. Values are coerced to their
        string form before matching: OctetString as hex (e.g. <code>0x24f520</code>),
        UTF8String / DiameterIdentity as the raw string, and Unsigned32 / Integer32 / Enumerated as
        a decimal string. Scalar AVPs only — grouped AVPs are skipped on the lookup walk.
      </p>

      <h2 id="rate-limit-rule">RateLimitRule</h2>
      <CodeBlock lang="json" code={`{
  "name": "string",
  "source_nf_type": "AMF",       // optional: scope to one source NF type
  "rps": 100,                    // tokens / second (float)
  "burst": 200,                  // bucket capacity
  "key_by_supi": false,          // rate limit per subscriber SUPI
  "key": "global"                // bucket dimension; see below
}`} />

      <p><code>key</code> selects the bucket dimension. One of:</p>
      <ul>
        <li><code>""</code> — default: per source IP for SBI, per Origin-Host for Diameter.</li>
        <li><code>global</code> — a single cluster-wide bucket.</li>
        <li><code>diameter_origin_host</code> — per Origin-Host.</li>
        <li><code>diameter_origin_realm</code> — per Origin-Realm.</li>
        <li><code>diameter_app_id</code> — per Diameter application ID.</li>
        <li><code>diameter_command_code</code> — per Diameter command code.</li>
        <li><code>imsi_prefix:N</code> — first N digits of the IMSI (e.g. <code>imsi_prefix:6</code> = MCC+MNC).</li>
      </ul>
      <p>
        See <Link to="/guides/rate-limiting">Configuring rate limiting</Link> for the operator
        patterns and cardinality caveats.
      </p>

      <h2 id="full-policy">Full policy document</h2>
      <p>
        <code>GET /admin/policy</code> returns the full <code>PolicyConfig</code> document, which
        bundles every block above alongside the OAuth2/JWT settings and the transformation and
        routing rules:
      </p>
      <CodeBlock lang="json" code={`{
  "default_action": "deny",
  "rules": [ /* PolicyRule[] */ ],
  "rate_limits": [ /* RateLimitRule[] */ ],
  "oauth2_required": false,
  "jwt_public_key": "string (optional)",
  "jwt_required_scopes": ["string"],
  "jwks_url": "string (optional)",
  "transformation_rules": [ /* TransformationRule[] */ ],
  "routing_rules": [ /* RoutingRule[] */ ]
}`} />

      <p>
        Transformation and routing rule shapes are documented in{' '}
        <Link to="/reference/transformation-schema">Transformation schema</Link> and{' '}
        <Link to="/reference/routing-schema">Routing schema</Link>. <code>/admin/policy</code> is
        read-only — individual records are created and updated through the per-resource endpoints
        in <Link to="/api/policy">Admin API → Policy</Link>.
      </p>

      <h2 id="validation">Validation</h2>
      <p>
        Shape-and-semantic checks run on every write to the control-plane store, so an invalid
        rule is rejected at update time rather than at request time. To validate a full
        configuration without committing it, use <code>POST /admin/config/validate</code> or run{' '}
        <code>fgpctl validate</code> against a config file. See{' '}
        <Link to="/reference/fgpctl">fgpctl reference</Link>.
      </p>

      <h2 id="where-to-go-next">Where to go next</h2>
      <ul>
        <li><Link to="/concepts/policy-engine">Policy engine</Link> — how rules are evaluated.</li>
        <li><Link to="/api/policy">Admin API → Policy</Link> — the endpoints that read and write these records.</li>
        <li><Link to="/guides/rate-limiting">Configuring rate limiting</Link> — rate-limit rules in practice.</li>
      </ul>
    </DocPage>
  );
}
