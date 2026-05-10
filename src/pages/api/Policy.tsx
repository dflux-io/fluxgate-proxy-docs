import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import HttpMethod from '../../components/HttpMethod';
import { Link } from 'react-router-dom';

export default function Policy() {
  return (
    <DocPage
      slug="api/policy"
      lede="Read and write the full policy document, manage versions and rollback, and CRUD individual policy rules. All policy operations are hot-reloaded — no restart, no dropped requests."
    >
      <h2 id="full-policy">Full policy</h2>
      <p><HttpMethod method="GET" /> <code>/admin/policy</code></p>
      <p>Returns the current active policy document — every rule, rate limit, tenant, and config blob. See <Link to="/reference/policy-schema">Policy schema</Link>.</p>

      <p><HttpMethod method="PUT" /> <code>/admin/policy</code></p>
      <p>
        Replaces the full policy document. Validates the candidate, persists it as a new
        version, atomic-swaps the filter chain. Returns the new version metadata.
      </p>

      <h2 id="versions">Versions</h2>
      <p><HttpMethod method="GET" /> <code>/admin/policy/versions</code></p>
      <p>Lists policy versions in chronological order. Each entry carries version number, timestamp, and operator identity.</p>

      <p><HttpMethod method="GET" /> <code>/admin/policy/versions/{`{version}`}</code></p>
      <p>Returns the full policy document for a specific version.</p>

      <p><HttpMethod method="GET" /> <code>/admin/policy/versions/compare?v1=N&amp;v2=M</code></p>
      <p>Structural diff between two versions. Returns one entry per logical change (path / op / before / after). See <Link to="/guides/policy-versioning">Policy versioning and rollback</Link> for the operator workflow.</p>

      <p><HttpMethod method="POST" /> <code>/admin/policy/rollback/{`{version}`}</code></p>
      <p>
        Atomically rolls back to a prior version. Creates a new version whose content matches
        the target — history is append-only.
      </p>

      <h2 id="validate">Validate</h2>
      <p><HttpMethod method="POST" /> <code>/admin/policy/validate</code></p>
      <p>
        Runs the same shape-and-semantic checks an update would, without committing. Returns
        either <code>{`{"ok": true}`}</code> or a validation error.
      </p>

      <h2 id="rules-crud">Policy rule CRUD</h2>
      <p>
        These endpoints operate on individual rules. Use them for incremental edits; use
        <code>PUT /admin/policy</code> for a full-document replacement.
      </p>

      <p><HttpMethod method="GET" /> <code>/admin/policy-rules</code></p>
      <p>Lists all policy rules.</p>

      <p><HttpMethod method="POST" /> <code>/admin/policy-rules</code></p>
      <p>Creates a rule. Body is a <code>PolicyRule</code> (see <Link to="/reference/policy-schema">schema</Link>). 409 if a rule by that name exists.</p>

      <p><HttpMethod method="GET" /> <code>/admin/policy-rules/{`{name}`}</code></p>
      <p>Returns one rule.</p>

      <p><HttpMethod method="PUT" /> <code>/admin/policy-rules/{`{name}`}</code></p>
      <p>Updates one rule. Upsert.</p>

      <p><HttpMethod method="DELETE" /> <code>/admin/policy-rules/{`{name}`}</code></p>
      <p>Deletes one rule. Idempotent — 204 either way.</p>

      <h2 id="threat-and-anomaly">Threat detection and anomaly scoring</h2>
      <p>The two config blobs are surfaced as standalone endpoints:</p>
      <p><HttpMethod method="GET" /> <code>/admin/threat-detection</code></p>
      <p><HttpMethod method="PUT" /> <code>/admin/threat-detection</code></p>
      <p><HttpMethod method="GET" /> <code>/admin/anomaly-scoring</code></p>
      <p><HttpMethod method="PUT" /> <code>/admin/anomaly-scoring</code></p>
      <p>See <Link to="/reference/policy-schema">Policy schema</Link> for the blob shapes.</p>

      <h2 id="tenants">Tenants</h2>
      <p><HttpMethod method="GET" /> <code>/admin/tenants</code></p>
      <p>Lists tenants.</p>

      <p><HttpMethod method="POST" /> <code>/admin/tenants</code></p>
      <p>Creates a tenant. 409 if a tenant for that PLMN already exists.</p>

      <p><HttpMethod method="PUT" /> <code>/admin/tenants/{`{mcc}`}/{`{mnc}`}</code></p>
      <p>Upserts a tenant by PLMN.</p>

      <p><HttpMethod method="DELETE" /> <code>/admin/tenants/{`{mcc}`}/{`{mnc}`}</code></p>
      <p>Deletes a tenant.</p>

      <h2 id="examples">Examples</h2>

      <h3 id="add-rule">Add a rule</h3>
      <CodeBlock lang="bash" code={`curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:8091/admin/policy-rules \\
  -d '{
    "name": "allow-nudm-sdm-reads",
    "action": "allow",
    "match": {"method": "GET", "path_prefix": "/nudm-sdm/v2/"}
  }'`} />

      <h3 id="diff-and-rollback">Diff and rollback</h3>
      <CodeBlock lang="bash" code={`# what changed between v41 and v42?
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  "https://fgp.svc:8091/admin/policy/versions/compare?v1=41&v2=42" | jq

# undo
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  -X POST https://fgp.svc:8091/admin/policy/rollback/41`} />
    </DocPage>
  );
}
