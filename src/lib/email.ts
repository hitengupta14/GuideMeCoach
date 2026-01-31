/**
 * Email utility for sending emails via Resend
 */

import { Resend } from 'resend'
import { logger } from './logger'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send email via Resend
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // If no API key, fall back to console logging for development
    if (!process.env.RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY not set, logging email to console')
      console.log('='.repeat(60))
      console.log('📧 EMAIL (Development Mode - No API Key)')
      console.log('='.repeat(60))
      console.log(`To: ${options.to}`)
      console.log(`Subject: ${options.subject}`)
      console.log('---')
      console.log(options.text || options.html)
      console.log('='.repeat(60))
      return true
    }

    // Send via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'GuideMeCoach <onboarding@resend.dev>',
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    if (error) {
      logger.error('Resend email error', error as Error, {
        to: options.to.substring(0, 5) + '***',
        subject: options.subject,
      })
      return false
    }

    logger.info('Email sent successfully', {
      to: options.to.substring(0, 5) + '***',
      subject: options.subject,
      messageId: data?.id,
    })

    return true
  } catch (error) {
    logger.error('Failed to send email', error as Error, {
      to: options.to.substring(0, 5) + '***',
      subject: options.subject,
    })
    return false
  }
}

/**
 * Email verification template
 */
export function getVerificationEmailHtml(token: string, appUrl: string): { html: string; text: string } {
  const verifyUrl = `${appUrl}/auth/verify?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to GuideMeCoach!</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email</h2>
          <p>Thanks for signing up! Please verify your email address to get started.</p>
          <p>
            <a href="${verifyUrl}" class="button">Verify Email Address</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${verifyUrl}</p>
          <p><small>This link will expire in 24 hours.</small></p>
        </div>
        <div class="footer">
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <p>&copy; 2026 GuideMeCoach. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Welcome to GuideMeCoach!

Please verify your email address by clicking the link below:

${verifyUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

© 2026 GuideMeCoach. All rights reserved.
  `

  return { html, text }
}

/**
 * Password reset email template
 */
export function getPasswordResetEmailHtml(token: string, appUrl: string): { html: string; text: string } {
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #667eea; color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔑 Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <p>
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <p>This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you're concerned.</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2026 GuideMeCoach. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Password Reset Request

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email or contact support if you're concerned.

© 2026 GuideMeCoach. All rights reserved.
  `

  return { html, text }
}

/**
 * Send progress summary email
 */
export async function sendProgressEmail(options: {
  email: string
  name: string
  insights: string
  stats: {
    totalWorkouts: number
    avgDuration: number
    avgEnergyLevel: number
    exercisesTracked: number
    topExercises: string[]
  }
  period: {
    weeks: number
    from: string
    to: string
  }
}): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; font-size: 12px; text-transform: uppercase; }
        .insights { background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; }
        .insight-text { white-space: pre-wrap; font-size: 14px; line-height: 1.8; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💪 Your Weekly Progress Summary</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Last ${options.period.weeks} weeks</p>
        </div>
        <div class="content">
          <h2>Hey ${options.name}! 👋</h2>
          <p>Here's your personalized progress analysis for the period ${options.period.from} to ${options.period.to}:</p>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Workouts</div>
              <div class="stat-value">${options.stats.totalWorkouts}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Avg Duration</div>
              <div class="stat-value">${Math.round(options.stats.avgDuration)}m</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Energy Level</div>
              <div class="stat-value">${Math.round(options.stats.avgEnergyLevel)}/10</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Exercises</div>
              <div class="stat-value">${options.stats.exercisesTracked}</div>
            </div>
          </div>

          <div class="insights">
            <h3 style="margin-top: 0; color: #333;">🎯 AI Analysis</h3>
            <div class="insight-text">${options.insights}</div>
          </div>

          <p style="text-align: center;">
            <a href="${process.env.APP_URL || 'https://guidemecoach.com'}/progress" class="button">View Full Dashboard</a>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated progress summary from GuideMeCoach.</p>
          <p>&copy; 2026 GuideMeCoach. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Your Weekly Progress Summary
Last ${options.period.weeks} weeks

Hi ${options.name},

Here's your personalized progress analysis for ${options.period.from} to ${options.period.to}:

Total Workouts: ${options.stats.totalWorkouts}
Avg Duration: ${Math.round(options.stats.avgDuration)} minutes
Energy Level: ${Math.round(options.stats.avgEnergyLevel)}/10
Exercises Tracked: ${options.stats.exercisesTracked}

AI Analysis:
${options.insights}

View your full dashboard: ${process.env.APP_URL || 'https://guidemecoach.com'}/progress

This is an automated progress summary from GuideMeCoach.
© 2026 GuideMeCoach. All rights reserved.
  `

  return sendEmail({
    to: options.email,
    subject: `Your ${options.period.weeks}-Week Progress Summary - GuideMeCoach 💪`,
    html,
    text,
  })
}
