import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import HttpMethod from '../../components/HttpMethod';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function Transformations() {
  return (
    <DocPage
      slug="api/transformations"
      lede="CRUD for transformation rules plus a dry-run endpoint that lets you test a candidate rule against a sample request before committing it. See Transformation schema for the rule shape."
    >
      <h2 id="endpoints">Endpoints</h2>

      <p><HttpMethod method="GET" /> <code>/admin/transformations</code></p>
      <p>Lists all transformation rules across both phases.</p>

      <p><HttpMethod method="POST" /> <code>/admin/transformations</code></p>
      <p>Creates a transformation rule. 409 if a rule by that name exists.</p>

      <p><HttpMethod method="GET" /> <code>/admin/transformations/{`{name}`}</code></p>
      <p>Returns one transformation rule.</p>

      <p><HttpMethod method="PUT" /> <code>/admin/transformations/{`{name}`}</code></p>
      <p>Updates a transformation rule. Upsert.</p>

      <p><HttpMethod method="DELETE" /> <code>/admin/transformations/{`{name}`}</code></p>
      <p>Deletes a transformation rule. Idempotent.</p>

      <h2 id="dry-run">Dry-run</h2>
      <p><HttpMethod method="POST" /> <code>/admin/transformations/dry-run</code></p>
      <p>
        Takes a candidate rule and a sample request, applies the rule, and returns the
        resulting request — without persisting the rule. Use this to test regex substitutions
        and JSON Pointer paths before pushing to the data path.
      </p>

      <CodeBlock lang="json" code={`{
  "rule": {
    "name": "mask-gpsi",
    "phase": "request",
    "priority": 100,
    "match": {"nf_type": "UDM", "path_prefix": "/nudm-sdm/v2/"},
    "ops": [{"op": "mask_body", "path": "/gpsi", "value": "REDACTED"}]
  },
  "request": {
    "method": "PATCH",
    "path": "/nudm-sdm/v2/imsi-001010000000001/sm-data",
    "headers": {"Content-Type": "application/json"},
    "body": {"gpsi": "msisdn-15551234567", "snssai": {"sst": 1}}
  }
}`} />

      <p>Response includes the transformed request and any per-op diagnostics:</p>
      <CodeBlock lang="json" code={`{
  "transformed": {
    "method": "PATCH",
    "path": "/nudm-sdm/v2/imsi-001010000000001/sm-data",
    "headers": {"Content-Type": "application/json"},
    "body": {"gpsi": "REDACTED", "snssai": {"sst": 1}}
  },
  "ops_applied": ["mask_body:/gpsi"],
  "warnings": []
}`} />

      <Callout type="tip" title="Dry-run is the safe iteration loop">
        Regex and JSON Pointer typos make it through plain validation but fail on real traffic.
        Always dry-run the rule against a representative request before applying.
      </Callout>

      <h2 id="examples">Examples</h2>
      <CodeBlock lang="bash" code={`# list
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  https://fgp.svc:8091/admin/transformations | jq

# dry-run a candidate rule
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:8091/admin/transformations/dry-run \\
  -d @candidate.json | jq

# apply
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:8091/admin/transformations \\
  -d @candidate.json`} />

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/concepts/transformation-engine">Transformation engine</Link>.</li>
        <li><Link to="/reference/transformation-schema">Transformation schema</Link>.</li>
        <li><Link to="/tutorials/first-transformation-rule">Tutorial: your first transformation rule</Link>.</li>
      </ul>
    </DocPage>
  );
}
