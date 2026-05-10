import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function FirstTransformationRule() {
  return (
    <DocPage
      slug="tutorials/first-transformation-rule"
      lede="Add a request-phase rule that injects a correlation header and redacts a body field, validate it against a sample request via dry-run, then deploy. Demonstrates the two patterns most operators reach for first."
    >
      <h2 id="prereqs">Before you start</h2>
      <ul>
        <li>FGP running. See <Link to="/introduction/quickstart">Quickstart</Link>.</li>
        <li>
          A working policy rule so requests reach the transformation filter — even a single
          permissive rule from <Link to="/tutorials/first-sbi-policy">the policy tutorial</Link>{' '}
          is enough.
        </li>
      </ul>

      <h2 id="goal">What we're building</h2>
      <p>
        A request-phase rule that does two things on inbound Nudm SDM reads:
      </p>
      <ol>
        <li>
          <strong>Inject</strong> a correlation header (<code>X-FGP-Correlation</code>) so
          producer logs can be tied back to the proxy request id.
        </li>
        <li>
          <strong>Redact</strong> the <code>gpsi</code> body field if present, replacing it
          with a fixed string.
        </li>
      </ol>

      <h2 id="write">Write the rule</h2>
      <CodeBlock lang="json" code={`{
  "name": "nudm-sdm-correlate-and-redact",
  "phase": "request",
  "priority": 100,
  "match": {
    "nf_type": "UDM",
    "path_prefix": "/nudm-sdm/v2/"
  },
  "ops": [
    {
      "op": "inject_header",
      "name": "X-FGP-Correlation",
      "value": "{{ request_id }}"
    },
    {
      "op": "mask_body",
      "path": "/gpsi",
      "value": "REDACTED"
    }
  ]
}`} />
      <p>Save as <code>nudm-correlate.json</code>.</p>

      <Callout type="note" title="Templated values">
        The <code>{`{{ request_id }}`}</code> form expands to the proxy's per-request UUID at
        rule-fire time. See <Link to="/reference/transformation-schema">Transformation schema</Link>{' '}
        for the full template variable list.
      </Callout>

      <h2 id="dry-run">Dry-run against a sample request</h2>
      <p>
        Before committing, ask the proxy to apply the rule to a sample request and show the
        result. This is the safest way to test a regex or a JSON Pointer path.
      </p>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:8091 transformations dry-run @nudm-correlate.json << 'EOF'
{
  "method": "PATCH",
  "path": "/nudm-sdm/v2/imsi-001010000000001/sm-data",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "gpsi": "msisdn-15551234567",
    "snssai": {"sst": 1}
  }
}
EOF`} />

      <p>
        The response shows the transformed request. Verify:
      </p>
      <ul>
        <li><code>X-FGP-Correlation</code> appears in headers with a UUID value.</li>
        <li>The body's <code>gpsi</code> field reads <code>"REDACTED"</code>.</li>
        <li>The body's <code>snssai</code> field is untouched.</li>
      </ul>

      <h2 id="deploy">Deploy the rule</h2>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:8091 transformations add @nudm-correlate.json`} />
      <p>
        The proxy persists the rule, rebuilds the request filter chain (with the
        transformation filter sorted by priority), and atomic-swaps it in. No restart.
      </p>

      <h2 id="exercise">Exercise on the wire</h2>
      <CodeBlock lang="bash" code={`curl -i -X PATCH \\
  -H 'Content-Type: application/json' \\
  -d '{"gpsi":"msisdn-15551234567","snssai":{"sst":1}}' \\
  http://127.0.0.1:8090/nudm-sdm/v2/imsi-001010000000001/sm-data`} />

      <p>
        The response is whatever the producer returns. To verify the rule fired, scrape the
        Prometheus counter:
      </p>
      <CodeBlock lang="bash" code={`curl -s http://127.0.0.1:8090/metrics \\
  | grep '^fgp_filter_decisions_total{.*filter="transform"'`} />

      <h2 id="iterate">Iterate</h2>
      <p>Common follow-ons:</p>
      <ul>
        <li>
          <strong>Scope tighter.</strong> Add a method filter to the match block so the rule
          only fires on the verbs that actually carry the body fields you care about.
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
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:8091 transformations list
./bin/fgpctl -url http://127.0.0.1:8091 transformations get nudm-sdm-correlate-and-redact
./bin/fgpctl -url http://127.0.0.1:8091 transformations update nudm-sdm-correlate-and-redact @nudm-correlate-v2.json
./bin/fgpctl -url http://127.0.0.1:8091 transformations delete nudm-sdm-correlate-and-redact`} />

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/concepts/transformation-engine">Transformation engine</Link> — phases, ordering, failure semantics.</li>
        <li><Link to="/reference/transformation-schema">Transformation schema</Link> — full op list.</li>
        <li><Link to="/api/transformations">Admin API → Transformations</Link>.</li>
      </ul>
    </DocPage>
  );
}
