import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function PolicyVersioning() {
  return (
    <DocPage
      slug="guides/policy-versioning"
      lede="Every change to the policy document creates a new version. You can list versions, fetch a specific one, structurally diff two of them, and roll back atomically — all without restarting the proxy. This guide covers the operator-flow patterns: review-before-deploy, regression check, and break-glass rollback."
    >
      <h2 id="how-versions-are-created">How versions are created</h2>
      <p>
        Anything that writes to the policy store bumps the version: full-policy update, single
        rule add / update / delete, rate-limit changes, tenant changes, and the threat-detection
        / anomaly-scoring config blobs. Every mutation records:
      </p>
      <ul>
        <li>Monotonically increasing version number.</li>
        <li>Timestamp.</li>
        <li>Operator identity (from API key, JWT, or mTLS).</li>
        <li>The full resulting document (so a rollback can restore the exact state).</li>
      </ul>

      <h2 id="inspect">Inspect history</h2>
      <CodeBlock lang="bash" code={`fgpctl policy versions`} />
      <p>Returns a chronological list with the metadata above and the active version highlighted.</p>

      <p>Fetch one version's full document:</p>
      <CodeBlock lang="bash" code={`fgpctl policy get 42`} />

      <h2 id="diff">Structural diff</h2>
      <p>
        A plain text diff of two JSON blobs is rarely the right unit of review. FGP exposes a
        structural diff that emits one entry per logical change — a path, an op
        (<code>add</code> / <code>update</code> / <code>delete</code>), the before value, and
        the after value.
      </p>
      <CodeBlock lang="bash" code={`fgpctl policy compare 41 42`} />

      <p>Example output:</p>
      <CodeBlock lang="json" code={`[
  {
    "path": "/rules/allow-nudm-sdm-reads",
    "op": "update",
    "before": {"action": "allow", "match": {"path_prefix": "/nudm-sdm/v2/"}},
    "after":  {"action": "allow", "match": {"path_prefix": "/nudm-sdm/v2/", "method": "GET"}}
  },
  {
    "path": "/rate_limits/per-consumer",
    "op": "add",
    "before": null,
    "after": {"rate": 100, "burst": 200, "key": "consumer"}
  }
]`} />

      <p>
        That same JSON renders cleanly into a PR-review tool or ticket comment. Read the path
        + op + after to know what changed; read the before to know what was replaced.
      </p>

      <h2 id="patterns">Operator patterns</h2>

      <h3 id="review-before-deploy">Review before deploy</h3>
      <p>
        Apply the change in a staging proxy, snapshot the resulting version, diff it against
        the production version, and attach the diff to the change ticket.
      </p>
      <CodeBlock lang="bash" code={`# in staging
fgpctl -url https://fgp-staging:8091 policy-rules add @new-rule.json
NEW=$(fgpctl -url https://fgp-staging:8091 policy versions | jq -r '.[-1].version')

# pull from production for the baseline
PROD=$(fgpctl -url https://fgp-prod:8091 policy versions | jq -r '.[-1].version')

# diff
fgpctl -url https://fgp-staging:8091 policy compare $PROD $NEW > change.json`} />

      <h3 id="regression-check">Regression check</h3>
      <p>
        Before promoting a change, walk a corpus of representative requests through the new
        version's policy in a staging proxy. Compare allow/deny decisions against the baseline
        version. Any decision that flipped is a regression candidate — investigate before
        promoting.
      </p>

      <h3 id="break-glass">Break-glass rollback</h3>
      <p>
        When a policy change causes a production incident, roll back to the previous version
        in one call:
      </p>
      <CodeBlock lang="bash" code={`fgpctl policy rollback 41`} />

      <Callout type="note" title="Rollback is atomic">
        The proxy reads the version document from the store, validates it, builds a fresh
        filter chain, and atomic-swaps it in. No restart, no dropped requests. The same
        guarantees as any other policy mutation.
      </Callout>

      <p>
        Rollback creates a <em>new</em> version that happens to carry the same content as the
        target. History is append-only — you can see when a rollback happened and by whom.
      </p>

      <h2 id="ci-integration">CI integration</h2>
      <p>
        For a GitOps workflow, keep rule files in your repo and apply them on merge:
      </p>
      <CodeBlock lang="yaml" code={`# .github/workflows/policy-deploy.yml (sketch)
name: deploy-fgp-policy
on:
  push:
    branches: [main]
    paths: ["policy/**"]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate
        run: |
          for f in policy/*.json; do
            fgpctl -url \${{ secrets.FGP_ADMIN_URL }} -key \${{ secrets.FGP_ADMIN_KEY }} \\
              validate policy "$f"
          done
      - name: Apply
        run: |
          for f in policy/*.json; do
            fgpctl -url \${{ secrets.FGP_ADMIN_URL }} -key \${{ secrets.FGP_ADMIN_KEY }} \\
              policy-rules update "$(jq -r '.name' "$f")" "@$f"
          done`} />

      <p>
        Every mutation lands in the admin audit log with the CI identity attached. Track the
        commit SHA as the operator identity via the JWT claims or the API key label.
      </p>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/api/policy">Admin API → Policy</Link> — endpoints in full.</li>
        <li><Link to="/concepts/policy-engine">Policy engine</Link> — how decisions are made.</li>
        <li><Link to="/tutorials/first-sbi-policy">Tutorial: your first SBI policy</Link>.</li>
      </ul>
    </DocPage>
  );
}
