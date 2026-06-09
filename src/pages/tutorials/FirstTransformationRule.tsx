import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function FirstTransformationRule() {
  return (
    <DocPage
      slug="tutorials/first-transformation-rule"
      lede="Add a request-phase rule that injects a correlation header and a second rule that masks a body field, then deploy both and verify they fire."
    >
      <h2 id="prereqs">Before you start</h2>
      <ul>
        <li>The proxy running. See <Link to="/introduction/quickstart">Quickstart</Link>.</li>
        <li>
          A working policy rule so requests reach the transformation filter — even a single
          permissive rule from <Link to="/tutorials/first-sbi-policy">the policy tutorial</Link>{' '}
          is enough.
        </li>
      </ul>

      <h2 id="goal">What we're building</h2>
      <p>
        Two request-phase transformation rules that fire on inbound Nudm SDM reads. Each rule
        carries exactly one action, so the two patterns are two rules:
      </p>
      <ol>
        <li>
          <strong>Inject</strong> a correlation header (<code>X-FGP-Correlation</code>) so
          producer logs can be tied back to the proxy request id.
        </li>
        <li>
          <strong>Mask</strong> the <code>gpsi</code> body field if present, replacing it
          with a fixed string.
        </li>
      </ol>

      <h2 id="write">Write the rules</h2>
      <p>
        A <code>TransformationRule</code> has one <code>action</code> and its inputs live in a
        nested <code>config</code> object. The <code>condition</code> selects which requests the
        rule applies to; its matchers (<code>path_patterns</code>, <code>target_nf_types</code>,
        <code>methods</code>) are flat fields. Set <code>enabled</code> explicitly — a rule
        created without it is disabled and will not fire.
      </p>
      <p>The header rule (<code>header_set</code>), saved as <code>correlate.json</code>:</p>
      <CodeBlock lang="json" code={`{
  "name": "nudm-sdm-correlate",
  "enabled": true,
  "phase": "request",
  "priority": 100,
  "action": "header_set",
  "condition": {
    "target_nf_types": ["UDM"],
    "path_patterns": ["/nudm-sdm/v2/.*"]
  },
  "config": {
    "header_name": "X-FGP-Correlation",
    "header_value": "\${request_id}"
  }
}`} />
      <p>The masking rule (<code>body_field_mask</code>), saved as <code>redact.json</code>:</p>
      <CodeBlock lang="json" code={`{
  "name": "nudm-sdm-redact-gpsi",
  "enabled": true,
  "phase": "request",
  "priority": 110,
  "action": "body_field_mask",
  "condition": {
    "target_nf_types": ["UDM"],
    "path_patterns": ["/nudm-sdm/v2/.*"]
  },
  "config": {
    "field_path": "gpsi",
    "mask_value": "REDACTED"
  }
}`} />

      <Callout type="note" title="Templated values">
        The <code>{`\${request_id}`}</code> form expands to the proxy's per-request id at
        rule-fire time. Templates use the <code>{`\${var}`}</code> syntax; a header value with no{' '}
        <code>{`\${`}</code> is injected literally. See{' '}
        <Link to="/reference/transformation-schema">Transformation schema</Link> for the full
        template variable list.
      </Callout>

      <h2 id="deploy">Deploy the rules</h2>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:9091 transformations add @correlate.json
./bin/fgpctl -url http://127.0.0.1:9091 transformations add @redact.json`} />
      <p>
        Each rule takes effect immediately, with no restart — the proxy applies admin changes by
        hot-reloading the affected filter. Within the transformation filter, rules in a phase run
        in <code>priority</code> order, lowest first.
      </p>

      <h2 id="exercise">Exercise on the wire</h2>
      <CodeBlock lang="bash" code={`curl -i -X PATCH \\
  -H 'Content-Type: application/json' \\
  -d '{"gpsi":"msisdn-15551234567","snssai":{"sst":1}}' \\
  http://127.0.0.1:8090/nudm-sdm/v2/imsi-001010000000001/sm-data`} />

      <p>
        The response is whatever the producer returns. To verify the rules fired, scrape the
        Prometheus counter — the transformation filter reports under{' '}
        <code>filter="transformation"</code>:
      </p>
      <CodeBlock lang="bash" code={`curl -s http://127.0.0.1:8090/metrics \\
  | grep '^fgp_filter_decisions_total{.*filter="transformation"'`} />

      <h2 id="iterate">Iterate</h2>
      <p>Common follow-ons:</p>
      <ul>
        <li>
          <strong>Scope tighter.</strong> Add <code>methods</code> to the <code>condition</code> so
          the rule only fires on the verbs that actually carry the body fields you care about.
        </li>
        <li>
          <strong>Add a response-phase rule.</strong> Strip a sensitive header from the
          producer response before the consumer sees it. Use <code>"phase": "response"</code>.
        </li>
        <li>
          <strong>Order with priority.</strong> If you add another rule that touches the same
          field, set <code>priority</code> values so they fire in the order you expect — lowest
          runs first.
        </li>
      </ul>

      <h2 id="list-and-update">Update or remove</h2>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:9091 transformations list
./bin/fgpctl -url http://127.0.0.1:9091 transformations get nudm-sdm-correlate
./bin/fgpctl -url http://127.0.0.1:9091 transformations update nudm-sdm-correlate @correlate-v2.json
./bin/fgpctl -url http://127.0.0.1:9091 transformations delete nudm-sdm-correlate`} />

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/concepts/transformation-engine">Transformation engine</Link> — phases, ordering, failure semantics.</li>
        <li><Link to="/reference/transformation-schema">Transformation schema</Link> — full op list.</li>
        <li><Link to="/api/transformations">Admin API → Transformations</Link>.</li>
      </ul>
    </DocPage>
  );
}
