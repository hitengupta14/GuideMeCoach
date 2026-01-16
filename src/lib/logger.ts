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
    // TODO: Implement Sentry integration
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureException(error, { tags: { message }, contexts: { custom: context } })
    // }
  }

  private sendToMonitoring(level: LogLevel, message: string, context?: LogContext) {
    // TODO: Implement monitoring service integration
    // Could send to Datadog, New Relic, CloudWatch, etc.
  }
}

export const logger = new Logger()
