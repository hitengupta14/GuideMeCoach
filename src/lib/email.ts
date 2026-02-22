/**
 * Email utility for sending emails via Resend
 */

import { Resend } from 'resend'
import { logger } from './logger'

let resendInstance: Resend | null = null

function getResendInstance(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

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
      console.log(' EMAIL (Development Mode - No API Key)')
      console.log('='.repeat(60))
      console.log(`To: ${options.to}`)
      console.log(`Subject: ${options.subject}`)
      console.log('---')
      console.log(options.text || options.html)
      console.log('='.repeat(60))
      return true
    }

    const resend = getResendInstance()
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
  // Use API route to perform verification (then redirects to a friendly UI page).
  const verifyUrl = `${appUrl}/api/auth/verify?token=${token}`

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
          <h1> Welcome to GuideMeCoach!</h1>
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
          <h1> Reset Your Password</h1>
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
            <strong> Security Notice:</strong>
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
 * Payment success email template
 */
export function getPaymentSuccessEmailHtml(options: {
  name: string
  planType: 'premium' | 'premium-yearly'
  amount: number
  subscriptionEndsAt: string
  appUrl: string
}): { html: string; text: string } {
  const planName = options.planType === 'premium-yearly' ? 'Premium Yearly' : 'Premium Monthly'
  const formattedAmount = (options.amount / 100).toFixed(2)
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .success-icon { font-size: 60px; margin-bottom: 20px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon"></div>
          <h1>Payment Successful!</h1>
        </div>
        <div class="content">
          <h2>Welcome to GuideMeCoach Premium, ${options.name}! </h2>
          <p>Your payment has been processed successfully. You now have access to all premium features!</p>
          
          <div class="details">
            <div class="details-row">
              <strong>Plan:</strong>
              <span>${planName}</span>
            </div>
            <div class="details-row">
              <strong>Amount Paid:</strong>
              <span>₹${formattedAmount}</span>
            </div>
            <div class="details-row">
              <strong>Subscription Valid Until:</strong>
              <span>${new Date(options.subscriptionEndsAt).toLocaleDateString()}</span>
            </div>
          </div>

          <h3>What's Included:</h3>
          <ul>
            <li> AI Workout Planner (2/month)</li>
            <li> AI Chat Support (25 messages/month)</li>
            <li> AI Weekly Insights (1/week)</li>
            <li> AI Plan Edits (3/month)</li>
            <li> Priority support</li>
            <li> Ad-free experience</li>
          </ul>

          <p style="text-align: center;">
            <a href="${options.appUrl}" class="button">Start Your Premium Journey</a>
          </p>
        </div>
        <div class="footer">
          <p>Questions? Reply to this email or contact us at support@guidemecoach.com</p>
          <p>&copy; 2026 GuideMeCoach. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Payment Successful! 

Welcome to GuideMeCoach Premium, ${options.name}!

Your payment has been processed successfully.

Payment Details:
- Plan: ${planName}
- Amount Paid: ₹${formattedAmount}
- Subscription Valid Until: ${new Date(options.subscriptionEndsAt).toLocaleDateString()}

	What's Included:
 AI Workout Planner (2/month)
 AI Chat Support (25 messages/month)
 AI Weekly Insights (1/week)
 AI Plan Edits (3/month)
 Priority support
 Ad-free experience

Start your premium journey: ${options.appUrl}

Questions? Reply to this email or contact us at support@guidemecoach.com

© 2026 GuideMeCoach. All rights reserved.
  `

  return { html, text }
}

/**
 * Subscription expiry warning email template
 */
export function getSubscriptionExpiryEmailHtml(options: {
  name: string
  daysRemaining: number
  subscriptionEndsAt: string
  appUrl: string
}): { html: string; text: string } {
  const urgency = options.daysRemaining <= 3 ? 'urgent' : 'warning'
  const color = urgency === 'urgent' ? '#ef4444' : '#f59e0b'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${color}; color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: ${color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning-box { background: #fef3c7; border-left: 4px solid ${color}; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1> Your Premium Subscription is Expiring Soon</h1>
        </div>
        <div class="content">
          <h2>Hi ${options.name},</h2>
          
          <div class="warning-box">
            <h3 style="margin-top: 0; color: ${color};">
              ${options.daysRemaining} Day${options.daysRemaining !== 1 ? 's' : ''} Remaining
            </h3>
            <p>Your GuideMeCoach Premium subscription will expire on <strong>${new Date(options.subscriptionEndsAt).toLocaleDateString()}</strong></p>
          </div>

          <p>After expiration, you'll lose access to:</p>
          <ul>
            <li> AI Workout Planner</li>
            <li> AI Chat Support</li>
            <li> AI Weekly Insights</li>
            <li> AI Plan Edits</li>
          </ul>

          <p><strong>Don't let your progress stop!</strong> Renew now to keep all premium features.</p>

          <p style="text-align: center;">
            <a href="${options.appUrl}/pricing" class="button">Renew Subscription</a>
          </p>
        </div>
        <div class="footer">
          <p>Questions? Contact us at support@guidemecoach.com</p>
          <p>&copy; 2026 GuideMeCoach. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
 Your Premium Subscription is Expiring Soon

Hi ${options.name},

${options.daysRemaining} Day${options.daysRemaining !== 1 ? 's' : ''} Remaining!

Your GuideMeCoach Premium subscription will expire on ${new Date(options.subscriptionEndsAt).toLocaleDateString()}

	After expiration, you'll lose access to:
 AI Workout Planner
 AI Chat Support
 AI Weekly Insights
 AI Plan Edits

Don't let your progress stop! Renew now: ${options.appUrl}/pricing

Questions? Contact us at support@guidemecoach.com

© 2026 GuideMeCoach. All rights reserved.
  `

  return { html, text }
}

/**
 * Send payment success email
 */
export async function sendPaymentSuccessEmail(options: {
  email: string
  name: string
  planType: 'premium' | 'premium-yearly'
  amount: number
  subscriptionEndsAt: string
}): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const { html, text } = getPaymentSuccessEmailHtml({ ...options, appUrl })

  return sendEmail({
    to: options.email,
    subject: ' Payment Successful - Welcome to GuideMeCoach Premium!',
    html,
    text,
  })
}

/**
 * Send subscription expiry warning email
 */
export async function sendSubscriptionExpiryEmail(options: {
  email: string
  name: string
  daysRemaining: number
  subscriptionEndsAt: string
}): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const { html, text } = getSubscriptionExpiryEmailHtml({ ...options, appUrl })

  const subject = options.daysRemaining <= 3 
    ? ` URGENT: Premium expires in ${options.daysRemaining} day${options.daysRemaining !== 1 ? 's' : ''}!`
    : `⏰ Premium expires in ${options.daysRemaining} days`

  return sendEmail({
    to: options.email,
    subject,
    html,
    text,
  })
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
          <h1> Your Weekly Progress Summary</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Last ${options.period.weeks} weeks</p>
        </div>
        <div class="content">
          <h2>Hey ${options.name}! </h2>
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
            <h3 style="margin-top: 0; color: #333;"> AI Analysis</h3>
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
    subject: `Your ${options.period.weeks}-Week Progress Summary - GuideMeCoach `,
    html,
    text,
  })
}
