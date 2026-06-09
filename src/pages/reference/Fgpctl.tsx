import DocPage from '../../components/DocPage';
import CliReference from '../../components/CliReference';
import { Link } from 'react-router-dom';

export default function Fgpctl() {
  return (
    <DocPage
      slug="reference/fgpctl"
      lede="fgpctl is a thin client over the admin API — every command maps to one or more admin HTTP endpoints. JSON payloads can be passed inline or read from a file with the @file syntax. This reference is generated from fgpctl --help."
    >
      <p>
        Point it at the admin listener with <code>{`-url`}</code> (default{' '}
        <code>{`http://127.0.0.1:9091`}</code>) and authenticate with <code>{`-key`}</code> or the{' '}
        <code>{`FGP_ADMIN_KEY`}</code> environment variable. See the{' '}
        <Link to="/api/overview">Admin API overview</Link> for the endpoints behind each command.
      </p>
      <CliReference cliKey="fgpctl" />
    </DocPage>
  );
}
