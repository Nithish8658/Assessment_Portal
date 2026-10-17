import React from 'react';
import * as Sentry from '@sentry/react';

// Error monitoring with Sentry; off unless VITE_SENTRY_DSN is set at build time. Only what is
// needed to fix a crash is sent: no session replays (they would record students' screens and
// code), no request bodies, and no query strings in recorded API calls.
const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

const stripQuery = (url: unknown) => (typeof url === 'string' ? url.split('?')[0] : url);

export const initMonitoring = () => {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: (import.meta.env.VITE_VERCEL_ENV as string | undefined) || import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeBreadcrumb(crumb) {
      if (crumb.data?.url) crumb.data.url = stripQuery(crumb.data.url);
      return crumb;
    },
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        event.request.url = stripQuery(event.request.url) as string | undefined;
        delete event.request.query_string;
      }
      return event;
    },
  });
};

// Tags reports with the signed-in role (not the person), to see who a crash affects
export const setMonitoringRole = (role: string | null) => {
  if (dsn) Sentry.setTag('role', role || 'signed-out');
};

const Fallback = () => (
  <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center p-6 font-sans">
    <div className="max-w-md text-center space-y-3 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-xl">
      <h1 className="text-lg font-bold text-[#0F172A]">Something went wrong</h1>
      <p className="text-sm text-[#64748B]">
        The page hit an unexpected error and the team has been notified. Answers you already saved are kept.
      </p>
      <button onClick={() => window.location.reload()}
        className="px-4 py-2 rounded-xl bg-[#FF5500] hover:bg-[#E64D00] text-white font-bold cursor-pointer shadow-sm transition">Reload</button>
    </div>
  </div>
);

export const MonitoringBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Sentry.ErrorBoundary fallback={<Fallback />}>{children}</Sentry.ErrorBoundary>
);
