import nodemailer from 'nodemailer';
import { prisma } from '../prisma';
import { EmailStatus } from '@prisma/client';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT),
        secure: parseInt(SMTP_PORT) === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASSWORD,
        },
      });
      console.log('Email transporter initialized successfully.');
    } else {
      console.warn('Email transporter configuration missing. Email sending will be skipped.');
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter) {
      return { success: false, error: 'Transporter not initialized' };
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        text: body,
        // html: body, // Could support HTML if body is HTML
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Background worker method to process QUEUED emails.
   */
  async processEmailQueue() {
    const queuedEmails = await prisma.outreachEmail.findMany({
      where: { status: 'QUEUED' as EmailStatus },
      include: { lead: true },
      take: 10, // Process in batches
    });

    if (queuedEmails.length === 0) return;

    console.log(`Processing ${queuedEmails.length} queued emails...`);

    for (const email of queuedEmails) {
      const targetEmail = email.lead.decisionMakerEmail;

      if (!targetEmail) {
        console.warn(`Lead ${email.leadId} has no email address. Marking as FAILED.`);
        await prisma.outreachEmail.update({
          where: { id: email.id },
          data: { status: 'FAILED' as EmailStatus, error: 'Missing lead email address' },
        });
        continue;
      }

      const result = await this.sendEmail(targetEmail, email.subject, email.body);

      if (result.success) {
        await prisma.outreachEmail.update({
          where: { id: email.id },
          data: { status: 'SENT' as EmailStatus, sentAt: new Date() },
        });
      } else {
        await prisma.outreachEmail.update({
          where: { id: email.id },
          data: { status: 'FAILED' as EmailStatus, error: result.error },
        });
      }
    }
  }
}

export const emailService = new EmailService();
