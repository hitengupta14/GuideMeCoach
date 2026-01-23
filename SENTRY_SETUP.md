# Sentry Configuration Guide

## Setup Instructions

### 1. Install Sentry
```bash
npm install --save @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 2. Environment Variables
Add to your `.env.local` file:
```bash
# Sentry DSN (Get from sentry.io)
SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id

# Optional: Sentry Auth Token for source maps
SENTRY_AUTH_TOKEN=your-auth-token

# Optional: App version for release tracking
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 3. Datadog (Optional)
For additional monitoring, add:
```bash
DATADOG_API_KEY=your-datadog-api-key
```

## Features Implemented

### Error Tracking
- ✅ Automatic error capture on client and server
- ✅ Source maps for production debugging
- ✅ Error deduplication
- ✅ PII sanitization before sending

### Performance Monitoring
- ✅ Transaction tracing
- ✅ Database query monitoring
- ✅ API endpoint performance

### Session Replay
- ✅ 10% of normal sessions recorded
- ✅ 100% of error sessions recorded
- ✅ Privacy-first (all text/media masked)

### Context Enrichment
- ✅ User information
- ✅ Environment data
- ✅ Breadcrumbs (user actions)
- ✅ Custom tags

## Testing

### Test Sentry in Development
Temporarily remove the development check in sentry config:
```javascript
beforeSend(event) {
  // Comment out this line temporarily
  // if (process.env.NODE_ENV === 'development') return null
  return event
}
```

Then trigger an error:
```javascript
throw new Error('Test Sentry Integration')
```

### Verify Installation
```bash
npx @sentry/wizard@latest verify
```

## Production Deployment

### Vercel
Add environment variables in Vercel dashboard:
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

### Other Platforms
Ensure environment variables are set in your deployment platform.

## Cost Optimization

### Adjust Sample Rates
In production, you may want to reduce costs:
```javascript
// sentry.client.config.js
tracesSampleRate: 0.1,  // Sample 10% of transactions
replaysSessionSampleRate: 0.01,  // Sample 1% of sessions
```

### Error Filtering
Add more patterns to `ignoreErrors` array to reduce noise.

## Monitoring Dashboard

Access your Sentry dashboard at:
https://sentry.io/organizations/your-org/projects/your-project/

### Key Metrics to Watch
- Error rate trends
- Performance degradation
- User-impacting issues
- Release health

## Support
- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- GuideMeCoach Team: support@guidemecoach.com
