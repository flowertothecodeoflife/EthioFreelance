/**
 * Email utility using Nodemailer with Gmail + App Password.
 *
 * Setup (already done if GMAIL_USER and GMAIL_APP_PASS are in .env.local):
 *   1. Enable 2-Step Verification on your Google account
 *   2. Go to myaccount.google.com → Security → App Passwords
 *   3. Generate an app password for "Mail"
 *   4. Add to .env.local:
 *        GMAIL_USER=youraddress@gmail.com
 *        GMAIL_APP_PASS=xxxx xxxx xxxx xxxx
 */

import nodemailer from "nodemailer";

const GMAIL_USER     = process.env.GMAIL_USER!;
const SITE_URL       = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const LOGO_URL       = `${SITE_URL}/circular-logo.png`;
// Strip spaces from App Password — Gmail accepts both formats but nodemailer needs no spaces
const GMAIL_APP_PASS = (process.env.GMAIL_APP_PASS || "").replace(/\s/g, "");

// ─── Transporter (singleton pattern — reuse across requests) ─────────────────

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASS,
    },
  });

  return _transporter;
}

// ─── sendEmail ────────────────────────────────────────────────────────────────

interface SendEmailParams {
  to:      string;
  subject: string;
  html:    string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  // Dev fallback — log to console if credentials not configured
  if (!GMAIL_USER || !GMAIL_APP_PASS) {
    console.log(`\n📧 [DEV EMAIL — configure GMAIL_USER + GMAIL_APP_PASS to send real emails]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`─────────────────────────────────────────`);
    // Extract the OTP code from the HTML for easy dev testing
    const match = html.match(/font-family:monospace[^>]*>(\d{6})</);
    if (match) console.log(`OTP Code: ${match[1]}`);
    console.log(`─────────────────────────────────────────\n`);
    return;
  }

  const transporter = getTransporter();

  try {
    await transporter.sendMail({
      from:    `"EthioFreelance" <${GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err: any) {
    // Surface the real SMTP error so it's visible in server logs
    console.error("Nodemailer sendMail error:", err?.message || err);
    throw new Error(`Email delivery failed: ${err?.message || "unknown SMTP error"}`);
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────

export function otpEmailHtml(
  code: string,
  purpose: "EMAIL_VERIFY" | "PASSWORD_RESET"
): string {
  const title =
    purpose === "EMAIL_VERIFY" ? "Verify Your Email" : "Reset Your Password";

  const message =
    purpose === "EMAIL_VERIFY"
      ? "Use the code below to verify your email address and complete your EthioFreelance registration."
      : "Use the code below to reset your password. If you did not request this, you can safely ignore this email.";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;max-width:480px;width:100%">

          <!-- Header -->
          <tr>
            <td style="background:#14532d;padding:32px;text-align:center">
              <img src="${LOGO_URL}" alt="EthioFreelance" width="56" height="56" style="width:56px;height:56px;border-radius:50%;object-fit:contain;display:block;margin:0 auto" />
              <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:16px 0 4px">${title}</h1>
              <p style="color:#86efac;font-size:13px;margin:0">EthioFreelance Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px">
              <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 24px">${message}</p>

              <!-- OTP box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:24px;text-align:center">
                    <p style="color:#6b7280;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px">Your OTP Code</p>
                    <p style="color:#15803d;font-size:42px;font-weight:900;letter-spacing:14px;margin:0;font-family:'Courier New',Courier,monospace">${code}</p>
                  </td>
                </tr>
              </table>

              <p style="color:#9ca3af;font-size:12px;text-align:center;margin:24px 0 0">
                This code expires in <strong style="color:#6b7280">10 minutes</strong>.
                Do not share it with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center">
              <p style="color:#9ca3af;font-size:11px;margin:0">
                © ${new Date().getFullYear()} EthioFreelance · Ethiopia's Freelance Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
