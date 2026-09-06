import type { MailMessage } from '../../config/mailer.js';

type MagicLinkEmailInput = {
  to: string;
  companyName: string;
  link: string;
  ttlMinutes: number;
};

/**
 * Branded HTML sign-in email for the customer portal, with a plain-text
 * fallback for clients that don't render HTML.
 */
export const buildMagicLinkEmail = ({
  to,
  companyName,
  link,
  ttlMinutes,
}: MagicLinkEmailInput): MailMessage => {
  const text = [
    `Hi ${companyName},`,
    '',
    'Use the link below to sign in to your DealFlow360 customer portal:',
    link,
    '',
    `This link expires in ${String(ttlMinutes)} minutes and can only be used once.`,
    "If you didn't request it, you can safely ignore this email.",
    '',
    '— DealFlow360',
  ].join('\n');

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px 32px;">
                <div style="font-size:20px;font-weight:600;letter-spacing:-0.01em;color:#0f172a;">
                  DealFlow<span style="color:#2563eb;">360</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0 32px;">
                <h1 style="margin:16px 0 8px 0;font-size:18px;font-weight:600;color:#0f172a;">Sign in to your portal</h1>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">
                  Hi ${companyName}, tap the button below to securely sign in to your DealFlow360 customer portal. No password needed.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 32px;">
                <a href="${link}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">
                  Sign in to DealFlow360
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                  Or paste this link into your browser:<br />
                  <span style="color:#2563eb;word-break:break-all;">${link}</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 28px 32px;border-top:1px solid #f1f5f9;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                  This link expires in ${String(ttlMinutes)} minutes and can only be used once.
                  If you didn&rsquo;t request it, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:11px;color:#cbd5e1;">&copy; DealFlow360</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { to, subject: 'Your DealFlow360 sign-in link', text, html };
};
