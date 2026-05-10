import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import { Link } from 'react-router-dom';

export default function TransformationSchema() {
  return (
    <DocPage
      slug="reference/transformation-schema"
      lede="The shape of a transformation rule. Same JSON for both phases, both protocols. Ops cover headers, body fields (JSON Pointer), Diameter AVPs, and full body regex substitution."
    >
      <h2 id="top-level">Top-level shape</h2>
      <CodeBlock lang="json" code={`{
  "name": "string",
  "phase": "request | response",
  "priority": 100,
  "description": "string (optional)",
  "match": {
    /* same shape as PolicyRule.match — see /reference/policy-schema */
  },
  "ops": [ /* one or more op records */ ]
}`} />

      <h2 id="phase-and-priority">phase and priority</h2>
      <ul>
        <li>
          <strong><code>phase: request</code></strong> — fires in the request filter chain
          before forwarding. Sees and can rewrite the inbound request.
        </li>
        <li>
          <strong><code>phase: response</code></strong> — fires in the response stage before
          the answer reaches the consumer. Sees and can rewrite the producer's answer.
        </li>
        <li>
          <strong><code>priority</code></strong> — lower runs first. Two rules with the same
          priority sort by name for determinism. Priorities don't span phases.
        </li>
      </ul>

      <h2 id="match">match</h2>
      <p>
        Same shape as <code>PolicyRule.match</code>. A rule without a match block applies to
        every request in its phase. See <Link to="/reference/policy-schema">Policy schema</Link>{' '}
        for field details.
      </p>

      <h2 id="ops">Operations</h2>

      <h3 id="inject-header">inject_header</h3>
      <p>Add a header. Replaces any existing value with the same name.</p>
      <CodeBlock lang="json" code={`{
  "op": "inject_header",
  "name": "X-FGP-Correlation",
  "value": "{{ request_id }}"
}`} />

      <h3 id="remove-header">remove_header</h3>
      <CodeBlock lang="json" code={`{
  "op": "remove_header",
  "name": "Server"
}`} />

      <h3 id="rewrite-header">rewrite_header</h3>
      <p>Regex match-and-substitute on the value of a header.</p>
      <CodeBlock lang="json" code={`{
  "op": "rewrite_header",
  "name": "Location",
  "match": "^https://internal\\\\.example\\\\.com/(.*)$",
  "replace": "https://api.example.com/$1"
}`} />

      <h3 id="mask-body">mask_body</h3>
      <p>Replace the JSON value at a path with a fixed string. The path is a JSON Pointer.</p>
      <CodeBlock lang="json" code={`{
  "op": "mask_body",
  "path": "/gpsi",
  "value": "REDACTED"
}`} />

      <h3 id="rewrite-body">rewrite_body</h3>
      <p>Regex match-and-substitute on the value at a JSON Pointer path.</p>
      <CodeBlock lang="json" code={`{
  "op": "rewrite_body",
  "path": "/userLocationInformation/cgi",
  "match": "^310-260-([0-9]+)-([0-9]+)$",
  "replace": "***-***-$1-$2"
}`} />

      <h3 id="set-body">set_body</h3>
      <p>Set or add a body field at a JSON Pointer path.</p>
      <CodeBlock lang="json" code={`{
  "op": "set_body",
  "path": "/audit/proxied_by",
  "value": "fgp-edge-1"
}`} />

      <h3 id="remove-body">remove_body</h3>
      <CodeBlock lang="json" code={`{
  "op": "remove_body",
  "path": "/debugTrace"
}`} />

      <h3 id="inject-avp">inject_avp (Diameter)</h3>
      <CodeBlock lang="json" code={`{
  "op": "inject_avp",
  "code": 264,                  // Origin-Host
  "vendor_id": 0,
  "value": "fgp.epc.example.com"
}`} />

      <h3 id="remove-avp">remove_avp (Diameter)</h3>
      <CodeBlock lang="json" code={`{
  "op": "remove_avp",
  "code": 1407,
  "vendor_id": 10415
}`} />

      <h3 id="rewrite-avp">rewrite_avp (Diameter)</h3>
      <p>Regex substitute on a string AVP, or numeric replacement on a numeric AVP.</p>
      <CodeBlock lang="json" code={`{
  "op": "rewrite_avp",
  "code": 1,                    // User-Name
  "vendor_id": 0,
  "match": "^(.*)@old\\\\.realm$",
  "replace": "$1@new.realm"
}`} />

      <h2 id="template-vars">Template variables</h2>
      <p>
        Header and AVP <code>value</code> fields, and <code>set_body.value</code>, accept
        <code>{`{{ var }}`}</code> templates. Variables available:
      </p>
      <ul>
        <li><code>{`{{ request_id }}`}</code> — the proxy's per-request UUID.</li>
        <li><code>{`{{ now }}`}</code> — RFC 3339 timestamp at fire time.</li>
        <li><code>{`{{ consumer }}`}</code> — resolved consumer identity, if any.</li>
        <li><code>{`{{ tenant }}`}</code> — resolved tenant identity, if any.</li>
        <li><code>{`{{ supi }}`}</code> — extracted SUPI, if any.</li>
        <li><code>{`{{ env.NAME }}`}</code> — environment variable from the daemon process.</li>
      </ul>

      <h2 id="failure-semantics">Failure semantics</h2>
      <ul>
        <li>
          <strong>Request-phase failure</strong> (bad JSON Pointer, invalid regex, etc.) — the
          request is denied with a 5xx. The audit record carries the rule name and error. The
          failure increments <code>fgp_filter_decisions_total{`{filter="transform"`}</code>.
        </li>
        <li>
          <strong>Response-phase failure (SBI)</strong> — surfaces 502 to the consumer. The
          retry path logs and continues.
        </li>
        <li>
          <strong>Response-phase failure (Diameter)</strong> — logged; the answer is sent to
          the consumer unchanged.
        </li>
      </ul>

      <h2 id="ordering">Ordering</h2>
      <p>
        Within a phase, rules sort by <code>priority</code> ascending at chain-build time. Two
        rules with priority <code>100</code> and <code>200</code> means the <code>100</code>{' '}
        rule sees the original request and the <code>200</code> rule sees the request after
        the first rule applied. Design accordingly when rules touch the same field.
      </p>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/concepts/transformation-engine">Transformation engine</Link>.</li>
        <li><Link to="/api/transformations">Admin API → Transformations</Link> — CRUD + dry-run.</li>
        <li><Link to="/tutorials/first-transformation-rule">Tutorial</Link>.</li>
      </ul>
    </DocPage>
  );
}
