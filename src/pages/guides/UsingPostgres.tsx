import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function UsingPostgres() {
  return (
    <DocPage
      slug="guides/using-postgres"
      lede="FGP defaults to SQLite for both the control-plane store and the audit store. PostgreSQL is the right choice when audit needs to outlive the FGP host, or when multiple FGP instances need to share state. This guide covers DSN format, sslmode, and the per-store configuration."
    >
      <h2 id="two-stores">Two stores, two DSNs</h2>
      <p>FGP has two independent stores:</p>
      <ul>
        <li>
          <strong>Control-plane store</strong> — rules, transforms, routes, tenants, producer
          configs, NRF profiles. Read on every request-pipeline rebuild; written by admin API
          mutations.
        </li>
        <li>
          <strong>Audit store</strong> — one record per request decision. Write-heavy. Read for
          audit queries, compliance reports, and the admin audit log.
        </li>
      </ul>
      <p>
        Both can use SQLite or PostgreSQL, and they can use different drivers / DSNs / DBs.
        The most common production layout: both on Postgres, separate logical databases or
        schemas so retention and replication policies can differ.
      </p>

      <h2 id="control-plane">Control-plane store on Postgres</h2>
      <CodeBlock lang="yaml" code={`storage:
  control_plane_db:
    driver: postgres
    dsn: \${FGP_CP_DSN:?required}    # e.g. postgres://fgp:…@cp-db/fgp_cp?sslmode=verify-full`} />

      <h2 id="audit">Audit store on Postgres</h2>
      <CodeBlock lang="yaml" code={`storage:
  audit:
    driver: postgres
    dsn: \${FGP_AUDIT_DSN:?required}`} />

      <p>
        For secrets-handling hygiene, use the <code>dsn_file:</code> sibling instead of an env
        reference:
      </p>
      <CodeBlock lang="yaml" code={`storage:
  audit:
    driver: postgres
    dsn_file: /run/secrets/fgp-audit-dsn`} />

      <h2 id="dsn">DSN format</h2>
      <CodeBlock lang="text" code={`postgres://USER:PASSWORD@HOST:PORT/DBNAME?KEY=VALUE&KEY=VALUE`} />

      <p>Common parameters:</p>
      <ul>
        <li><code>sslmode</code> — required in v1. <code>verify-full</code> in production; <code>disable</code> is accepted but warns.</li>
        <li><code>connect_timeout</code> — seconds; sensible default is 5.</li>
        <li><code>application_name</code> — set to <code>fgp</code> so Postgres dashboards label the connection.</li>
        <li><code>search_path</code> — schema for multi-tenant Postgres deployments.</li>
      </ul>

      <Callout type="warning" title="sslmode is required">
        v1 refuses to start if <code>sslmode</code> is missing. Use <code>verify-full</code>{' '}
        in production. <code>disable</code> runs (with a warning) — accept that you're
        sending creds and PII in clear over your DB network.
      </Callout>

      <h2 id="provisioning">Provisioning</h2>
      <p>FGP creates its own tables and indexes on first connect. You need to provide:</p>
      <ul>
        <li>A database (one per store, or one shared with different schemas).</li>
        <li>A role with <code>CREATE</code>, <code>SELECT</code>, <code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code> on its own database.</li>
        <li>TLS material on both sides for <code>verify-full</code> — server cert, plus the CA bundle on the FGP host's trust store.</li>
      </ul>

      <p>Lab-grade Postgres for testing:</p>
      <CodeBlock lang="bash" code={`docker run -d --name fgp-pg -p 5432:5432 \\
  -e POSTGRES_DB=fgp -e POSTGRES_USER=fgp -e POSTGRES_PASSWORD=fgp \\
  postgres:17`} />

      <CodeBlock lang="yaml" code={`storage:
  audit:
    driver: postgres
    dsn: "postgres://fgp:fgp@localhost:5432/fgp?sslmode=disable"`} />

      <h2 id="connection-pooling">Connection pooling</h2>
      <p>
        FGP relies on the Bun driver's default connection pool. For production, sit Postgres
        behind PgBouncer or your cloud provider's pool to bound max connections; FGP doesn't
        need many — control-plane mutations are rare and audit writes are batched.
      </p>

      <h2 id="multi-instance">Multi-instance deployments</h2>
      <p>
        When two or more FGP instances share a Postgres control-plane store, both pick up
        mutations through their store-watcher polling (<code>process.store_watch_interval</code>,
        default 5s). A policy change applied to one instance reaches the other within the
        poll window.
      </p>
      <ul>
        <li>
          <strong>NRF profile registration</strong> is per-instance (each FGP advertises its own
          listen address), but the profile <em>definitions</em> can be shared via the
          control-plane store.
        </li>
        <li>
          <strong>Rate-limit buckets</strong> are in-process, so two FGPs each enforce their
          own bucket. For shared limits across instances, scope by traffic key + use a sticky
          load balancer in front, or accept the per-instance approximation.
        </li>
        <li>
          <strong>Sticky sessions</strong> use consistent hashing per FGP; reshuffling on
          instance add/remove is local to each FGP.
        </li>
      </ul>

      <h2 id="db-query-log">Debugging slow queries</h2>
      <p>Turn on per-query logging when you suspect the DB is the bottleneck:</p>
      <CodeBlock lang="yaml" code={`observability:
  logging:
    db_query_log: true        # logs every query at debug; warn for slow > 200ms`} />

      <p>
        Or set the matching CLI flag at runtime: <code>fgp -db-query-log …</code>. Combine
        with <code>fgpctl log-level set debug</code> for runtime control.
      </p>

      <h2 id="backup">Backups and retention</h2>
      <ul>
        <li>
          The <strong>control-plane store</strong> is small (rules + transforms + routes). Back
          up at the DB level with the rest of your Postgres; restoring is fast.
        </li>
        <li>
          The <strong>audit store</strong> can grow large. Set{' '}
          <code>audit.retention.max_age</code> (or <code>max_records</code>) to bound DB size,
          and export to a long-term archive sink — see{' '}
          <Link to="/guides/audit-and-compliance">Audit and compliance</Link>.
        </li>
      </ul>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/guides/deploying">Deploying FGP</Link> — file layout and systemd unit.</li>
        <li><Link to="/guides/audit-and-compliance">Audit and compliance</Link> — retention and exports.</li>
        <li><Link to="/reference/config-schema">Config schema</Link> — full <code>storage</code> block.</li>
      </ul>
    </DocPage>
  );
}
