import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import HttpMethod from '../../components/HttpMethod';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function RateLimits() {
  return (
    <DocPage
      slug="api/rate-limits"
      lede="Manage rate-limit rules through the unified /admin/rules surface. The rule type is selected by the request body, not the URL. See the Rate limiting guide for operator-flow patterns."
    >
      <h2 id="endpoints">Endpoints</h2>
      <p>
        Rate-limit rules are CRUD'd through the same <code>/admin/rules</code> surface as policy,
        transformation, and routing rules. There is no <code>/admin/rate-limits</code> path. On
        create and update, the rule type is carried in the request body as{' '}
        <code>{`{"type": "rate-limit"}`}</code>; on read and delete it is resolved from the rule's
        name, which is unique across all rule types.
      </p>

      <p><HttpMethod method="GET" /> <code>/admin/rules?type=rate-limit</code></p>
      <p>Lists rules. Add <code>?type=rate-limit</code> to return only rate-limit rules.</p>

      <p><HttpMethod method="POST" /> <code>/admin/rules</code></p>
      <p>
        Creates a rule. The body must include <code>"type": "rate-limit"</code> plus the{' '}
        <code>RateLimitRule</code> fields. Returns 409 if the name is already taken by any rule
        type, not just an existing rate-limit rule.
      </p>

      <p><HttpMethod method="GET" /> <code>/admin/rules/{`{name}`}</code></p>
      <p>Returns one rule by name.</p>

      <p><HttpMethod method="PUT" /> <code>/admin/rules/{`{name}`}</code></p>
      <p>
        Updates an existing rule. This is not an upsert — if no rule by that name exists, it
        returns 404. If the body carries a <code>type</code>, it must match the existing rule's
        type; you cannot reassign a rule's type via <code>PUT</code> (delete and recreate
        instead).
      </p>

      <p><HttpMethod method="DELETE" /> <code>/admin/rules/{`{name}`}</code></p>
      <p>Deletes a rule by name.</p>

      <Callout type="note" title="Auth and base URL">
        All admin requests carry the <code>X-Admin-Key</code> header (or a JWT bearer) and target
        the admin listener on <code>:9091</code>. See{' '}
        <Link to="/api/overview">Admin API overview</Link> for the canonical auth and base-URL
        details.
      </Callout>

      <h2 id="rule-shape">Rule shape</h2>
      <p>
        A <code>RateLimitRule</code> is a flat JSON object. The token-bucket rate is{' '}
        <code>rps</code> (requests per second) with a <code>burst</code> ceiling. The NF dimension
        is the flat string <code>source_nf_type</code> — there is no nested <code>match</code>{' '}
        object. <code>key</code> selects the bucket dimension; valid values are{' '}
        <code>""</code> (default: per source IP for SBI, per Origin-Host for Diameter),{' '}
        <code>"global"</code>, <code>"diameter_origin_host"</code>,{' '}
        <code>"diameter_origin_realm"</code>, <code>"diameter_app_id"</code>,{' '}
        <code>"diameter_command_code"</code>, and <code>"imsi_prefix:N"</code>. To cap per
        subscriber, set the separate boolean <code>key_by_supi</code>. See{' '}
        <Link to="/reference/policy-schema">Policy schema</Link> for the full field reference.
      </p>

      <h2 id="examples">Examples</h2>
      <CodeBlock lang="bash" code={`# list rate-limit rules
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  "https://fgp.svc:9091/admin/rules?type=rate-limit" | jq

# create a per-subscriber cap on UDM traffic
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:9091/admin/rules \\
  -d '{
    "type": "rate-limit",
    "name": "per-subscriber-udm",
    "rps": 100,
    "burst": 200,
    "source_nf_type": "UDM",
    "key_by_supi": true
  }'

# bump the burst
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X PUT https://fgp.svc:9091/admin/rules/per-subscriber-udm \\
  -d '{
    "type": "rate-limit",
    "name": "per-subscriber-udm",
    "rps": 100,
    "burst": 500,
    "source_nf_type": "UDM",
    "key_by_supi": true
  }'

# remove it
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  -X DELETE https://fgp.svc:9091/admin/rules/per-subscriber-udm`} />

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/reference/policy-schema">Policy schema</Link> — <code>RateLimitRule</code> shape.</li>
        <li><Link to="/guides/rate-limiting">Configuring rate limiting</Link> — operator patterns, key choice, cardinality.</li>
        <li><Link to="/reference/metrics">Metrics</Link> — <code>fgp_rate_limit_exceeded_total</code>.</li>
      </ul>
    </DocPage>
  );
}
