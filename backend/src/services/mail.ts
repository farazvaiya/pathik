import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: (env.SMTP_PORT || 587) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

export async function sendEmail(options: { to: string; subject: string; html: string }): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    logger.info(`[mail] SMTP not configured — email to ${options.to} not sent`);
    logger.info(`[mail] Subject: ${options.subject}`);
    logger.info(`[mail] Preview: ${options.html.slice(0, 200)}...`);
    return false;
  }
  try {
    await transport.sendMail({
      from: env.EMAIL_FROM || 'Pathik <noreply@pathik.app>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (err: any) {
    logger.warn(`[mail] Failed to send email: ${err.message}`);
    return false;
  }
}

export async function sendVerificationEmail(email: string, token: string, displayName: string): Promise<void> {
  const verifyUrl = `${env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #059669;">পথিক — Email Verification</h2>
      <p>Hi ${displayName},</p>
      <p>Click below to verify your email address:</p>
      <a href="${verifyUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Verify Email
      </a>
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        This link expires in 24 hours. If you didn't create an account, you can ignore this email.
      </p>
    </div>
  `;
  await sendEmail({ to: email, subject: 'Verify your Pathik account', html });
}
