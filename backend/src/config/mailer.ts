import nodemailer, { type Transporter } from 'nodemailer';
import { env } from './env.js';
import { logger } from './logger.js';

export type MailAttachment = {
  filename: string;
  content: string;
  encoding?: 'base64' | 'utf8';
  contentType?: string;
};

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: MailAttachment[];
};

let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  if (!env.SMTP_HOST) return null;
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
  return transporter;
};

export const sendMail = async (message: MailMessage): Promise<void> => {
  const transport = getTransporter();
  if (!transport) {
    logger.warn({ to: message.to, subject: message.subject }, 'SMTP not configured; mail skipped');
    return;
  }
  await transport.sendMail({ from: env.SMTP_FROM, ...message });
};

export const closeMailer = (): void => {
  transporter?.close();
  transporter = null;
};
