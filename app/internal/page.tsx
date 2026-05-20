import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Internal · BenchworksAI',
  description: 'Internal testing hub. Not for distribution.',
  robots: { index: false, follow: false },
};

type LinkRow = { href: string; label: string; note?: string; auth?: string };

const GROUPS: { heading: string; rows: LinkRow[] }[] = [
  {
    heading: 'Marketing site (benchworksai.com)',
    rows: [
      { href: 'https://benchworksai.com/', label: 'Home' },
      { href: 'https://benchworksai.com/about', label: 'About' },
      { href: 'https://benchworksai.com/services', label: 'Services index' },
      { href: 'https://benchworksai.com/services/ai-implementation', label: 'Service: AI Implementation' },
      { href: 'https://benchworksai.com/services/ai-automation', label: 'Service: AI Automation' },
      { href: 'https://benchworksai.com/services/ai-solutions-architect', label: 'Service: AI Solutions Architect' },
      { href: 'https://benchworksai.com/services/prompt-engineering', label: 'Service: Prompt Engineering' },
      { href: 'https://benchworksai.com/services/fractional-cto', label: 'Service: Fractional CTO' },
      { href: 'https://benchworksai.com/portfolio', label: 'Portfolio' },
      { href: 'https://benchworksai.com/pricing', label: 'Pricing' },
      { href: 'https://benchworksai.com/contact', label: 'Contact (Cal.com embed)' },
      { href: 'https://benchworksai.com/privacy', label: 'Privacy' },
      { href: 'https://benchworksai.com/explore', label: 'Explore (client tour)' },
    ],
  },
  {
    heading: 'Demos',
    rows: [
      { href: 'https://benchworksai.com/demos', label: 'Demo showroom (vertical picker)' },
      { href: 'https://benchworksai.com/demos/gate', label: 'Demo gate (email capture)' },
      { href: 'https://benchworksai.com/demos/chatbot/general_smb', label: 'Chatbot · General SMB' },
      { href: 'https://benchworksai.com/demos/chatbot/construction', label: 'Chatbot · Construction' },
      { href: 'https://benchworksai.com/demos/chatbot/property_mgmt', label: 'Chatbot · Property Mgmt' },
      { href: 'https://benchworksai.com/demos/chatbot/legal', label: 'Chatbot · Legal' },
      { href: 'https://benchworksai.com/demos/analytics/general_smb', label: 'Analytics · General SMB' },
      { href: 'https://benchworksai.com/demos/analytics/construction', label: 'Analytics · Construction' },
      { href: 'https://benchworksai.com/demos/analytics/property_mgmt', label: 'Analytics · Property Mgmt' },
      { href: 'https://benchworksai.com/demos/analytics/legal', label: 'Analytics · Legal' },
      { href: 'https://benchworksai.com/demos/email_sms/general_smb', label: 'Email & SMS · General SMB' },
      { href: 'https://benchworksai.com/demos/email_sms/construction', label: 'Email & SMS · Construction' },
      { href: 'https://benchworksai.com/demos/email_sms/property_mgmt', label: 'Email & SMS · Property Mgmt' },
      { href: 'https://benchworksai.com/demos/email_sms/legal', label: 'Email & SMS · Legal' },
      { href: 'https://benchworksai.com/demos/doc_processing/general_smb', label: 'Doc Processing · General SMB' },
      { href: 'https://benchworksai.com/demos/doc_processing/construction', label: 'Doc Processing · Construction' },
      { href: 'https://benchworksai.com/demos/doc_processing/property_mgmt', label: 'Doc Processing · Property Mgmt' },
      { href: 'https://benchworksai.com/demos/doc_processing/legal', label: 'Doc Processing · Legal' },
      { href: 'https://benchworksai.com/demos/competitive_analysis/general_smb', label: 'Competitive Analysis · General SMB' },
      { href: 'https://benchworksai.com/demos/competitive_analysis/construction', label: 'Competitive Analysis · Construction' },
      { href: 'https://benchworksai.com/demos/competitive_analysis/property_mgmt', label: 'Competitive Analysis · Property Mgmt' },
      { href: 'https://benchworksai.com/demos/competitive_analysis/legal', label: 'Competitive Analysis · Legal' },
      { href: 'https://benchworksai.com/demos/doc_drafting/general_smb', label: 'Doc Drafting · General SMB' },
      { href: 'https://benchworksai.com/demos/doc_drafting/construction', label: 'Doc Drafting · Construction' },
      { href: 'https://benchworksai.com/demos/doc_drafting/property_mgmt', label: 'Doc Drafting · Property Mgmt' },
      { href: 'https://benchworksai.com/demos/doc_drafting/legal', label: 'Doc Drafting · Legal' },
      { href: 'https://benchworksai.com/demos/marketing_engine/general_smb', label: 'Marketing Engine · General SMB' },
      { href: 'https://benchworksai.com/demos/marketing_engine/construction', label: 'Marketing Engine · Construction' },
      { href: 'https://benchworksai.com/demos/marketing_engine/property_mgmt', label: 'Marketing Engine · Property Mgmt' },
      { href: 'https://benchworksai.com/demos/marketing_engine/legal', label: 'Marketing Engine · Legal' },
    ],
  },
  {
    heading: 'Larkin admin (nurture engine)',
    rows: [
      { href: 'https://benchworksai.com/admin', label: 'Admin home', auth: 'ADMIN_SECRET (sessionStorage Bearer)' },
      { href: 'https://benchworksai.com/admin/leads', label: 'Leads list' },
      { href: 'https://benchworksai.com/admin/messages', label: 'Drip message review queue' },
      { href: 'https://benchworksai.com/admin/config', label: 'Config editor' },
      { href: 'https://benchworksai.com/admin/audit', label: 'Demo audit (one-click 7-module E2E test)' },
    ],
  },
  {
    heading: 'BenchworksAI ops dashboard (app.benchworksai.com)',
    rows: [
      { href: 'https://app.benchworksai.com/', label: 'Overview', auth: 'admin@benchworksai.com / benchworks2026' },
      { href: 'https://app.benchworksai.com/clients', label: 'Clients list' },
      { href: 'https://app.benchworksai.com/clients/new', label: 'New client wizard' },
      { href: 'https://app.benchworksai.com/leads', label: 'Leads (via client drill-down)', note: 'No top-level leads page; navigate via Clients' },
      { href: 'https://app.benchworksai.com/mailboxes', label: 'Mailbox pool' },
      { href: 'https://app.benchworksai.com/reports', label: 'Client reports' },
      { href: 'https://app.benchworksai.com/review', label: 'Reply review queue' },
      { href: 'https://app.benchworksai.com/suppression', label: 'Suppression list' },
      { href: 'https://app.benchworksai.com/action-log', label: 'Action log' },
      { href: 'https://app.benchworksai.com/settings', label: 'Settings' },
    ],
  },
  {
    heading: 'Orchestration & infra',
    rows: [
      { href: 'https://n8n.benchworksai.com/', label: 'n8n editor', auth: 'admin / benchworks-n8n-2026' },
      { href: 'https://supabase.com/dashboard/project/zycblgaakmzzuxyisjoh', label: 'Supabase · BenchworksAI Outbound' },
      { href: 'https://supabase.com/dashboard/project/dckvgtbrurclhfcduitz', label: 'Supabase · Larkin/Marketing' },
      { href: 'https://app.cal.com/event-types', label: 'Cal.com event types' },
      { href: 'https://app.cal.com/settings/developer/webhooks', label: 'Cal.com webhooks' },
      { href: 'https://github.com/afintech510/benchworksai-outbound', label: 'GitHub · benchworksai-outbound' },
      { href: 'https://github.com/afintech510/larkin-tech', label: 'GitHub · larkin-tech' },
    ],
  },
  {
    heading: 'Raw API endpoints (curl-friendly)',
    rows: [
      { href: 'https://app.benchworksai.com/v1/health', label: 'GET fastapi /v1/health' },
      { href: 'https://benchworksai.com/api/health', label: 'GET larkin /api/health' },
      { href: 'https://app.benchworksai.com/v1/inbound/handoff', label: 'POST inbound handoff', note: 'X-Service-Key (LARKIN_SERVICE_KEY)' },
      { href: 'https://app.benchworksai.com/v1/internal/health-check', label: 'POST internal health check', note: 'X-Service-Key (SERVICE_KEY_N8N)' },
      { href: 'https://app.benchworksai.com/v1/internal/deliverability-check', label: 'POST deliverability check', note: 'X-Service-Key (SERVICE_KEY_N8N)' },
      { href: 'https://app.benchworksai.com/v1/webhooks/smartlead/reply', label: 'POST Smartlead reply webhook (HMAC-signed)' },
      { href: 'https://app.benchworksai.com/v1/webhooks/calcom/booking', label: 'POST Cal.com booking webhook (HMAC-signed) — currently unused' },
      { href: 'https://benchworksai.com/api/webhooks/booking-confirmed', label: 'POST Cal.com booking webhook (live target)' },
    ],
  },
];

