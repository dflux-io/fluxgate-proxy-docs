import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function FirstSbiPolicy() {
  return (
    <DocPage
      slug="tutorials/first-sbi-policy"
      lede="In about 15 minutes, write a policy rule, deploy it via fgpctl, and verify it from a live request. By the end you'll know how a rule gets from JSON on disk to a decision on the wire."
    >
      <h2 id="prereqs">Before you start</h2>
      <ul>
        <li>fluxgate-proxy running with <code>examples/fgp-minimal.yaml</code>. See <Link to="/introduction/quickstart">Quickstart</Link> if you haven't done that yet.</li>
        <li><code>fgpctl</code> built and reachable. It talks to the admin API at <code>http://127.0.0.1:9091</code> by default, so the commands below omit <code>-url</code>.</li>
      </ul>

      <h2 id="state-of-play">The state of play</h2>
      <p>
        With the minimal config and no rules, the proxy denies every request (the v1 default is
        fail-closed, <code>default_action: deny</code>). Confirm there are no rules yet:
      </p>
      <CodeBlock lang="bash" code={`./bin/fgpctl policy-rules`} />
      <p>
        That should print <code>[]</code>. Now send an SBI request to the proxy port and check the
        response:
      </p>
      <CodeBlock lang="bash" code={`curl -s -o /dev/null -w "%{http_code}\\n" \\
  http://127.0.0.1:8090/nudm-sdm/v2/imsi-001010000000001/am-data`} />
      <p>
        Expect <code>403</code>. The proxy emits the deny as a structured JSON log line (zerolog)
        on its log stream — that's where decisions land, not in any separate store.
      </p>

      <h2 id="write-the-rule">Write the rule</h2>
      <p>
        Allow read-only Nudm SDM lookups from any consumer for now. We'll tighten the matchers
        once we know more about your traffic. A <code>PolicyRule</code> is a flat JSON object: the
        request matchers (<code>methods</code>, <code>path_patterns</code>) sit at the top level.
      </p>
      <CodeBlock lang="json" code={`{
  "name": "allow-nudm-sdm-reads",
  "action": "allow",
  "methods": ["GET"],
  "path_patterns": ["/nudm-sdm/v2/"]
}`} />

      <p>Save this as <code>allow-nudm-sdm-reads.json</code>.</p>

      <h2 id="deploy">Deploy the rule</h2>
      <p>
        Create the rule through the admin API. The rule CRUD handler validates the body as it
        stores it, so a typo in a field name or an unknown <code>action</code> is rejected here
        with an error telling you what's wrong.
      </p>
      <CodeBlock lang="bash" code={`./bin/fgpctl policy-rules add @allow-nudm-sdm-reads.json`} />
      <p>
        The proxy persists the rule to the control-plane store, bumps the policy version, rebuilds
        the request filter chain, and swaps it in atomically. There is no restart, no dropped
        connections, no warm-up.
      </p>

      <p>Confirm the rule is now in place:</p>
      <CodeBlock lang="bash" code={`./bin/fgpctl policy-rules`} />

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
        timeout). The proxy's per-request log line records both facts: the policy decision (the
        filter chain let it through) and the final status code the consumer ultimately got.
        Ship those logs to your SIEM and metrics pipeline — see <Link to="/guides/observability">Setting up observability</Link>.
      </Callout>

      <h2 id="versioning">Versioning and rollback</h2>
      <p>
        Each rule mutation bumps the policy version. To capture a known-good policy you can roll
        back to, take a snapshot through the admin API before and after changes; restoring a
        snapshot reapplies that policy atomically. The operator-flow patterns (snapshot, restore,
        regression check) are covered in <Link to="/guides/policy-versioning">Versioning and rolling back policy</Link>.
      </p>

      <h2 id="next">Where to go next</h2>
      <p>
        A path-pattern rule that matches every consumer is fine for a smoke test but rarely the
        right production shape. Common refinements:
      </p>
      <ul>
        <li>Add <code>target_nf_types: ["UDM"]</code> to constrain by target NF type.</li>
        <li>Add <code>source_nf_types</code> to require specific consumer NF types.</li>
        <li>Require an OAuth2 scope check via the auth filter rather than path-only matching.</li>
        <li>Add a rate-limit rule keyed by consumer identity to cap noisy callers — see <Link to="/guides/rate-limiting">Configuring rate limiting</Link>.</li>
      </ul>
      <p>
        See <Link to="/reference/policy-schema">Policy schema</Link> for every available matcher
        field.
      </p>
    </DocPage>
  );
}
