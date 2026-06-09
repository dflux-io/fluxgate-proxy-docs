import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import HttpMethod from '../../components/HttpMethod';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function Transformations() {
  return (
    <DocPage
      slug="api/transformations"
      lede="Manage transformation rules through the unified rules surface. See Transformation schema for the rule shape."
    >
      <p>
        All examples assume the <code>X-Admin-Key</code> header and base URL from{' '}
        <Link to="/api/overview">the admin API overview</Link>. Every write here is hot-reloaded —
        no restart, no dropped requests; see <Link to="/api/overview">the overview</Link> for the
        hot-reload guarantee.
      </p>

      <p>
        Transformation rules are one of four rule types served by a single CRUD surface at{' '}
        <code>/admin/rules</code>. The type is carried as a <code>type</code> discriminator on each
        rule body and as a <code>?type=</code> filter on list. Rule names are globally unique across
        all four types, so a single name resolves to exactly one rule regardless of type.
      </p>

      <h2 id="endpoints">Endpoints</h2>

      <p><HttpMethod method="GET" /> <code>/admin/rules?type=transformation</code></p>
      <p>
        Lists transformation rules across both phases. Omit the filter to list every rule type
        interleaved; each entry carries its own <code>type</code>.
      </p>

      <p><HttpMethod method="POST" /> <code>/admin/rules</code></p>
      <p>
        Creates a rule. The body must set <code>{`"type": "transformation"`}</code>. Returns 409 if a
        rule by that name already exists as any type.
      </p>

      <p><HttpMethod method="GET" /> <code>/admin/rules/{`{name}`}</code></p>
      <p>Returns one rule by name, resolved across all rule types.</p>

      <p><HttpMethod method="PUT" /> <code>/admin/rules/{`{name}`}</code></p>
      <p>
        Updates a rule. If the body declares a <code>type</code>, it must match the stored rule's
        type — a PUT cannot reassign a rule from one type to another.
      </p>

      <p><HttpMethod method="DELETE" /> <code>/admin/rules/{`{name}`}</code></p>
      <p>Deletes a rule by name.</p>

      <h2 id="rule-shape">Rule shape</h2>
      <p>
        A transformation rule has a flat <code>condition</code> block (the shared request matchers), a
        single <code>action</code>, and a typed <code>config</code> object whose fields depend on the
        action. The example below masks the <code>gpsi</code> body field on UDM SDM traffic:
      </p>

      <CodeBlock lang="json" code={`{
  "type": "transformation",
  "name": "mask-gpsi",
  "enabled": true,
  "phase": "request",
  "priority": 100,
  "condition": {
    "target_nf_types": ["UDM"],
    "path_patterns": ["/nudm-sdm/v2/*"]
  },
  "action": "body_field_mask",
  "config": {
    "field_path": "/gpsi",
    "mask_value": "REDACTED"
  }
}`} />

      <p>
        Valid <code>action</code> values: <code>header_set</code>, <code>header_add</code>,{' '}
        <code>header_remove</code>, <code>header_rewrite</code>, <code>body_field_set</code>,{' '}
        <code>body_field_remove</code>, <code>body_field_mask</code>, <code>body_field_map</code>,{' '}
        <code>status_rewrite</code>, <code>error_normalize</code>, and the Diameter AVP actions{' '}
        <code>avp_set</code>, <code>avp_add</code>, <code>avp_remove</code>, <code>avp_rewrite</code>,{' '}
        <code>avp_mask</code>. See <Link to="/reference/transformation-schema">Transformation schema</Link>{' '}
        for each action's <code>config</code> fields.
      </p>

      <Callout type="tip" title="Validate before the data path">
        The typed POST/PUT validates the rule — its regex patterns, JSON Pointer paths, and
        action/config consistency — before it is persisted and hot-reloaded. Iterate against a
        non-production proxy when shaping a new rule.
      </Callout>

      <h2 id="examples">Examples</h2>
      <CodeBlock lang="bash" code={`# list transformation rules
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  https://fgp.svc:9091/admin/rules?type=transformation | jq

# create a rule
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:9091/admin/rules \\
  -d @candidate.json | jq

# update it
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X PUT https://fgp.svc:9091/admin/rules/mask-gpsi \\
  -d @candidate.json`} />

      <h2 id="related">Where to go next</h2>
      <ul>
        <li><Link to="/concepts/transformation-engine">Transformation engine</Link>.</li>
        <li><Link to="/reference/transformation-schema">Transformation schema</Link>.</li>
        <li><Link to="/tutorials/first-transformation-rule">Tutorial: your first transformation rule</Link>.</li>
      </ul>
    </DocPage>
  );
}