export default function InternalHubPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10 sm:px-8 font-mono text-sm">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 border-b border-zinc-800 pb-6">
          <h1 className="text-2xl font-bold tracking-tight">benchworks · internal hub</h1>
          <p className="mt-2 text-zinc-400">
            All routes, ops UIs, raw endpoints, and infra dashboards. Do not share this URL.
          </p>
          <p className="mt-1 text-zinc-500 text-xs">
            Public-facing version: <a href="/explore" className="underline hover:text-zinc-200">/explore</a>
          </p>
        </header>

        <div className="space-y-10">
          {GROUPS.map((g) => (
            <section key={g.heading}>
              <h2 className="text-zinc-300 text-base font-semibold uppercase tracking-wider">{g.heading}</h2>
              <ul className="mt-3 divide-y divide-zinc-900">
                {g.rows.map((r) => (
                  <li key={r.href} className="py-2 flex items-baseline gap-3 flex-wrap">
                    <a href={r.href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline break-all">
                      {r.label}
                    </a>
                    {r.auth && <span className="text-xs text-amber-400/80">[{r.auth}]</span>}
                    {r.note && <span className="text-xs text-zinc-500">— {r.note}</span>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="mt-12 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
          <p>VPS: <code>ssh hampton-vps</code> · Compose root: <code>/opt/benchworks-outbound</code> / <code>/opt/larkin-tech</code></p>
          <p className="mt-1">Built {new Date().toISOString().slice(0, 10)}</p>
        </footer>
      </div>
    </main>
  );
}
