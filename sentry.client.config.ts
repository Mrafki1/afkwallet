import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,      // 10% of transactions for performance
    replaysOnErrorSampleRate: 1.0,  // always record replay on error
    replaysSessionSampleRate: 0.01, // 1% of sessions
    integrations: [Sentry.replayIntegration()],
    debug: false,
  });
}
