// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user visits a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || "development",

  integrations: [
    new Sentry.Replay({
      // Mask all text content, images, etc.
      maskAllText: true,
      blockAllMedia: true,
    }),
    new Sentry.BrowserTracing({
      // Set `tracePropagationTargets` to control distributed tracing
      tracePropagationTargets: ["localhost", /^https:\/\/guidemecoach\.com/],
    }),
  ],

  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    // Network errors
    "Network request failed",
    "NetworkError",
    // React hydration errors (often not actionable)
    "Hydration failed",
    "There was an error while hydrating",
  ],

  // Before sending to Sentry, sanitize sensitive data
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") {
      return null;
    }

    // Remove sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.["authorization"];
      delete event.request.headers?.["cookie"];
    }

    // Remove PII from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.category === "console") {
          // Redact potential PII in console logs
          if (breadcrumb.message) {
            breadcrumb.message = breadcrumb.message.replace(
              /\b[\w\.-]+@[\w\.-]+\.\w+\b/g,
              "[EMAIL]"
            );
            breadcrumb.message = breadcrumb.message.replace(
              /\b\d{10,}\b/g,
              "[PHONE]"
            );
          }
        }
        return breadcrumb;
      });
    }

    return event;
  },
});
