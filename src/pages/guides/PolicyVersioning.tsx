import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function PolicyVersioning() {
  return (
    <DocPage
      slug="guides/policy-versioning"
      lede="A policy snapshot is a named, immutable capture of the entire live policy — rules, rate limits, transformation rules, routing rules, and the global filter settings. Take one before a risky change, restore it if the change goes wrong. This guide covers the operator flows: capture-before-deploy and break-glass restore."
    >
      <h2 id="how-snapshots-work">How snapshots work</h2>
      <p>
        Snapshots are deliberate and manual — fluxgate-proxy does not version every write to the
        control-plane store automatically. You capture a snapshot when you want a save point, and
        it stays exactly as captured until you restore or delete it. Each snapshot records:
      </p>
      <ul>
        <li>An autoincrement <code>id</code>.</li>
        <li>A required <code>name</code> and an optional <code>description</code>.</li>
        <li>A <code>created_at</code> timestamp.</li>
        <li>
          The <code>version</code> (the store's config-change counter) at the moment of capture.
        </li>
        <li>The full <code>config</code> document, so a restore can replay the exact state.</li>
      </ul>
      <p>
        The whole surface lives under the admin API — there is no <code>fgpctl</code> subcommand for
        snapshots, so the examples below use <code>curl</code>. Every request carries the{' '}
        <code>X-Admin-Key</code> header against the admin API on <code>:9091</code>; see{' '}
        <Link to="/api/overview">Admin API overview</Link> for the base URL and auth conventions.
      </p>

      <h2 id="capture">Capture a snapshot</h2>
      <p>
        Capture the current live policy. <code>name</code> is required; <code>description</code> is
        optional but worth filling in for break-glass clarity later:
      </p>
      <CodeBlock
        lang="bash"
        code={`curl -sS -X POST http://127.0.0.1:9091/admin/policy/snapshots \\
  -H "X-Admin-Key: $FGP_ADMIN_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "pre-nudm-rollout", "description": "before adding GET-only nudm-sdm rule"}'`}
      />
      <p>The response is the created snapshot, including its <code>id</code>:</p>
      <CodeBlock
        lang="json"
        code={`{
  "id": 7,
  "name": "pre-nudm-rollout",
  "description": "before adding GET-only nudm-sdm rule",
  "version": 142,
  "created_at": "2026-06-09T10:21:04Z",
  "config": { "...": "the full captured policy document" }
}`}
      />

      <h2 id="inspect">List and fetch snapshots</h2>
      <p>List snapshot metadata, newest first. The captured config is omitted from the list:</p>
      <CodeBlock
        lang="bash"
        code={`curl -sS http://127.0.0.1:9091/admin/policy/snapshots \\
  -H "X-Admin-Key: $FGP_ADMIN_KEY"`}
      />
      <CodeBlock
        lang="json"
        code={`[
  {
    "id": 7,
    "name": "pre-nudm-rollout",
    "description": "before adding GET-only nudm-sdm rule",
    "version": 142,
    "created_at": "2026-06-09T10:21:04Z"
  }
]`}
      />
      <p>Fetch one snapshot by id to see its full captured config:</p>
      <CodeBlock
        lang="bash"
        code={`curl -sS http://127.0.0.1:9091/admin/policy/snapshots/7 \\
  -H "X-Admin-Key: $FGP_ADMIN_KEY"`}
      />
      <p>Delete a snapshot you no longer need. Deleting a snapshot never touches the live policy:</p>
      <CodeBlock
        lang="bash"
        code={`curl -sS -X DELETE http://127.0.0.1:9091/admin/policy/snapshots/7 \\
  -H "X-Admin-Key: $FGP_ADMIN_KEY"`}
      />

      <h2 id="break-glass">Break-glass restore</h2>
      <p>
        When a policy change causes a production incident, replay a known-good snapshot as the live
        policy in one call:
      </p>
      <CodeBlock
        lang="bash"
        code={`curl -sS -X POST http://127.0.0.1:9091/admin/policy/snapshots/7/restore \\
  -H "X-Admin-Key: $FGP_ADMIN_KEY"`}
      />
      <Callout type="warning" title="Restore overwrites the live policy in place">
        Restore replays the captured config as the new live policy with no restart and no dropped
        requests — the same hot-reload guarantee as any other policy write. It does <em>not</em>{' '}
        capture the current state first, so if you want a rollback point, take a snapshot of the
        live policy before you restore.
      </Callout>
      <p>
        Restore is an admin-role operation because it replaces the entire live policy. Listing,
        fetching, and capturing follow the usual viewer/operator split.
      </p>

      <h2 id="gitops">GitOps via per-resource CRUD</h2>
      <p>
        Snapshots are a save/restore point, not a deployment mechanism. To drive policy from a
        repository, keep your rule files in Git and apply them through the per-resource CRUD
        commands on merge. Capture a snapshot first so a bad apply has a one-call recovery path:
      </p>
      <CodeBlock
        lang="yaml"
        code={`# .github/workflows/policy-deploy.yml (sketch)
name: deploy-fgp-policy
on:
  push:
    branches: [main]
    paths: ["policy/**"]
jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      FGP_ADMIN_KEY: \${{ secrets.FGP_ADMIN_KEY }}
    steps:
      - uses: actions/checkout@v4
      - name: Capture a pre-deploy snapshot
        run: |
          curl -sS -X POST "$FGP_ADMIN_URL/admin/policy/snapshots" \\
            -H "X-Admin-Key: $FGP_ADMIN_KEY" \\
            -H "Content-Type: application/json" \\
            -d "{\\"name\\": \\"ci-$GITHUB_SHA\\"}"
        env:
          FGP_ADMIN_URL: \${{ secrets.FGP_ADMIN_URL }}
      - name: Apply rules
        run: |
          for f in policy/*.json; do
            name=$(jq -r '.name' "$f")
            fgpctl -url \${{ secrets.FGP_ADMIN_URL }} policy-rules get "$name" >/dev/null 2>&1 \\
              && verb=update args="$name @$f" \\
              || verb=add args="@$f"
            fgpctl -url \${{ secrets.FGP_ADMIN_URL }} policy-rules $verb $args
          done`}
      />
      <p>
        Each rule is created with <code>policy-rules add</code> and changed with{' '}
        <code>policy-rules update &lt;name&gt;</code>; <code>update</code> requires a rule that
        already exists, which is why the loop checks first. The snapshot id from the capture step is
        your rollback target if the apply misbehaves.
      </p>
      <Callout type="note" title="Mutations land in the structured log">
        Snapshot creation, deletion, and restore are emitted as structured decision logs (with the
        snapshot id and name) and surface in your log pipeline. There is no separate per-mutation
        history store; ship these logs to your SIEM as described in{' '}
        <Link to="/guides/observability">Setting up observability</Link>.
      </Callout>

      <h2 id="related">Where to go next</h2>
      <ul>
        <li>
          <Link to="/api/policy">Admin API: Policy</Link> — the snapshot endpoints in full.
        </li>
        <li>
          <Link to="/concepts/policy-engine">Policy engine</Link> — how decisions are made.
        </li>
        <li>
          <Link to="/tutorials/first-sbi-policy">Your first SBI policy</Link>.
        </li>
      </ul>
    </DocPage>
  );
}
