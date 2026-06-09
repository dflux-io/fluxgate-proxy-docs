import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';

export default function FgpCli() {
  return (
    <DocPage
      slug="reference/fgp-cli"
      lede="Every command-line flag accepted by the fgp daemon. CLI flags act as an overlay on the loaded config — see the precedence order below. Flags you don't type on the command line keep their file values."
    >
      <h2 id="usage">Usage</h2>
      <CodeBlock lang="text" code={`fgp [options]`} />

      <h2 id="server-options">Server options</h2>
      <table>
        <thead><tr><th>Flag</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>-addr &lt;addr&gt;</code></td><td><code>:8090</code></td><td>Listen address for the SBI proxy.</td></tr>
          <tr><td><code>-config &lt;file&gt;</code></td><td>—</td><td>Path to YAML or JSON config file.</td></tr>
          <tr><td><code>-print-config</code></td><td><code>false</code></td><td>Load + overlay + print resolved (redacted) config to stdout, then exit 0. Use as a pre-deploy gate.</td></tr>
          <tr><td><code>-print-config-format</code></td><td><code>yaml</code></td><td>Output format for <code>-print-config</code>: <code>yaml</code> or <code>json</code>.</td></tr>
          <tr><td><code>-redirect</code></td><td><code>false</code></td><td>Redirect mode: 307 redirect to the producer instead of proxying. Useful when consumers can follow redirects and want direct producer connections after the first hop.</td></tr>
          <tr><td><code>-web</code></td><td><code>false</code></td><td>Enable the React management panel on the admin listener (<code>:9091</code>).</td></tr>
          <tr><td><code>-web-frontend-dir &lt;dir&gt;</code></td><td>—</td><td>Serve the web UI from this directory instead of the embedded build (development).</td></tr>
          <tr><td><code>-v</code> / <code>-version</code></td><td>—</td><td>Print version and exit.</td></tr>
        </tbody>
      </table>

      <h2 id="database-options">Database options</h2>
      <p>These flags select the control-plane store. The driver and DSN are independent — there is no on/off switch; <code>-db-driver</code> defaults to <code>sqlite</code>.</p>
      <table>
        <thead><tr><th>Flag</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>-db-driver &lt;name&gt;</code></td><td><code>sqlite</code></td><td>Control-plane DB driver: <code>sqlite</code> or <code>postgres</code>. Overlays onto <code>storage.control_plane_db.driver</code>.</td></tr>
          <tr><td><code>-db-dsn &lt;dsn&gt;</code></td><td>—</td><td>Control-plane DB connection string. Overlays onto <code>storage.control_plane_db.dsn</code>.</td></tr>
          <tr><td><code>-db-query-log</code></td><td><code>false</code></td><td>Log every SQL query at debug level. Slow queries (&gt; 200 ms) log at warn.</td></tr>
        </tbody>
      </table>

      <h2 id="logging-options">Logging options</h2>
      <table>
        <thead><tr><th>Flag</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>-debug</code></td><td><code>false</code></td><td>Shorthand for <code>--level=debug</code>.</td></tr>
          <tr><td><code>-trace</code></td><td><code>false</code></td><td>Shorthand for <code>--level=trace</code> (most verbose; logs bodies — avoid in production).</td></tr>
          <tr><td><code>-quiet</code></td><td><code>false</code></td><td>Shorthand for <code>--level=warn</code>.</td></tr>
          <tr><td><code>-json</code></td><td><code>false</code></td><td>Emit logs as JSON instead of console-pretty.</td></tr>
          <tr><td><code>-logfile &lt;path&gt;</code></td><td><code>stderr</code></td><td>Append log output to this file instead of stderr. No built-in rotation; use logrotate.</td></tr>
          <tr><td><code>-log-caller</code></td><td><code>false</code></td><td>Include <code>file:line</code> caller info on every log line.</td></tr>
        </tbody>
      </table>

      <h2 id="precedence">Precedence</h2>
      <p>Settings layer in this order, with later layers overriding earlier ones:</p>
      <ol>
        <li>Compiled-in defaults (e.g. <code>:8090</code>, <code>info</code>, 30 s timeouts).</li>
        <li>YAML or JSON config file.</li>
        <li>Environment interpolation inside the config (<code>${`{VAR}`}</code>, <code>${`{VAR:-default}`}</code>, <code>${`{VAR:?required}`}</code>) and <code>_file:</code> indirection.</li>
        <li>CLI flags — but only those typed on the command line. Flags you don't pass keep their file values.</li>
      </ol>

      <h2 id="examples">Examples</h2>
      <CodeBlock lang="bash" code={`# Defaults — listen on :8090, info-level console logs
fgp

# Bind elsewhere with debug logs
fgp -addr :9000 -debug

# Production-ish: load config, JSON logs to a file
fgp -config /etc/fgp/fgp.yaml -json -logfile /var/log/fgp/fgp.log

# Redirect mode, against a config
fgp -config /etc/fgp/fgp.yaml -redirect

# Postgres-backed control-plane store
fgp -db-driver postgres -db-dsn "postgres://fgp@db/fgp?sslmode=verify-full"

# Pre-deploy sanity: print the config the proxy will actually use
fgp -config /etc/fgp/fgp.yaml -print-config
fgp -config /etc/fgp/fgp.yaml -print-config -print-config-format json | jq '.diameter'`} />

      <h2 id="exit-codes">Exit codes</h2>
      <table>
        <thead><tr><th>Code</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td><code>0</code></td><td>Clean shutdown, or <code>-print-config</code> / <code>-version</code> success.</td></tr>
          <tr><td><code>1</code></td><td>Config load error, validation error after CLI overlay, or fatal server error.</td></tr>
        </tbody>
      </table>

      <h2 id="signals">Signals</h2>
      <ul>
        <li><strong>SIGINT</strong> / <strong>SIGTERM</strong> — graceful shutdown. The proxy stops accepting new requests, drains in-flight work up to <code>process.shutdown_timeout</code> (default 15s), then exits.</li>
        <li><strong>SIGHUP</strong> — not used. Configuration reloads come through the admin API or the store watcher; certificate reloads come through the cert reloader.</li>
      </ul>
    </DocPage>
  );
}
