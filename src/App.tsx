import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import NotFound from './pages/NotFound';

// Every page is lazily loaded so the initial bundle stays small —
// each page becomes its own chunk, fetched on first navigation.
const Index = lazy(() => import('./pages/Index'));
const Glossary = lazy(() => import('./pages/Glossary'));

const Introduction = lazy(() => import('./pages/introduction/Introduction'));
const Why = lazy(() => import('./pages/introduction/Why'));
const Quickstart = lazy(() => import('./pages/introduction/Quickstart'));

const Architecture = lazy(() => import('./pages/concepts/Architecture'));
const RequestPipeline = lazy(() => import('./pages/concepts/RequestPipeline'));
const PolicyEngine = lazy(() => import('./pages/concepts/PolicyEngine'));
const TransformationEngine = lazy(() => import('./pages/concepts/TransformationEngine'));
const RoutingEngine = lazy(() => import('./pages/concepts/RoutingEngine'));
const NrfAndProducers = lazy(() => import('./pages/concepts/NrfAndProducers'));
const DiameterPeering = lazy(() => import('./pages/concepts/DiameterPeering'));

const FirstSbiPolicy = lazy(() => import('./pages/tutorials/FirstSbiPolicy'));
const FirstTransformationRule = lazy(() => import('./pages/tutorials/FirstTransformationRule'));
const DiameterS6aRelay = lazy(() => import('./pages/tutorials/DiameterS6aRelay'));

const Deploying = lazy(() => import('./pages/guides/Deploying'));
const SecuringAdminApi = lazy(() => import('./pages/guides/SecuringAdminApi'));
const PolicyVersioning = lazy(() => import('./pages/guides/PolicyVersioning'));
const RateLimiting = lazy(() => import('./pages/guides/RateLimiting'));
const AuditAndCompliance = lazy(() => import('./pages/guides/AuditAndCompliance'));
const Observability = lazy(() => import('./pages/guides/Observability'));
const UsingPostgres = lazy(() => import('./pages/guides/UsingPostgres'));
const HotReload = lazy(() => import('./pages/guides/HotReload'));

const FgpCli = lazy(() => import('./pages/reference/FgpCli'));
const Fgpctl = lazy(() => import('./pages/reference/Fgpctl'));
const ConfigSchema = lazy(() => import('./pages/reference/ConfigSchema'));
const PolicySchema = lazy(() => import('./pages/reference/PolicySchema'));
const TransformationSchema = lazy(() => import('./pages/reference/TransformationSchema'));
const RoutingSchema = lazy(() => import('./pages/reference/RoutingSchema'));
const Metrics = lazy(() => import('./pages/reference/Metrics'));

const ApiOverview = lazy(() => import('./pages/api/Overview'));
const ApiStatusAndConfig = lazy(() => import('./pages/api/StatusAndConfig'));
const ApiPolicy = lazy(() => import('./pages/api/Policy'));
const ApiRateLimits = lazy(() => import('./pages/api/RateLimits'));
const ApiTransformations = lazy(() => import('./pages/api/Transformations'));
const ApiRouting = lazy(() => import('./pages/api/Routing'));
const ApiProducersAndProfiles = lazy(() => import('./pages/api/ProducersAndProfiles'));
const ApiObservability = lazy(() => import('./pages/api/Observability'));

// Loading sentinel — keep it boring; the layout chrome is already on
// screen, so a tiny pulsing placeholder reads better than a spinner.
function PageFallback() {
  return (
    <main className="flex-1 px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="h-8 w-2/3 animate-pulse rounded-md bg-surface-muted" />
        <div className="mt-4 h-4 w-full animate-pulse rounded-md bg-surface-muted" />
        <div className="mt-2 h-4 w-5/6 animate-pulse rounded-md bg-surface-muted" />
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/glossary" element={<Glossary />} />

          <Route path="/introduction" element={<Introduction />} />
          <Route path="/introduction/why" element={<Why />} />
          <Route path="/introduction/quickstart" element={<Quickstart />} />

          <Route path="/concepts/architecture" element={<Architecture />} />
          <Route path="/concepts/request-pipeline" element={<RequestPipeline />} />
          <Route path="/concepts/policy-engine" element={<PolicyEngine />} />
          <Route path="/concepts/transformation-engine" element={<TransformationEngine />} />
          <Route path="/concepts/routing-engine" element={<RoutingEngine />} />
          <Route path="/concepts/nrf-and-producers" element={<NrfAndProducers />} />
          <Route path="/concepts/diameter-peering" element={<DiameterPeering />} />

          <Route path="/tutorials/first-sbi-policy" element={<FirstSbiPolicy />} />
          <Route path="/tutorials/first-transformation-rule" element={<FirstTransformationRule />} />
          <Route path="/tutorials/diameter-s6a-relay" element={<DiameterS6aRelay />} />

          <Route path="/guides/deploying" element={<Deploying />} />
          <Route path="/guides/securing-the-admin-api" element={<SecuringAdminApi />} />
          <Route path="/guides/policy-versioning" element={<PolicyVersioning />} />
          <Route path="/guides/rate-limiting" element={<RateLimiting />} />
          <Route path="/guides/audit-and-compliance" element={<AuditAndCompliance />} />
          <Route path="/guides/observability" element={<Observability />} />
          <Route path="/guides/using-postgres" element={<UsingPostgres />} />
          <Route path="/guides/hot-reload-and-runtime-ops" element={<HotReload />} />

          <Route path="/reference/fgp-cli" element={<FgpCli />} />
          <Route path="/reference/fgpctl" element={<Fgpctl />} />
          <Route path="/reference/config-schema" element={<ConfigSchema />} />
          <Route path="/reference/policy-schema" element={<PolicySchema />} />
          <Route path="/reference/transformation-schema" element={<TransformationSchema />} />
          <Route path="/reference/routing-schema" element={<RoutingSchema />} />
          <Route path="/reference/metrics" element={<Metrics />} />

          <Route path="/api/overview" element={<ApiOverview />} />
          <Route path="/api/status-and-config" element={<ApiStatusAndConfig />} />
          <Route path="/api/policy" element={<ApiPolicy />} />
          <Route path="/api/rate-limits" element={<ApiRateLimits />} />
          <Route path="/api/transformations" element={<ApiTransformations />} />
          <Route path="/api/routing" element={<ApiRouting />} />
          <Route path="/api/producers-and-profiles" element={<ApiProducersAndProfiles />} />
          <Route path="/api/observability" element={<ApiObservability />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
