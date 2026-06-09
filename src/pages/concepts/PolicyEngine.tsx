import DocPage from '../../components/DocPage';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function PolicyEngine() {
  return (
    <DocPage
      slug="concepts/policy-engine"
      lede="The policy engine decides which requests fluxgate-proxy forwards. Rules live in the control-plane store, evaluate in priority order with first-match-wins semantics, and fall back to a configured default action. It runs on both SBI and Diameter from one rule set."
    >
      <h2 id="rules">Rules</h2>
      <p>
        A policy rule is a named record with two essential parts:
      </p>
      <ul>
        <li><strong>Action</strong> — <code>allow</code> or <code>deny</code>.</li>
        <li>
          <strong>Match conditions</strong> — the predicates a request must satisfy for the rule
          to apply. SBI conditions include <code>path_patterns</code>, <code>methods</code>,{' '}
          <code>source_nf_types</code> / <code>target_nf_types</code>, <code>snssais</code>, and
          subscriber matchers (<code>supi_ranges</code>, <code>gpsi_patterns</code>,{' '}
          <code>dnns</code>) extracted from the request body. Diameter conditions include{' '}
          <code>diameter_apps</code>, <code>command_codes</code>, origin / destination realms and
          hosts, <code>imsi_ranges</code>, and AVP matchers. The rule shape is flat — there is no
          nested match object.
        </li>
      </ul>
      <p>
        Every match condition is optional. An empty field is a wildcard and does not constrain the
        request. The full field list is in the{' '}
        <Link to="/reference/policy-schema">policy schema</Link>.
      </p>
      <p>
        Rules carry a <code>priority</code> (an integer) that sets evaluation order: lower values
        evaluate first. Ties are broken by rule name in ascending order, so ordering is
        deterministic across restarts and replicas.
      </p>

      <h2 id="evaluation">How a request matches</h2>
      <ol>
        <li>The policy filter walks rules in priority order (lowest first, then by name).</li>
        <li>For each rule, every populated match condition is evaluated against the request. Empty conditions don't constrain.</li>
        <li>The first rule whose every populated condition matches wins. Its action becomes the decision.</li>
        <li>If no rule matches, the configured <code>default_action</code> applies.</li>
      </ol>

      <Callout type="warning" title="The default action is deny">
        <code>default_action: deny</code> is the default (fail-closed). A fresh install with no
        rules denies <em>every</em> request. Add at least one allow rule before sending real
        traffic, or set the default to <code>allow</code> — see{' '}
        <Link to="/guides/securing-the-admin-api">Securing the admin API</Link> for the
        trade-offs.
      </Callout>

      <h2 id="sbi-vs-diameter">SBI vs Diameter matching</h2>
      <p>
        A rule's conditions cover both protocols. Conditions that don't apply to a request are
        ignored, and an optional <code>protocols</code> field scopes a rule to <code>sbi</code> or{' '}
        <code>diameter</code> explicitly. For example:
      </p>
      <ul>
        <li>
          On an SBI request, <code>methods</code>, <code>path_patterns</code>, NF-type
          conditions, and the SUPI / GPSI / DNN / S-NSSAI matchers test against the URI and request
          body.
        </li>
        <li>
          On a Diameter request, <code>command_codes</code>, <code>diameter_apps</code>, realm /
          host conditions, <code>imsi_ranges</code>, and AVP matchers cover the same role.
          SBI-shaped conditions stay empty.
        </li>
      </ul>
      <p>
        A single rule can target one protocol or both. A rule that populates only SBI conditions
        will never match a Diameter request, and vice versa.
      </p>

      <h2 id="snapshots">Snapshots</h2>
      <p>
        The live policy is read-only over the admin API at <code>GET /admin/policy</code>;
        mutations go through the typed rule CRUD under <code>/admin/rules</code>. For point-in-time
        captures, you can take named, immutable snapshots of the full policy and restore one later
        — all without restarting the proxy.
      </p>
      <ul>
        <li><code>GET /admin/policy/snapshots</code> — list snapshots.</li>
        <li><code>POST /admin/policy/snapshots</code> — capture the current policy.</li>
        <li><code>GET /admin/policy/snapshots/{`{id}`}</code> — fetch one snapshot.</li>
        <li><code>POST /admin/policy/snapshots/{`{id}`}/restore</code> — restore a snapshot as the live policy.</li>
        <li><code>DELETE /admin/policy/snapshots/{`{id}`}</code> — delete a snapshot.</li>
      </ul>
      <p>
        See <Link to="/guides/policy-versioning">Versioning and rolling back policy</Link> for the
        operator workflow.
      </p>

      <h2 id="decisions">Decision logs</h2>
      <p>
        Each policy decision is emitted as a structured JSON log line: the matched rule (when a
        rule fires), the action, the deny reason, and the request context such as path and target
        NF type. Ship those logs to your log pipeline or SIEM, and pair them with the{' '}
        <Link to="/reference/metrics">Prometheus metrics</Link> for aggregate counts. See{' '}
        <Link to="/guides/observability">Setting up observability</Link>.
      </p>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/reference/policy-schema">Policy schema</Link> — every match condition.</li>
        <li><Link to="/api/policy">Admin API: Policy</Link> — read, CRUD, snapshots.</li>
        <li><Link to="/tutorials/first-sbi-policy">Tutorial: your first SBI policy</Link>.</li>
      </ul>
    </DocPage>
  );
}
