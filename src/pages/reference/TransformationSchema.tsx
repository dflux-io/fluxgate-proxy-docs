import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import { Link } from 'react-router-dom';

export default function TransformationSchema() {
  return (
    <DocPage
      slug="reference/transformation-schema"
      lede="The shape of a transformation rule. Same JSON for both phases, both protocols. Each rule carries one action — covering headers, body fields (JSON Pointer), Diameter AVPs, status-code rewrites, and 3GPP error normalization."
    >
      <h2 id="top-level">Top-level shape</h2>
      <p>
        A transformation rule pairs a <code>condition</code> (when it applies) with a single{' '}
        <code>action</code> and its <code>config</code> (what it does). To apply several changes,
        author several rules.
      </p>
      <CodeBlock lang="json" code={`{
  "name": "string",
  "description": "string (optional)",
  "enabled": true,
  "priority": 100,
  "phase": "request | response",
  "condition": {
    /* embeds CommonConditions; see /reference/policy-schema */
  },
  "action": "header_set",
  "config": {
    /* keys depend on the action; see the catalog below */
  }
}`} />

      <h3 id="phase-and-priority">phase and priority</h3>
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
          <strong><code>priority</code></strong> — lower runs first. Rules with equal priority
          sort by <code>name</code> ascending for determinism across restarts and replicas.
          Priorities don't span phases. A <code>priority: 100</code> rule sees the original
          request; a <code>priority: 200</code> rule in the same phase sees the request after
          the first rule applied, so design accordingly when rules touch the same field.
        </li>
        <li>
          <strong><code>enabled</code></strong> — a disabled rule is stored but never evaluated.
        </li>
      </ul>

      <h2 id="condition">condition</h2>
      <p>
        The <code>condition</code> object embeds the same{' '}
        <Link to="/reference/policy-schema">CommonConditions</Link> as a policy rule
        (path, method, NF types, S-NSSAIs, visited PLMNs, protocols, Diameter
        application/command/origin/dest, IMSI ranges) as a flat shape, plus three
        transform-specific matchers. A rule whose <code>condition</code> is empty applies to
        every message in its phase.
      </p>
      <ul>
        <li><code>header_match</code> — map of header name to regex pattern (matched on the value).</li>
        <li><code>body_field_match</code> — map of JSON Pointer to regex pattern (matched on the field value).</li>
        <li><code>status_codes</code> — array of integer status codes; response phase only.</li>
      </ul>

      <h2 id="actions">Actions</h2>
      <p>
        The <code>action</code> field is one of the values below. Each takes a fixed subset of{' '}
        <code>config</code> keys. Header and body-field actions work for SBI; AVP actions work
        for Diameter; <code>status_rewrite</code> and <code>error_normalize</code> are
        response-phase, SBI-only.
      </p>

      <h3 id="header-set">header_set</h3>
      <p>Set a header, replacing any existing value with the same name.</p>
      <CodeBlock lang="json" code={`{
  "action": "header_set",
  "config": {
    "header_name": "X-FGP-Correlation",
    "header_value": "\${request_id}"
  }
}`} />

      <h3 id="header-add">header_add</h3>
      <p>Append a header value without removing existing values of the same name.</p>
      <CodeBlock lang="json" code={`{
  "action": "header_add",
  "config": {
    "header_name": "Via",
    "header_value": "2.0 fgp-edge-1"
  }
}`} />

      <h3 id="header-remove">header_remove</h3>
      <CodeBlock lang="json" code={`{
  "action": "header_remove",
  "config": { "header_name": "Server" }
}`} />

      <h3 id="header-rewrite">header_rewrite</h3>
      <p>Regex match-and-substitute on the value of a header. No-op if the header is absent.</p>
      <CodeBlock lang="json" code={`{
  "action": "header_rewrite",
  "config": {
    "header_name": "Location",
    "pattern": "^https://internal\\\\.example\\\\.com/(.*)$",
    "replacement": "https://api.example.com/$1"
  }
}`} />

      <h3 id="body-field-set">body_field_set</h3>
      <p>Set or add a body field at a JSON Pointer path. <code>field_value</code> may be any JSON value.</p>
      <CodeBlock lang="json" code={`{
  "action": "body_field_set",
  "config": {
    "field_path": "/servingNetwork/mnc",
    "field_value": "260"
  }
}`} />

      <h3 id="body-field-remove">body_field_remove</h3>
      <CodeBlock lang="json" code={`{
  "action": "body_field_remove",
  "config": { "field_path": "/debugTrace" }
}`} />

      <h3 id="body-field-mask">body_field_mask</h3>
      <p>
        Mask the value at a JSON Pointer path. Set <code>mask_value</code> for a literal
        replacement, or use <code>mask_type</code> (<code>full</code>, <code>partial</code>,{' '}
        <code>hash</code>) with <code>mask_char</code>, <code>keep_prefix</code>, and{' '}
        <code>keep_suffix</code> to mask in place.
      </p>
      <CodeBlock lang="json" code={`{
  "action": "body_field_mask",
  "config": {
    "field_path": "/gpsi",
    "mask_value": "REDACTED"
  }
}`} />

      <h3 id="body-field-map">body_field_map</h3>
      <p>
        Replace the value at a JSON Pointer path by looking it up in <code>value_map</code>.
        If the current value isn't a key in the map, the field is left unchanged.
      </p>
      <CodeBlock lang="json" code={`{
  "action": "body_field_map",
  "config": {
    "field_path": "/ratType",
    "value_map": { "NR": "5G", "EUTRA": "4G" }
  }
}`} />

      <h3 id="status-rewrite">status_rewrite</h3>
      <p>
        Response phase only. Rewrites the HTTP status code from <code>from_status</code> to{' '}
        <code>to_status</code> when it matches.
      </p>
      <CodeBlock lang="json" code={`{
  "action": "status_rewrite",
  "phase": "response",
  "config": { "from_status": 503, "to_status": 500 }
}`} />

      <h3 id="error-normalize">error_normalize</h3>
      <p>
        Response phase only. For a <code>4xx</code>/<code>5xx</code> response whose body is not
        already a 3GPP ProblemDetails document (no <code>status</code> field), synthesizes a{' '}
        <code>application/problem+json</code> body from <code>error_title</code> and{' '}
        <code>error_cause</code>. Both fields default (to the HTTP status text and{' '}
        <code>SYSTEM_FAILURE</code>) if omitted.
      </p>
      <CodeBlock lang="json" code={`{
  "action": "error_normalize",
  "phase": "response",
  "config": {
    "error_title": "Upstream unavailable",
    "error_cause": "NF_CONGESTION"
  }
}`} />

      <h3 id="avp-set">avp_set (Diameter)</h3>
      <p>Set an AVP, replacing any existing instance. AVP value type is resolved from the dictionary by code.</p>
      <CodeBlock lang="json" code={`{
  "action": "avp_set",
  "config": {
    "avp_code": 264,
    "avp_vendor_id": 0,
    "avp_value": "fgp.epc.example.com"
  }
}`} />

      <h3 id="avp-add">avp_add (Diameter)</h3>
      <p>Add an AVP without removing existing instances of the same code.</p>
      <CodeBlock lang="json" code={`{
  "action": "avp_add",
  "config": {
    "avp_code": 1,
    "avp_vendor_id": 0,
    "avp_value": "user@new.realm"
  }
}`} />

      <h3 id="avp-remove">avp_remove (Diameter)</h3>
      <CodeBlock lang="json" code={`{
  "action": "avp_remove",
  "config": { "avp_code": 1407, "avp_vendor_id": 10415 }
}`} />

      <h3 id="avp-rewrite">avp_rewrite (Diameter)</h3>
      <p>Regex match-and-substitute on the string value of an AVP. No-op if the AVP is absent.</p>
      <CodeBlock lang="json" code={`{
  "action": "avp_rewrite",
  "config": {
    "avp_code": 1,
    "avp_vendor_id": 0,
    "pattern": "^(.*)@old\\\\.realm$",
    "replacement": "$1@new.realm"
  }
}`} />

      <h3 id="avp-mask">avp_mask (Diameter)</h3>
      <p>
        Mask an AVP's value using the same <code>mask_type</code>, <code>mask_char</code>,{' '}
        <code>keep_prefix</code>, and <code>keep_suffix</code> knobs as{' '}
        <code>body_field_mask</code>.
      </p>
      <CodeBlock lang="json" code={`{
  "action": "avp_mask",
  "config": {
    "avp_code": 1,
    "avp_vendor_id": 0,
    "mask_type": "partial",
    "keep_suffix": 4
  }
}`} />

      <h2 id="template-vars">Template variables</h2>
      <p>
        Header values (<code>header_value</code> on <code>header_set</code> and{' '}
        <code>header_add</code>) support <code>{`\${var}`}</code> substitution. Body and AVP
        values are written literally and do not template. Variables:
      </p>
      <ul>
        <li><code>{`\${request_id}`}</code> — the proxy's per-request identifier.</li>
        <li><code>{`\${supi}`}</code> — extracted SUPI, if any.</li>
        <li><code>{`\${gpsi}`}</code> — extracted GPSI, if any.</li>
        <li><code>{`\${dnn}`}</code> — extracted DNN, if any.</li>
        <li><code>{`\${source_nf_type}`}</code> — consumer NF type, if resolved.</li>
        <li><code>{`\${target_nf_type}`}</code> — producer NF type, if resolved.</li>
      </ul>
      <p>An unknown placeholder is left in the string verbatim. CR/LF characters are stripped from substituted values.</p>

      <h2 id="failure-semantics">Failure semantics</h2>
      <p>
        The transformation filter mutates but never blocks. A rule never denies or fails a
        request:
      </p>
      <ul>
        <li>
          <strong>Invalid regex</strong> — dropped at rule load time, logged as a warning. The
          rule's regex-based step is skipped; it cannot fail at request time.
        </li>
        <li>
          <strong>Bad JSON Pointer or non-JSON body</strong> — the failing op is logged at warn
          level and skipped; the message proceeds unchanged. Other ops on the same message still run.
        </li>
        <li>
          <strong>Response phase</strong> — read/marshal errors are logged; the response is
          forwarded (the original body is restored). The transform filter never synthesizes a
          5xx or 502.
        </li>
      </ul>
      <p>
        The filter records no allow/deny decision, so it does not appear in{' '}
        <code>fgp_filter_decisions_total</code>. Watch transformation activity through the
        debug/warn logs it emits and the request-stage metrics described in{' '}
        <Link to="/reference/metrics">Metrics</Link>.
      </p>

      <h2 id="related">Where to go next</h2>
      <ul>
        <li><Link to="/concepts/transformation-engine">Transformation engine</Link> — how rules are matched and ordered.</li>
        <li><Link to="/api/transformations">Admin API → Transformations</Link> — CRUD and dry-run.</li>
        <li><Link to="/tutorials/first-transformation-rule">Tutorial: your first transformation rule</Link>.</li>
      </ul>
    </DocPage>
  );
}
