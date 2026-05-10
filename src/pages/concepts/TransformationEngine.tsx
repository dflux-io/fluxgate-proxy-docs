import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function TransformationEngine() {
  return (
    <DocPage
      slug="concepts/transformation-engine"
      lede="Transformation rules rewrite traffic in flight. They run in two phases — before forwarding to a producer (request phase) and before answering the consumer (response phase) — and cover headers, body fields, and Diameter AVPs."
    >
      <h2 id="phases">Two phases, one rule format</h2>
      <p>
        Each transformation rule declares a <code>phase</code> of <code>request</code> or{' '}
        <code>response</code>. The request-phase filter runs inside the request filter chain,
        before routing. The response-phase filter runs in the response stage, before the answer
        reaches the consumer.
      </p>
      <p>
        Both phases use the same rule schema. The difference is <em>when</em> the rule fires and
        what it can see — request phase has the inbound request, response phase has the
        producer's answer.
      </p>

      <h2 id="ops">What rules can do</h2>
      <ul>
        <li><strong>Inject</strong> a header or AVP with a literal or templated value.</li>
        <li><strong>Remove</strong> a header or AVP.</li>
        <li><strong>Rewrite</strong> a header or AVP value by regex match-and-substitute.</li>
        <li><strong>Mask</strong> a body field — replace its value with a fixed redaction or hash.</li>
        <li><strong>Match</strong> a body field with a regex and perform a substitution.</li>
      </ul>
      <p>
        Body operations use JSON Pointer paths to address fields. AVP operations address by
        application id and AVP code. See{' '}
        <Link to="/reference/transformation-schema">Transformation schema</Link> for the full
        field list.
      </p>

      <h2 id="ordering">Rule ordering inside a phase</h2>
      <p>
        Within a phase, rules are sorted by <code>priority</code> ascending at filter-build
        time — <strong>lowest value runs first</strong>. Two rules with the same priority sort
        by name for determinism.
      </p>
      <Callout type="tip" title="Priority is per phase">
        Priorities don't span phases — a rule with priority <code>10</code> in the request
        phase has no relationship to a rule with priority <code>10</code> in the response
        phase.
      </Callout>

      <h2 id="match-conditions">Match conditions</h2>
      <p>
        A rule that has no <code>match</code> block applies to every request in its phase. A
        rule with a <code>match</code> block runs only when every populated field matches —
        same shape as a policy match block (NF type, method, path prefix, AVP matcher, …).
      </p>
      <p>
        Use match conditions to scope rules tightly. A rule that strips a sensitive header
        should typically match only the path or NF type where that header appears.
      </p>

      <h2 id="dry-run">Dry-run before deploy</h2>
      <p>
        The admin API exposes a dry-run endpoint that takes a candidate rule and a sample
        request and shows the resulting request — without committing the rule to the store.
        Use it to verify a regex substitution or body redaction before the rule reaches
        production traffic.
      </p>
      <p>
        See <Link to="/api/transformations">Admin API → Transformations</Link>.
      </p>

      <h2 id="example">Example: redact GPSI from inbound</h2>
      <p>
        A request-phase rule that masks the <code>gpsi</code> field in a body before the
        request reaches the producer:
      </p>
      <CodeBlock lang="json" code={`{
  "name": "mask-gpsi-inbound",
  "phase": "request",
  "priority": 100,
  "match": {
    "nf_type": "UDM",
    "path_prefix": "/nudm-sdm/v2/"
  },
  "ops": [
    {
      "op": "mask_body",
      "path": "/gpsi",
      "value": "REDACTED"
    }
  ]
}`} />

      <h2 id="failure-semantics">Failure semantics</h2>
      <ul>
        <li>
          <strong>Request phase:</strong> a rule that errors (e.g., invalid JSON Pointer) is
          treated as a transformation failure. The request is denied with a 5xx and the audit
          record carries the rule name and error. The failure is metric-tagged so you can alert
          on a rule that goes bad after deploy.
        </li>
        <li>
          <strong>Response phase (SBI):</strong> a rule that errors logs the failure and
          surfaces 502 to the consumer. Retry paths in the proxy log and continue.
        </li>
        <li>
          <strong>Response phase (Diameter):</strong> errors are logged; the answer is sent to
          the consumer unchanged.
        </li>
      </ul>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/reference/transformation-schema">Transformation schema</Link> — full op list.</li>
        <li><Link to="/api/transformations">Admin API → Transformations</Link> — CRUD + dry-run.</li>
        <li><Link to="/tutorials/first-transformation-rule">Tutorial: your first transformation rule</Link>.</li>
      </ul>
    </DocPage>
  );
}
