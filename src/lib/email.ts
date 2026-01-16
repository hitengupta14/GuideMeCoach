/**
 * Email utility for sending emails
 * Currently uses console.log, replace with actual email service in production
 */

import { logger } from './logger'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send email (currently just logs, replace with actual service)
 * Options: SendGrid, Resend, Nodemailer, AWS SES
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // TODO: Replace with actual email service
    // Example for SendGrid:
    // const msg = {
    //   to: options.to,
    //   from: process.env.FROM_EMAIL!,
    //   subject: options.subject,
    //   html: options.html,
    // }
    // await sgMail.send(msg)

    // For now, just log it
    logger.info('Email would be sent', {
      to: options.to.substring(0, 5) + '***',
      subject: options.subject,
    })

    console.log('='.repeat(60))
    console.log('📧 EMAIL (Development Mode)')
    console.log('='.repeat(60))
    console.log(`To: ${options.to}`)
    console.log(`Subject: ${options.subject}`)
    console.log('---')
    console.log(options.text || options.html)
    console.log('='.repeat(60))

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
