import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';

export default function Fgpctl() {
  return (
    <DocPage
      slug="reference/fgpctl"
      lede="The full fgpctl command list. fgpctl is a thin admin-API client — every command maps to one or more admin HTTP endpoints. JSON payloads can be passed inline or read from a file with the @file syntax."
    >
      <h2 id="usage">Usage</h2>
      <CodeBlock lang="text" code={`fgpctl [options] <command> [args]`} />

      <h2 id="global-options">Global options</h2>
      <table>
        <thead><tr><th>Flag</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>-url &lt;addr&gt;</code></td><td><code>http://127.0.0.1:9091</code></td><td>Admin API base URL.</td></tr>
          <tr><td><code>-key &lt;key&gt;</code></td><td>—</td><td>Admin API key. Falls back to the <code>FGP_ADMIN_KEY</code> environment variable.</td></tr>
          <tr><td><code>-v</code> / <code>-version</code></td><td>—</td><td>Print version and exit.</td></tr>
        </tbody>
      </table>

      <h2 id="status-policy">Status and policy</h2>
      <table>
        <thead><tr><th>Command</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>status</code></td><td>Proxy status and version.</td></tr>
          <tr><td><code>policy</code></td><td>Show current full policy document.</td></tr>
          <tr><td><code>policy update &lt;file&gt;</code></td><td>Update full policy from a JSON file.</td></tr>
        </tbody>
      </table>

      <h2 id="policy-rules">Policy rules</h2>
      <table>
        <thead><tr><th>Command</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>policy-rules</code></td><td>List policy rules.</td></tr>
          <tr><td><code>policy-rules get &lt;name&gt;</code></td><td>Get a rule by name.</td></tr>
          <tr><td><code>policy-rules add &lt;json|@file&gt;</code></td><td>Create a rule.</td></tr>
          <tr><td><code>policy-rules update &lt;name&gt; &lt;json|@file&gt;</code></td><td>Update a rule.</td></tr>
          <tr><td><code>policy-rules delete &lt;name&gt;</code></td><td>Delete a rule.</td></tr>
          <tr><td><code>policy-rules delete-all</code></td><td>Delete every policy rule.</td></tr>
        </tbody>
      </table>

      <h2 id="rate-limits">Rate limits</h2>
      <table>
        <thead><tr><th>Command</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>rate-limits</code></td><td>List rate limits.</td></tr>
          <tr><td><code>rate-limits get &lt;name&gt;</code></td><td>Get a rate-limit rule.</td></tr>
          <tr><td><code>rate-limits add &lt;json|@file&gt;</code></td><td>Create a rate limit.</td></tr>
          <tr><td><code>rate-limits update &lt;name&gt; &lt;json|@file&gt;</code></td><td>Update a rate limit.</td></tr>
          <tr><td><code>rate-limits delete &lt;name&gt;</code></td><td>Delete a rate limit.</td></tr>
          <tr><td><code>rate-limits delete-all</code></td><td>Delete every rate limit.</td></tr>
        </tbody>
      </table>

      <h2 id="transformations">Transformations and routing</h2>
      <table>
        <thead><tr><th>Command</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>transformations list</code></td><td>List transformation rules.</td></tr>
          <tr><td><code>transformations get &lt;name&gt;</code></td><td>Get a transformation rule.</td></tr>
          <tr><td><code>transformations add &lt;json|@file&gt;</code></td><td>Create a transformation rule.</td></tr>
          <tr><td><code>transformations update &lt;name&gt; &lt;json|@file&gt;</code></td><td>Update a transformation rule.</td></tr>
          <tr><td><code>transformations delete &lt;name&gt;</code></td><td>Delete a transformation rule.</td></tr>
          <tr><td><code>transformations delete-all</code></td><td>Delete every transformation rule.</td></tr>
          <tr><td><code>routing-rules list</code></td><td>List routing rules.</td></tr>
          <tr><td><code>routing-rules get &lt;name&gt;</code></td><td>Get a routing rule.</td></tr>
          <tr><td><code>routing-rules add &lt;json|@file&gt;</code></td><td>Create a routing rule.</td></tr>
          <tr><td><code>routing-rules update &lt;name&gt; &lt;json|@file&gt;</code></td><td>Update a routing rule.</td></tr>
          <tr><td><code>routing-rules delete &lt;name&gt;</code></td><td>Delete a routing rule.</td></tr>
          <tr><td><code>routing-rules delete-all</code></td><td>Delete every routing rule.</td></tr>
        </tbody>
      </table>

      <h2 id="producers">Producers and profiles</h2>
      <table>
        <thead><tr><th>Command</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>producer-configs list</code></td><td>List persistent producer configs.</td></tr>
          <tr><td><code>producer-configs get &lt;name&gt;</code></td><td>Get a producer config.</td></tr>
          <tr><td><code>producer-configs add &lt;json|@file&gt;</code></td><td>Create a producer config.</td></tr>
          <tr><td><code>producer-configs update &lt;name&gt; &lt;json|@file&gt;</code></td><td>Update a producer config.</td></tr>
          <tr><td><code>producer-configs delete &lt;name&gt;</code></td><td>Delete a producer config.</td></tr>
          <tr><td><code>producer-configs delete-all</code></td><td>Delete every producer config.</td></tr>
          <tr><td><code>nrf-profiles list</code></td><td>List NRF NF profiles.</td></tr>
          <tr><td><code>nrf-profiles get &lt;name&gt;</code></td><td>Get an NRF NF profile.</td></tr>
          <tr><td><code>nrf-profiles add &lt;json|@file&gt;</code></td><td>Create an NRF NF profile.</td></tr>
          <tr><td><code>nrf-profiles update &lt;name&gt; &lt;json|@file&gt;</code></td><td>Update an NRF NF profile.</td></tr>
          <tr><td><code>nrf-profiles delete &lt;name&gt;</code></td><td>Delete an NRF NF profile.</td></tr>
          <tr><td><code>nrf-profiles delete-all</code></td><td>Delete every NRF NF profile.</td></tr>
          <tr><td><code>producers list &lt;nf_type&gt;</code></td><td>List SBI peers for an NF type.</td></tr>
          <tr><td><code>producers drain &lt;nf_type&gt; &lt;addr&gt;</code></td><td>Drain an SBI peer.</td></tr>
          <tr><td><code>producers restore &lt;nf_type&gt; &lt;addr&gt;</code></td><td>Restore a drained SBI peer.</td></tr>
          <tr><td><code>producers weight &lt;nf_type&gt; &lt;addr&gt; &lt;w&gt;</code></td><td>Set SBI peer weight.</td></tr>
        </tbody>
      </table>

      <h2 id="diameter">Diameter</h2>
      <table>
        <thead><tr><th>Command</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>diameter peers</code></td><td>List Diameter peer connections and state.</td></tr>
          <tr><td><code>diameter stats</code></td><td>Diameter relay statistics.</td></tr>
        </tbody>
      </table>

      <h2 id="validation-health">Validation, health, metrics</h2>
      <table>
        <thead><tr><th>Command</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>validate config &lt;file&gt;</code></td><td>Validate a config file without applying it.</td></tr>
          <tr><td><code>validate policy &lt;file&gt;</code></td><td>Validate a policy document without applying it.</td></tr>
          <tr><td><code>health-deep</code></td><td>Deep health check (producer reachability).</td></tr>
          <tr><td><code>metrics-summary</code></td><td>Aggregated metrics summary.</td></tr>
        </tbody>
      </table>

      <h2 id="log-level">Log level</h2>
      <table>
        <thead><tr><th>Command</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>log-level</code></td><td>Show current log level.</td></tr>
          <tr><td><code>log-level set &lt;level&gt;</code></td><td>Change log level at runtime. <code>debug</code> | <code>info</code> | <code>warn</code> | <code>error</code>.</td></tr>
        </tbody>
      </table>

      <h2 id="json-files">JSON inline vs <code>@file</code></h2>
      <p>
        Every command that takes a JSON payload accepts either an inline JSON string or
        <code>@file.json</code> to read from disk. The <code>@</code> prefix is recommended for
        anything non-trivial — quoting JSON in shell is fiddly.
      </p>
      <CodeBlock lang="bash" code={`# inline
fgpctl policy-rules add '{"name":"allow-x","action":"allow","path_patterns":["/x"]}'

# from file
fgpctl policy-rules add @allow-x.json`} />

      <h2 id="examples">Examples</h2>
      <CodeBlock lang="bash" code={`# Status
fgpctl status

# Authenticated against a remote admin URL
fgpctl -url https://fgp.svc:9091 -key "$FGP_ADMIN_KEY" policy

# Apply a rule from a file
fgpctl policy-rules add @rules/block-anonymous.json

# Live log-level bump while chasing an issue
fgpctl log-level set debug
# … reproduce …
fgpctl log-level set info`} />
    </DocPage>
  );
}
