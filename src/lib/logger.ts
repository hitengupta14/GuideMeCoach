/**
 * Centralized logging utility for the application
 */

type LogLevel = 'info' | 'error' | 'warn' | 'debug'

interface LogContext {
  userId?: string
  requestId?: string
  path?: string
  method?: string
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  info(message: string, context?: LogContext) {
    const formatted = this.formatMessage('info', message, context)
    console.log(formatted)
    
    // Send to monitoring service in production
    if (this.isProduction) {
      this.sendToMonitoring('info', message, context)
    }
  }

  error(message: string, error?: Error | any, context?: LogContext) {
    const formatted = this.formatMessage('error', message, {
      ...context,
      error: error?.message || String(error),
      stack: error?.stack,
    })
    console.error(formatted)
    
    // Send to error tracking service
    if (this.isProduction) {
      this.sendToSentry(message, error, context)
    }
  }

  warn(message: string, context?: LogContext) {
    const formatted = this.formatMessage('warn', message, context)
    console.warn(formatted)
    
    if (this.isProduction) {
      this.sendToMonitoring('warn', message, context)
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      const formatted = this.formatMessage('debug', message, context)
      console.debug(formatted)
    }
  }

  private sendToSentry(message: string, error?: any, context?: LogContext) {
    // Sentry integration for production error tracking
    if (process.env.SENTRY_DSN) {
      try {
        // Lazy load Sentry only if DSN is configured
        const Sentry = require('@sentry/nextjs')
        
        if (error) {
          Sentry.captureException(error, {
            tags: { message },
            contexts: { custom: context },
            level: 'error',
          })
        } else {
          Sentry.captureMessage(message, {
            tags: context,
            level: 'error',
          })
        }
      } catch (sentryError) {
        console.error('Failed to send to Sentry:', sentryError)
      }
    }
  }

  private sendToMonitoring(level: LogLevel, message: string, context?: LogContext) {
    // Send to monitoring service (Datadog, New Relic, CloudWatch, etc.)
    if (process.env.DATADOG_API_KEY) {
      try {
        // Example: Datadog logs API
        // This would be replaced with actual Datadog client
        fetch('https://http-intake.logs.datadoghq.com/v1/input', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'DD-API-KEY': process.env.DATADOG_API_KEY,
          },
          body: JSON.stringify({
            message,
            level,
            service: 'guidemecoach',
            ddsource: 'nodejs',
            ddtags: context ? Object.entries(context).map(([k, v]) => `${k}:${v}`).join(',') : '',
            timestamp: new Date().toISOString(),
          }),
        }).catch(err => console.error('Failed to send to monitoring:', err))
      } catch (error) {
        console.error('Failed to send to monitoring service:', error)
      }
    }
  }
}

export const logger = new Logger()
