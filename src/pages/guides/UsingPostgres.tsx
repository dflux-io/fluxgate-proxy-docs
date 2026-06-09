import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function UsingPostgres() {
  return (
    <DocPage
      slug="guides/using-postgres"
      lede="fluxgate-proxy keeps its runtime state in a single control-plane store, which defaults to SQLite. PostgreSQL is the right choice when that state must outlive the proxy host, or when several instances need to share it. This guide covers the DSN format, the required sslmode, and how to point the store at Postgres."
    >
      <h2 id="when-postgres">When to use PostgreSQL</h2>
      <p>
        The proxy has exactly one persistent store: the <strong>control-plane store</strong>. It
        holds policy rules, transformation rules, routing rules, producer configs, and NRF
        profiles — everything the admin API mutates and the request pipeline reads when it
        rebuilds. By default this store is SQLite, which is fine for a single instance.
      </p>
      <p>Switch the control-plane store to PostgreSQL when:</p>
      <ul>
        <li>the runtime state must survive a rebuild or replacement of the proxy host, or</li>
        <li>
          two or more proxy instances need to share the same rules — see{' '}
          <a href="#multi-instance">multi-instance deployments</a> below.
        </li>
      </ul>

      <h2 id="dsn">DSN format</h2>
      <CodeBlock lang="text" code={`postgres://USER:PASSWORD@HOST:PORT/DBNAME?KEY=VALUE&KEY=VALUE`} />
      <p>
        The DSN is a standard libpq connection URL. Beyond <code>sslmode</code> (which the proxy
        requires — see below), the usual libpq query parameters such as{' '}
        <code>connect_timeout</code>, <code>application_name</code>, and <code>search_path</code>{' '}
        are passed through unchanged.
      </p>

      <Callout type="warning" title="sslmode is required">
        v1 refuses to start if <code>sslmode</code> is missing from a Postgres DSN. Use{' '}
        <code>verify-full</code> in production. <code>sslmode=disable</code> is permitted but logs
        a warning — accept that you are then sending credentials and signaling metadata in clear
        over your DB network.
      </Callout>

      <h2 id="control-plane">Pointing the control-plane store at Postgres</h2>
      <p>Set the driver and DSN under <code>storage.control_plane_db</code>:</p>
      <CodeBlock lang="yaml" code={`storage:
  control_plane_db:
    driver: postgres          # sqlite | postgres
    dsn: \${FGP_CP_DSN:?control-plane DSN required}
    # e.g. postgres://fgp:…@cp-db:5432/fgp_cp?sslmode=verify-full`} />
      <p>
        The <code>{'${VAR:?msg}'}</code> form interpolates an environment variable and fails
        startup with <em>msg</em> if it is unset, which keeps the credential out of the config
        file. <code>{'${VAR:-default}'}</code> is also supported for non-required values.
      </p>
      <p>You can set the same two values from the CLI instead of the config file:</p>
      <CodeBlock lang="bash" code={`fgp -db-driver postgres \\
    -db-dsn "postgres://fgp:…@cp-db:5432/fgp_cp?sslmode=verify-full"`} />

      <h2 id="provisioning">Provisioning</h2>
      <p>The proxy creates its own tables and indexes on first connect. You need to provide:</p>
      <ul>
        <li>A database.</li>
        <li>
          A role with <code>CREATE</code>, <code>SELECT</code>, <code>INSERT</code>,{' '}
          <code>UPDATE</code>, and <code>DELETE</code> on that database.
        </li>
        <li>
          TLS material on both sides for <code>verify-full</code> — the server cert, plus the CA
          bundle in the proxy host's trust store.
        </li>
      </ul>

      <p>Lab-grade Postgres for testing:</p>
      <CodeBlock lang="bash" code={`docker run -d --name fgp-pg -p 5432:5432 \\
  -e POSTGRES_DB=fgp -e POSTGRES_USER=fgp -e POSTGRES_PASSWORD=fgp \\
  postgres:17`} />
      <CodeBlock lang="yaml" code={`storage:
  control_plane_db:
    driver: postgres
    dsn: "postgres://fgp:fgp@localhost:5432/fgp?sslmode=disable"`} />

      <h2 id="connection-pooling">Connection pooling</h2>
      <p>
        The proxy opens a small connection pool to Postgres; it does not need many, because
        control-plane mutations are infrequent and the request pipeline reads from an in-memory
        snapshot rather than hitting the DB per request. For production, sit Postgres behind
        PgBouncer or your cloud provider's pooler to bound the maximum connection count.
      </p>

      <h2 id="multi-instance">Multi-instance deployments</h2>
      <p>
        When two or more proxy instances share a Postgres control-plane store, each one picks up
        the other's mutations by polling the store on an interval
        (<code>process.store_watch_interval</code>, default 5s). A policy change applied to one
        instance reaches the others within the poll window.
      </p>
      <p>
        NRF profile registration stays per-instance — each instance advertises its own listen
        address — but the profile <em>definitions</em> are shared through the control-plane store.
      </p>

      <h2 id="db-query-log">Debugging slow queries</h2>
      <p>Turn on per-query logging when you suspect the DB is the bottleneck:</p>
      <CodeBlock lang="yaml" code={`observability:
  logging:
    db_query_log: true        # logs every query at debug; warn for slow > 200ms`} />
      <p>
        Or set the matching flag at startup: <code>fgp -db-query-log …</code>. Combine it with{' '}
        <code>fgpctl log-level set debug</code> for runtime control of the log level.
      </p>

      <h2 id="backup">Backups</h2>
      <p>
        The control-plane store is small — rules, routes, producer configs, and NRF profiles. Back
        it up at the DB level alongside the rest of your Postgres; restoring is fast.
      </p>

      <h2 id="next">Where to go next</h2>
      <ul>
        <li>
          <Link to="/guides/deploying">Deploying fluxgate-proxy</Link> — file layout and the
          systemd unit.
        </li>
        <li>
          <Link to="/reference/config-schema">Config schema</Link> — the full{' '}
          <code>storage</code> block and every other config key.
        </li>
      </ul>
    </DocPage>
  );
}
