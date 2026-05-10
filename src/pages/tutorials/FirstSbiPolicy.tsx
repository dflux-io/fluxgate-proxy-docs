import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function FirstSbiPolicy() {
  return (
    <DocPage
      slug="tutorials/first-sbi-policy"
      lede="In about 15 minutes, write a policy rule, deploy it via fgpctl, verify it from a live request, and inspect the audit record. By the end you'll know how a rule gets from JSON on disk to a decision on the wire."
    >
      <h2 id="prereqs">Before you start</h2>
      <ul>
        <li>FGP running with <code>examples/fgp-minimal.yaml</code>. See <Link to="/introduction/quickstart">Quickstart</Link> if you haven't done that yet.</li>
        <li><code>fgpctl</code> built and reachable.</li>
      </ul>

      <h2 id="state-of-play">The state of play</h2>
      <p>
        With the minimal config and no rules, FGP denies every request (the v1 default is
        fail-closed). Confirm:
      </p>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:8091 policy-rules`} />
      <p>
        That should print <code>[]</code>. Now send an SBI request and check the response:
      </p>
      <CodeBlock lang="bash" code={`curl -s -o /dev/null -w "%{http_code}\\n" \\
  http://127.0.0.1:8090/nudm-sdm/v2/imsi-001010000000001/am-data`} />
      <p>Expect <code>403</code>. The decision lands in the audit trail:</p>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:8091 audit --limit 1`} />

      <h2 id="write-the-rule">Write the rule</h2>
      <p>
        Allow read-only Nudm SDM lookups from any consumer for now. We'll tighten the match
        block once we know more about your traffic.
      </p>
      <CodeBlock lang="json" code={`{
  "name": "allow-nudm-sdm-reads",
  "action": "allow",
  "match": {
    "method": "GET",
    "path_prefix": "/nudm-sdm/v2/"
  },
  "description": "Permit read-only Nudm SDM lookups."
}`} />

      <p>Save this as <code>allow-nudm-sdm-reads.json</code>.</p>

      <h2 id="validate">Validate the rule</h2>
      <p>Before deploying, ask the proxy whether the rule is structurally valid:</p>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:8091 validate policy allow-nudm-sdm-reads.json`} />
      <p>
        A clean validation prints <code>{`{"ok": true}`}</code>. If something is wrong — typo
        in a field name, unknown action, malformed match block — you'll get a dotted-path
        error telling you exactly where.
      </p>

      <h2 id="deploy">Deploy</h2>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:8091 policy-rules add @allow-nudm-sdm-reads.json`} />
      <p>
        The proxy persists the rule to the control-plane store, bumps the policy version,
        rebuilds the filter chain, and atomic-swaps it. There is no restart, no dropped
        connections, no warm-up.
      </p>

      <p>Confirm:</p>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:8091 policy-rules`} />

      <h2 id="exercise">Exercise the rule</h2>
      <p>Repeat the request from earlier:</p>
      <CodeBlock lang="bash" code={`curl -s -o /dev/null -w "%{http_code}\\n" \\
  http://127.0.0.1:8090/nudm-sdm/v2/imsi-001010000000001/am-data`} />
      <p>
        Expect a status other than <code>403</code> — the request now passes the policy gate.
        The exact response depends on whether a UDM producer is registered:
      </p>
      <ul>
        <li>
          <strong>No producer:</strong> <code>503</code> with a "no route" body. Policy allowed,
          routing had nowhere to send it.
        </li>
        <li>
          <strong>Producer registered, reachable:</strong> the producer's actual response.
        </li>
      </ul>

      <Callout type="tip" title="Allowed ≠ delivered">
        A request can pass policy and still fail downstream (no producer, producer 5xx,
        timeout). The audit record distinguishes these: <code>decision: allowed</code> means
        the filter chain let it through; <code>status_code</code> tells you what the consumer
        ultimately got.
      </Callout>

      <h2 id="audit">Read the audit record</h2>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:8091 audit --limit 2`} />
      <p>The most recent record will look something like:</p>
      <CodeBlock lang="json" code={`{
  "timestamp": "2026-05-11T19:08:21.531Z",
  "request_id": "01J…",
  "method": "GET",
  "path": "/nudm-sdm/v2/imsi-001010000000001/am-data",
  "target_nf_type": "UDM",
  "source_nf_type": "",
  "decision": "allowed",
  "deny_reason": "",
  "status_code": 503,
  "duration_us": 1842,
  "matched_rule": "allow-nudm-sdm-reads"
}`} />
      <p>
        The <code>matched_rule</code> field tells you exactly which rule made the decision.
        That's the audit detail to scrape into your SIEM.
      </p>

      <h2 id="version-and-rollback">Versions and rollback</h2>
      <p>List the policy versions FGP has tracked since startup:</p>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:8091 policy versions`} />

      <p>Each rule mutation creates a new version. Diff two versions:</p>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:8091 policy compare 1 2`} />

      <p>Roll back to a prior version atomically:</p>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:8091 policy rollback 1`} />

      <p>
        See <Link to="/guides/policy-versioning">Policy versioning and rollback</Link> for the
        operator-flow patterns (canary, dry-run, regression check).
      </p>

      <h2 id="next">Tighten the rule</h2>
      <p>
        A path-prefix rule that matches every consumer is fine for a smoke test but rarely the
        right production shape. Common refinements:
      </p>
      <ul>
        <li>Add <code>nf_type: "UDM"</code> to constrain by target NF type.</li>
        <li>Add a <code>source_nf_type</code> to require the consumer NF type.</li>
        <li>Add an OAuth2 scope check via the auth filter rather than path-only matching.</li>
        <li>Add a rate-limit rule keyed by consumer identity to cap noisy callers.</li>
      </ul>
      <p>
        See <Link to="/reference/policy-schema">Policy schema</Link> for every available
        match-block field.
      </p>
    </DocPage>
  );
}
