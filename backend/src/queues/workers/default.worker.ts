import { Worker } from 'bullmq';
import { logger, redis } from '../../config/index.js';
import { sendMail, type MailMessage } from '../../config/mailer.js';
import { createQuotationPdf } from '../../modules/quotations/quotation.pdf.js';
import type { QuotationEmailJobData } from '../../jobs/jobs.js';
import { subscriptionService } from '../../modules/subscriptions/subscription.service.js';
import { JOB_NAMES, QUEUE_NAMES } from '../queue.constants.js';

export const createDefaultWorker = (): Worker => {
  const worker = new Worker(
    QUEUE_NAMES.DEFAULT,
    async (job) => {
      logger.info({ jobId: job.id, name: job.name }, 'Processing background job');
      if (job.name === JOB_NAMES.SEND_EMAIL) await sendMail(job.data as MailMessage);
      if (job.name === JOB_NAMES.SEND_QUOTATION_EMAIL) {
        const data = job.data as QuotationEmailJobData;
        const pdf = await createQuotationPdf(data.quotation);
        await sendMail({
          to: data.to,
          subject: data.subject,
          text: data.text,
          html: data.html,
          attachments: [
            {
              filename: `${data.quotation.quoteNumber}.pdf`,
              content: pdf.toString('base64'),
              encoding: 'base64',
              contentType: 'application/pdf',
            },
          ],
        });
      }
      if (job.name === JOB_NAMES.GENERATE_SUBSCRIPTION_INVOICES)
        await subscriptionService.runBillingCycle();
    },
    { connection: redis },
  );
  worker.on('failed', (job, error) =>
    logger.error({ jobId: job?.id, err: error }, 'Background job failed'),
  );
  return worker;
};
