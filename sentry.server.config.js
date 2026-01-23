// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || "development",

  // Performance Monitoring
  integrations: [
    // Automatically instrument Node.js libraries and frameworks
    new Sentry.Integrations.Http({ tracing: true }),
  ],

  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    // Random plugins/extensions
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    // Network errors
    "Network request failed",
    "NetworkError",
  ],

  // Before sending to Sentry, sanitize sensitive data
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") {
      return null;
    }

    // Remove sensitive data from context
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.["authorization"];
      delete event.request.headers?.["cookie"];
    }

    // Remove sensitive data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.data) {
          delete breadcrumb.data.authorization;
          delete breadcrumb.data.cookie;
        }
        return breadcrumb;
      });
    }

    return event;
  },
});
