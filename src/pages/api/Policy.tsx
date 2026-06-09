import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import HttpMethod from '../../components/HttpMethod';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function Policy() {
  return (
    <DocPage
      slug="api/policy"
      lede="Read the active policy document, capture and restore immutable snapshots, and CRUD individual rules through the unified rules surface."
    >
      <p>
        All examples assume the <code>X-Admin-Key</code> header and base URL from{' '}
        <Link to="/api/overview">the admin API overview</Link>. Every write here is hot-reloaded —
        no restart, no dropped requests; see <Link to="/api/overview">the overview</Link> for the
        hot-reload guarantee.
      </p>

      <h2 id="read-policy">Read the policy</h2>
      <p><HttpMethod method="GET" /> <code>/admin/policy</code></p>
      <p>
        Returns the current active policy document — every policy rule, rate-limit rule,
        transformation rule, and routing rule. This endpoint is read-only: mutations go through the
        per-rule CRUD surface below, or through snapshot restore. See{' '}
        <Link to="/reference/policy-schema">Policy schema</Link>.
      </p>

      <h2 id="snapshots">Snapshots</h2>
      <p>
        A snapshot is a manual, immutable point-in-time capture of the full policy config. Create
        one before a risky change, then restore it to roll the entire policy back. See{' '}
        <Link to="/guides/policy-versioning">Versioning and rolling back policy</Link> for the
        operator workflow.
      </p>

      <p><HttpMethod method="GET" /> <code>/admin/policy/snapshots</code></p>
      <p>Lists snapshot metadata, newest first. The captured config is omitted — fetch a single snapshot to see it.</p>

      <p><HttpMethod method="POST" /> <code>/admin/policy/snapshots</code></p>
      <p>
        Captures the current live policy as a new snapshot. Body is{' '}
        <code>{`{"name": "...", "description": "..."}`}</code>; <code>name</code> is required. Returns
        the new snapshot metadata with <code>201 Created</code>.
      </p>

      <p><HttpMethod method="GET" /> <code>/admin/policy/snapshots/{`{id}`}</code></p>
      <p>Returns one snapshot, including its captured config. 404 if no snapshot has that id.</p>

      <p><HttpMethod method="DELETE" /> <code>/admin/policy/snapshots/{`{id}`}</code></p>
      <p>Deletes one snapshot.</p>

      <p><HttpMethod method="POST" /> <code>/admin/policy/snapshots/{`{id}`}/restore</code></p>
      <Callout type="warning">
        Restore overwrites the entire live policy with the snapshot's captured config and does not
        first capture the current state. Take a snapshot of the running policy before you restore.
        Restore requires the admin role.
      </Callout>

      <h2 id="rules">Rules</h2>
      <p>
        Individual policy, transformation, routing, and rate-limit rules share one unified surface
        at <code>/admin/rules</code>. Each rule carries a <code>type</code> discriminator —{' '}
        <code>policy</code>, <code>transformation</code>, <code>routing</code>, or{' '}
        <code>rate-limit</code>. Use these endpoints for incremental edits.
      </p>

      <p><HttpMethod method="GET" /> <code>/admin/rules</code></p>
      <p>
        Lists all rules across the four types, each entry carrying its <code>type</code>. Add{' '}
        <code>?type=policy</code> (or another type) to narrow to one type.
      </p>

      <p><HttpMethod method="POST" /> <code>/admin/rules</code></p>
      <p>
        Creates a rule. The body must include <code>type</code> plus the type-specific fields — for
        a policy rule, a <code>PolicyRule</code> with <code>"type": "policy"</code> (see{' '}
        <Link to="/reference/policy-schema">schema</Link>). Rule names are globally unique across all
        four types: <code>409</code> if any rule already owns the name.
      </p>

      <p><HttpMethod method="GET" /> <code>/admin/rules/{`{name}`}</code></p>
      <p>Returns one rule by name. The response carries an <code>ETag</code> for optimistic concurrency.</p>

      <p><HttpMethod method="PUT" /> <code>/admin/rules/{`{name}`}</code></p>
      <p>
        Updates one rule. If the body declares a <code>type</code>, it must match the existing rule's
        type — a PUT cannot reassign a rule's type (delete and recreate instead). Send the rule's
        <code>ETag</code> in <code>If-Match</code> for a guarded update.
      </p>

      <p><HttpMethod method="DELETE" /> <code>/admin/rules/{`{name}`}</code></p>
      <p>Deletes one rule by name.</p>

      <h2 id="examples">Examples</h2>

      <h3 id="add-rule">Add a policy rule</h3>
      <CodeBlock lang="bash" code={`curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:9091/admin/rules \\
  -d '{
    "type": "policy",
    "name": "allow-nudm-sdm-reads",
    "priority": 100,
    "action": "allow",
    "methods": ["GET"],
    "path_patterns": ["/nudm-sdm/v2/.*"]
  }'`} />

      <h3 id="snapshot-and-restore">Snapshot and restore</h3>
      <CodeBlock lang="bash" code={`# capture the current live policy before a risky change
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:9091/admin/policy/snapshots \\
  -d '{"name": "pre-rollout", "description": "before nudm change"}' | jq

# roll the whole policy back to snapshot 7
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  -X POST https://fgp.svc:9091/admin/policy/snapshots/7/restore`} />

      <h2 id="where-to-go-next">Where to go next</h2>
      <ul>
        <li><Link to="/reference/policy-schema">Policy schema</Link> — the full <code>PolicyRule</code> shape.</li>
        <li><Link to="/guides/policy-versioning">Versioning and rolling back policy</Link> — the snapshot/restore workflow.</li>
        <li><Link to="/api/overview">Admin API overview</Link> — auth, base URL, error model, and idempotency.</li>
      </ul>
    </DocPage>
  );
}
