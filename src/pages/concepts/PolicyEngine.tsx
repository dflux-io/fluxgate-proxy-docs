import DocPage from '../../components/DocPage';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function PolicyEngine() {
  return (
    <DocPage
      slug="concepts/policy-engine"
      lede="The policy engine decides which requests FGP forwards. Rules live in the control-plane store, evaluate in store order with first-match-wins semantics, and fall back to a configured default action. It runs on both SBI and Diameter, with one rule set."
    >
      <h2 id="rules">Rules</h2>
      <p>
        A <code>PolicyRule</code> is a named record with three parts:
      </p>
      <ul>
        <li><strong>Action</strong> — <code>allow</code> or <code>deny</code>.</li>
        <li>
          <strong>Match</strong> — the conditions a request must satisfy for the rule to apply.
          Match fields include NF type, HTTP method, path / path prefix, SUPI / GPSI / DNN /
          S-NSSAI body fields, source IP CIDRs, tenant, and AVP matchers for Diameter messages.
        </li>
        <li><strong>Metadata</strong> — a description and timestamps for audit and diffing.</li>
      </ul>
      <p>
        A <code>PolicyRule</code> has <em>no</em> priority field. Order in the store is the
        order of evaluation.
      </p>

      <h2 id="evaluation">How a request matches</h2>
      <ol>
        <li>The policy filter iterates the rule list in store order.</li>
        <li>For each rule, every match field is evaluated against the request. Empty fields don't constrain.</li>
        <li>The first rule whose every populated field matches "wins". Its action becomes the decision.</li>
        <li>If no rule matches, the configured <code>default_action</code> applies.</li>
      </ol>

      <Callout type="warning" title="v1 default is deny">
        <code>admin.default_action: deny</code> is the v1 default (fail-closed). A fresh
        install with no rules denies <em>every</em> request. Add at least one allow rule before
        sending real traffic, or flip the default — see{' '}
        <Link to="/guides/securing-the-admin-api">Securing the admin API</Link> for the
        trade-offs.
      </Callout>

      <h2 id="sbi-vs-diameter">SBI vs Diameter matching</h2>
      <p>
        The match block carries fields for both protocols. Fields that don't apply to a request
        are ignored. For example:
      </p>
      <ul>
        <li>
          On an SBI request, <code>method</code>, <code>path_prefix</code>, <code>nf_type</code>,
          and SUPI / GPSI / DNN / S-NSSAI extract from the URI and request body.
        </li>
        <li>
          On a Diameter request, <code>avp</code> matchers (Command-Code, application id,
          AVP-Code value tests) cover the same role. SBI-shaped fields stay empty.
        </li>
      </ul>
      <p>
        A single rule can target one protocol or both. A rule whose match block populates only
        SBI fields will never match a Diameter request, and vice versa.
      </p>

      <h2 id="versioning">Versioning</h2>
      <p>
        Every policy mutation creates a new version. You can inspect the history, fetch a
        specific version, structurally diff two versions, and roll back to any prior version
        atomically — all without restarting the proxy.
      </p>
      <ul>
        <li><code>GET /admin/policy/versions</code> — list versions.</li>
        <li><code>GET /admin/policy/versions/{`{version}`}</code> — fetch one version.</li>
        <li>
          <code>GET /admin/policy/versions/compare?v1=N&amp;v2=M</code> — structural diff
          (path / op / before / after).
        </li>
        <li><code>POST /admin/policy/rollback/{`{version}`}</code> — atomic rollback.</li>
      </ul>
      <p>
        See <Link to="/guides/policy-versioning">Policy versioning and rollback</Link> for the
        operator workflow.
      </p>

      <h2 id="dry-run">Validation</h2>
      <p>
        <code>POST /admin/policy/validate</code> takes a candidate policy document and runs the
        same checks the store would on update — syntactic, semantic, and rule-shape — without
        committing. Use it in CI before pushing a policy change. See{' '}
        <Link to="/api/policy">Admin API → Policy</Link>.
      </p>

      <h2 id="audit">Audit</h2>
      <p>
        Every decision lands in the audit store: the matched rule (if any), the action, the
        deny reason (if denied), the decision filter (policy / rate-limit / threat / …), and
        the protocol context. Audit records are the canonical record of what the proxy did. See{' '}
        <Link to="/guides/audit-and-compliance">Audit and compliance</Link>.
      </p>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/reference/policy-schema">Policy schema</Link> — every match-block field.</li>
        <li><Link to="/api/policy">Admin API → Policy</Link> — CRUD, versions, rollback.</li>
        <li><Link to="/tutorials/first-sbi-policy">Tutorial: your first SBI policy</Link>.</li>
      </ul>
    </DocPage>
  );
}
