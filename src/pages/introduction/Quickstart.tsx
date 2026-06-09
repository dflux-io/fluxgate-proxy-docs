import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function Quickstart() {
  return (
    <DocPage
      slug="introduction/quickstart"
      lede="Build fluxgate-proxy from source, run it against the minimal config, and exercise the admin API. About 10 minutes from a clean checkout."
    >
      <h2 id="prerequisites">Prerequisites</h2>
      <ul>
        <li>Go 1.26.1 or later.</li>
        <li>A clone of the <code>fluxgate-proxy</code> repository.</li>
        <li>That's it — SQLite is embedded; no external dependencies for the minimal run.</li>
      </ul>

      <h2 id="build">Build</h2>
      <p>From the repo root:</p>
      <CodeBlock lang="bash" code={`make build
# produces ./bin/fgp and ./bin/fgpctl`} />

      <p>Or build the binaries directly:</p>
      <CodeBlock lang="bash" code={`go build -o bin/fgp ./cmd/fgp
go build -o bin/fgpctl ./cmd/fgpctl`} />

      <h2 id="run">Run with the minimal config</h2>
      <p>
        The repo ships a one-page config at <code>examples/fgp-minimal.yaml</code>. Everything
        outside it falls back to safe defaults: <code>admin.default_action: deny</code>,
        an in-memory shared-cache SQLite control-plane store, 30 s read timeout, and a 1 MiB
        request body cap.
      </p>
      <CodeBlock lang="bash" code={`./bin/fgp -config examples/fgp-minimal.yaml`} />

      <p>You should see startup logs that look something like this:</p>
      <CodeBlock lang="text" code={`INF FGP starting version=dev
INF SBI listener listening addr=:8090
INF admin listener listening addr=:9091`} />

      <Callout type="note" title="Where is the admin listener?">
        The minimal example binds the SBI listener on <code>:8090</code> and the admin API on
        <code>:9091</code>. The admin listener accepts cleartext h2c when{' '}
        <code>admin.allow_insecure: true</code> — fine for local dev, but you'll want TLS and
        API keys before exposing the admin port anywhere else. See{' '}
        <Link to="/guides/securing-the-admin-api">Securing the admin API</Link>.
      </Callout>

      <h2 id="check-status">Check status with fgpctl</h2>
      <p>From another shell, point <code>fgpctl</code> at the admin listener:</p>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:9091 status`} />

      <p>You'll get JSON like:</p>
      <CodeBlock lang="json" code={`{
  "status": "running",
  "version": "dev",
  "producers": false,
  "producer_counts": {}
}`} />

      <h2 id="exercise-policy">Exercise the policy gate</h2>
      <p>
        By default the policy gate denies unknown traffic. List the seeded rules:
      </p>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:9091 policy-rules`} />

      <p>
        Add a permissive rule so a test SBI call reaches the producer pool (this is a smoke
        rule — refine it before production). Save it to <code>allow-smoke.json</code>:
      </p>
      <CodeBlock lang="json" code={`{
  "name": "allow-smoke",
  "action": "allow",
  "path_patterns": ["/nudm-uecm/v1/*/registrations"]
}`} />

      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:9091 policy-rules add @allow-smoke.json`} />

      <h2 id="send-a-request">Send a request</h2>
      <p>
        Send a request through the SBI listener — even one that 404s because no producer is
        registered — and the proxy emits the decision as a structured JSON log line on its
        own stdout:
      </p>
      <CodeBlock lang="bash" code={`curl -i http://127.0.0.1:8090/nudm-uecm/v1/imsi-001010000000001/registrations`} />

      <p>
        Decisions are emitted only as structured JSON logs (request ID, the allow/deny outcome,
        status code, and duration), ready to ship to your log pipeline or SIEM. For aggregate
        signal, scrape the metrics endpoint below.
      </p>

      <h2 id="prometheus">Scrape Prometheus</h2>
      <p>The proxy exposes Prometheus metrics on the SBI listener:</p>
      <CodeBlock lang="bash" code={`curl -s http://127.0.0.1:8090/metrics | head -20`} />

      <p>
        See <Link to="/reference/metrics">Metrics</Link> for the full list of exported series.
      </p>

      <h2 id="next-steps">Next steps</h2>
      <ul>
        <li>
          Walk through the <Link to="/concepts/architecture">architecture</Link> and{' '}
          <Link to="/concepts/request-pipeline">request pipeline</Link> to understand what the
          proxy is doing on every request.
        </li>
        <li>
          Follow the <Link to="/tutorials/first-sbi-policy">first SBI policy</Link> tutorial to
          write and ship a real rule.
        </li>
        <li>
          Read <Link to="/guides/deploying">Deploying fluxgate-proxy</Link> for systemd,
          container, and persistence options.
        </li>
        <li>
          Read <Link to="/guides/securing-the-admin-api">Securing the admin API</Link> before
          exposing the proxy outside loopback.
        </li>
      </ul>
    </DocPage>
  );
}
