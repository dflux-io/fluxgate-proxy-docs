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
      <p>
        Each rule names a single <code>action</code> and supplies its parameters in a{' '}
        <code>config</code> object. The actions group by what they touch:
      </p>
      <ul>
        <li>
          <strong>Headers:</strong> <code>header_set</code>, <code>header_add</code>,{' '}
          <code>header_remove</code>, <code>header_rewrite</code> (regex pattern and
          replacement).
        </li>
        <li>
          <strong>Body fields:</strong> <code>body_field_set</code>,{' '}
          <code>body_field_remove</code>, <code>body_field_mask</code> (full, partial, or hash),{' '}
          <code>body_field_map</code> (value lookup table). Body fields are addressed by JSON
          Pointer path.
        </li>
        <li>
          <strong>Response only:</strong> <code>status_rewrite</code> (remap a status code) and{' '}
          <code>error_normalize</code> (rewrite a 3GPP ProblemDetails body).
        </li>
        <li>
          <strong>Diameter AVPs:</strong> <code>avp_set</code>, <code>avp_add</code>,{' '}
          <code>avp_remove</code>, <code>avp_rewrite</code>, <code>avp_mask</code>, addressed by
          AVP code and vendor id.
        </li>
      </ul>
      <p>
        See <Link to="/reference/transformation-schema">Transformation schema</Link> for the full
        config field list per action.
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
        A rule with an empty <code>condition</code> block applies to every message in its phase.
        A populated <code>condition</code> runs the rule only when every set field matches. It
        embeds the same flat common-condition fields as policy rules (<code>path_patterns</code>,{' '}
        <code>methods</code>, <code>source_nf_types</code>, <code>target_nf_types</code>,{' '}
        <code>snssais</code>, AVP matchers, …) plus transform-specific{' '}
        <code>header_match</code>, <code>body_field_match</code>, and <code>status_codes</code>.
      </p>
      <p>
        Use match conditions to scope rules tightly. A rule that strips a sensitive header
        should typically match only the path patterns or NF types where that header appears.
      </p>

      <h2 id="example">Example: mask GPSI on inbound</h2>
      <p>
        A request-phase rule that masks the <code>gpsi</code> field in the body before the
        request reaches the producer:
      </p>
      <CodeBlock lang="json" code={`{
  "name": "mask-gpsi-inbound",
  "enabled": true,
  "phase": "request",
  "priority": 100,
  "condition": {
    "target_nf_types": ["UDM"],
    "path_patterns": ["/nudm-sdm/v2/.*"]
  },
  "action": "body_field_mask",
  "config": {
    "field_path": "/gpsi",
    "mask_value": "REDACTED"
  }
}`} />

      <h2 id="failure-semantics">Failure semantics</h2>
      <p>
        Transformation is mutate-only: the filter never blocks a message because a rule failed.
        Whatever the phase, a rule that errors is logged and skipped, and the message continues
        with whatever changes earlier rules applied.
      </p>
      <ul>
        <li>
          <strong>Request phase:</strong> the request-phase filter always allows the request
          through. A bad action (for example a body action whose field path does not resolve) is
          logged and skipped; if the body cannot be re-serialized after edits, it is left
          unchanged.
        </li>
        <li>
          <strong>Response phase (SBI):</strong> a rule that errors is logged and skipped, and
          the producer's answer is forwarded to the consumer.
        </li>
        <li>
          <strong>Response phase (Diameter):</strong> AVP-action errors are logged; the answer is
          sent to the consumer with whatever AVP edits succeeded.
        </li>
      </ul>
      <p>
        Because transformation failures surface as structured logs rather than blocked traffic,
        watch the decision logs (and the transformation metrics) for a rule that starts erroring
        after a deploy. See <Link to="/concepts/request-pipeline">Request pipeline</Link> for how
        the filter chain handles allow/deny decisions overall.
      </p>

      <h2 id="related">Where to go next</h2>
      <ul>
        <li><Link to="/reference/transformation-schema">Transformation schema</Link> — every action and its config fields.</li>
        <li><Link to="/api/transformations">Admin API: transformations</Link> — CRUD endpoints.</li>
        <li><Link to="/tutorials/first-transformation-rule">Tutorial: your first transformation rule</Link>.</li>
      </ul>
    </DocPage>
  );
}
