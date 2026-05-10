import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function Deploying() {
  return (
    <DocPage
      slug="guides/deploying"
      lede="FGP ships as a single statically linked Go binary plus an admin CLI. This guide covers the file layout, a systemd unit, a container image, and how to wire persistence so config and audit survive restarts."
    >
      <h2 id="binaries">The binaries</h2>
      <ul>
        <li><code>fgp</code> — the daemon. Reads a config file and serves SBI / Diameter / admin.</li>
        <li><code>fgpctl</code> — the admin client. Talks to the daemon's admin API over HTTP.</li>
      </ul>
      <p>Build with the Makefile:</p>
      <CodeBlock lang="bash" code={`make build
# produces ./bin/fgp and ./bin/fgpctl`} />

      <p>Or directly:</p>
      <CodeBlock lang="bash" code={`go build -o bin/fgp ./cmd/fgp
go build -o bin/fgpctl ./cmd/fgpctl`} />

      <h2 id="file-layout">Recommended file layout</h2>
      <CodeBlock lang="text" code={`/usr/local/bin/fgp
/usr/local/bin/fgpctl
/etc/fgp/
  fgp.yaml
  policy/
    *.json              # rule files committed to git
  certs/
    server.crt
    server.key
    admin.crt
    admin.key
    ca.crt
/var/lib/fgp/
  control-plane.db      # SQLite control-plane store
  audit.db              # SQLite audit store
/var/log/fgp/
  fgp.log               # rotated by logrotate`} />

      <h2 id="systemd">A systemd unit</h2>
      <CodeBlock lang="ini" code={`# /etc/systemd/system/fgp.service
[Unit]
Description=fluxgate-proxy
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=fgp
Group=fgp
ExecStart=/usr/local/bin/fgp -config /etc/fgp/fgp.yaml -json -logfile /var/log/fgp/fgp.log
Restart=on-failure
RestartSec=2s
LimitNOFILE=1048576

# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/fgp /var/log/fgp
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target`} />

      <Callout type="note" title="Why CAP_NET_BIND_SERVICE">
        Required if you bind below 1024 (e.g. <code>:443</code> for SBI or <code>:3868</code>{' '}
        for Diameter). Drop it if you bind to higher ports.
      </Callout>

      <p>Then:</p>
      <CodeBlock lang="bash" code={`sudo useradd --system --no-create-home --shell /usr/sbin/nologin fgp
sudo install -d -o fgp -g fgp /var/lib/fgp /var/log/fgp
sudo install -d -m 0750 -o fgp -g fgp /etc/fgp /etc/fgp/policy /etc/fgp/certs

sudo systemctl daemon-reload
sudo systemctl enable --now fgp
sudo systemctl status fgp
sudo journalctl -u fgp -f`} />

      <h2 id="container">Container image</h2>
      <p>A two-stage Dockerfile keeps the final image small:</p>
      <CodeBlock lang="dockerfile" code={`# syntax=docker/dockerfile:1.7

FROM golang:1.25-bookworm AS builder
WORKDIR /src
COPY . .
RUN make build

FROM gcr.io/distroless/base-debian12:nonroot
COPY --from=builder /src/bin/fgp /usr/local/bin/fgp
COPY --from=builder /src/bin/fgpctl /usr/local/bin/fgpctl
USER nonroot:nonroot
EXPOSE 8090 8091 3868
ENTRYPOINT ["/usr/local/bin/fgp"]
CMD ["-config", "/etc/fgp/fgp.yaml", "-json"]`} />

      <p>Run:</p>
      <CodeBlock lang="bash" code={`docker run --rm \\
  -v /etc/fgp:/etc/fgp:ro \\
  -v /var/lib/fgp:/var/lib/fgp \\
  -p 8090:8090 -p 8091:8091 -p 3868:3868 \\
  fgp:latest`} />

      <h2 id="persistence">Persistence</h2>
      <p>FGP has two stores; both default to ephemeral in the minimal config.</p>

      <h3 id="control-plane-store">Control-plane store</h3>
      <p>
        Holds policy rules, rate limits, transformations, routing rules, tenants, producer
        configs, NRF profiles. Without persistence, rules vanish on restart.
      </p>
      <CodeBlock lang="yaml" code={`storage:
  control_plane_db:
    driver: sqlite
    dsn: file:/var/lib/fgp/control-plane.db?cache=shared&_journal_mode=WAL`} />

      <h3 id="audit-store">Audit store</h3>
      <p>
        Holds the per-request audit trail. Without persistence, audit history disappears on
        restart. SQLite is fine for a single host; PostgreSQL is required if multiple FGPs
        share state.
      </p>
      <CodeBlock lang="yaml" code={`storage:
  audit:
    driver: sqlite
    dsn: file:/var/lib/fgp/audit.db?cache=shared&_journal_mode=WAL`} />

      <p>
        Postgres is identical except for the driver and DSN. See{' '}
        <Link to="/guides/using-postgres">Using PostgreSQL</Link>.
      </p>

      <h2 id="secrets">Secrets</h2>
      <p>
        Any field that holds a secret has a sibling <code>_file:</code> variant that reads the
        value from a file. Use the file variant in production so secrets don't appear in your
        config repo or in the daemon's process listing.
      </p>
      <CodeBlock lang="yaml" code={`admin:
  auth:
    api_key_file: /run/secrets/admin-api-key
    jwt_secret_file: /run/secrets/jwt-hmac`} />

      <p>Or interpolate from env with default-or-fail syntax:</p>
      <CodeBlock lang="yaml" code={`admin:
  auth:
    api_key: \${ADMIN_API_KEY:?required}`} />

      <h2 id="env-overlay">Env / CLI overlay</h2>
      <p>
        The CLI overlay layer accepts a handful of flags that override the loaded config —
        useful for one-off invocations (debugging, print-config). Precedence is:
      </p>
      <pre><code>defaults &lt; YAML/JSON config file &lt; env interpolation &lt; CLI flags</code></pre>
      <p>
        The flags that overlay are documented in <Link to="/reference/fgp-cli">fgp CLI</Link>.
      </p>

      <h2 id="print-config">Print the resolved config</h2>
      <p>
        Before pushing a new config, dump what FGP will actually use after env interpolation,
        <code>_file:</code> dereferencing, and overlay:
      </p>
      <CodeBlock lang="bash" code={`./bin/fgp -config /etc/fgp/fgp.yaml -print-config -print-config-format yaml`} />

      <p>Secrets are redacted in the output. Run it in CI as a pre-deploy gate.</p>

      <h2 id="health">Health checks</h2>
      <ul>
        <li>
          <strong>Liveness:</strong> a TCP probe on the SBI listen address is enough — FGP
          listens before serving requests.
        </li>
        <li>
          <strong>Readiness:</strong> hit <code>GET /admin/health/deep</code> for a
          producer-pool reachability check. Returns 200 only when at least one producer per
          configured NF type is reachable.
        </li>
      </ul>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/guides/securing-the-admin-api">Securing the admin API</Link>.</li>
        <li><Link to="/guides/using-postgres">Using PostgreSQL</Link>.</li>
        <li><Link to="/guides/observability">Observability</Link> — Prometheus scrape, dashboards, tracing.</li>
        <li><Link to="/reference/fgp-cli">fgp CLI reference</Link>.</li>
      </ul>
    </DocPage>
  );
}
