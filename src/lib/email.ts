/**
 * Email utility — Brevo (formerly Sendinblue) Transactional Email API.
 *
 * Brevo sends over HTTPS (port 443), so it works behind any firewall or ISP
 * that blocks outbound SMTP ports 465 / 587. No domain ownership required
 * to get started — you can send from any verified sender address.
 *
 * Setup:
 *   1. Sign up at https://www.brevo.com (free tier: 300 emails/day)
 *   2. Go to Settings → SMTP & API → API Keys → Create a new API key
 *   3. Add your sender email under Settings → Senders & IP → Add a Sender
 *      (verify it — Brevo sends a confirmation link to that address)
 *   4. Add to .env.local:
 *        BREVO_API_KEY=xkeysib-...
 *        BREVO_SENDER_EMAIL=your-verified@email.com   (defaults to GMAIL_USER if not set)
 *        BREVO_SENDER_NAME=EthioFreelance             (optional)
 */

import * as Brevo from "@getbrevo/brevo";

// ── Read env vars ─────────────────────────────────────────────────────────────
const BREVO_API_KEY     = process.env.BREVO_API_KEY ?? "";
const SITE_URL          = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const LOGO_URL          = `${SITE_URL}/circular-logo.png`;

// Sender email — use dedicated env var, fall back to GMAIL_USER for convenience
const SENDER_EMAIL      = process.env.BREVO_SENDER_EMAIL
                        ?? process.env.GMAIL_USER
                        ?? "";
const SENDER_NAME       = process.env.BREVO_SENDER_NAME ?? "EthioFreelance";

const CREDENTIALS_OK    = BREVO_API_KEY.startsWith("xkeysib-") && SENDER_EMAIL.includes("@");

// ── Brevo API client — created fresh per call (serverless-safe) ───────────────
function createClient() {
  const apiInstance = new Brevo.TransactionalEmailsApi();
  // The SDK reads the key from the ApiClient default headers
  apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    BREVO_API_KEY,
  );
  return apiInstance;
}

// ── sendEmail ─────────────────────────────────────────────────────────────────

export interface SendEmailParams {
  to:      string;
  subject: string;
  html:    string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  // ── Dev console fallback when credentials are missing / invalid ─────────────
  if (!CREDENTIALS_OK) {
    console.log("\n📧 ─────────────────────────────────────────────────");
    console.log("   DEV MODE — email not sent (Brevo not configured)");
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);

    const match = html.match(/font-family:monospace[^>]*>(\d{6})</);
    if (match) console.log(`\n   ⚡ OTP CODE: ${match[1]}\n`);

    if (!BREVO_API_KEY) {
      console.log("   ⚠  BREVO_API_KEY is not set in .env.local");
    } else if (!BREVO_API_KEY.startsWith("xkeysib-")) {
      console.log("   ⚠  BREVO_API_KEY doesn't look right (should start with xkeysib-)");
    }
    if (!SENDER_EMAIL) {
      console.log("   ⚠  Set BREVO_SENDER_EMAIL (or GMAIL_USER) to the verified sender address");
    }
    console.log("─────────────────────────────────────────────────\n");
    return;
  }

  // ── Send via Brevo API ────────────────────────────────────────────────────
  const client  = createClient();
  const message = new Brevo.SendSmtpEmail();

  message.sender    = { name: SENDER_NAME, email: SENDER_EMAIL };
  message.to        = [{ email: to }];
  message.subject   = subject;
  message.htmlContent = html;
  // Reply-To so recipients can reply to the sender address
  message.replyTo   = { email: SENDER_EMAIL, name: SENDER_NAME };

  try {
    const result = await client.sendTransacEmail(message);
    console.log(`📧 Email sent to ${to} — messageId: ${(result.body as any)?.messageId ?? "n/a"}`);
  } catch (err: any) {
    const status  = err?.response?.status  ?? "";
    const body    = err?.response?.text    ?? err?.message ?? "unknown error";

    console.error("─── Brevo API error ─────────────────────────────");
    console.error(`  status:  ${status}`);
    console.error(`  body:    ${body}`);
    console.error(`  sender:  ${SENDER_EMAIL}`);
    console.error("─────────────────────────────────────────────────");

    // Human-readable error messages
    let userMessage = `Email delivery failed (${status || "unknown"})`;
    if (status === 401) {
      userMessage = "Brevo authentication failed — check your BREVO_API_KEY.";
    } else if (status === 400) {
      userMessage = `Brevo rejected the request — ${body}. Check BREVO_SENDER_EMAIL is a verified sender.`;
    } else if (status === 429) {
      userMessage = "Brevo rate limit reached. Try again in a minute.";
    }

    throw new Error(userMessage);
  }
}

// ── Email templates ───────────────────────────────────────────────────────────

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
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;max-width:480px;width:100%">

          <!-- Header -->
          <tr>
            <td style="background:#14532d;padding:32px;text-align:center">
              <img
                src="${LOGO_URL}"
                alt="EthioFreelance"
                width="56" height="56"
                style="width:56px;height:56px;border-radius:50%;object-fit:contain;display:block;margin:0 auto"
              />
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
                    <p style="color:#6b7280;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px">
                      Your OTP Code
                    </p>
                    <p style="color:#15803d;font-size:42px;font-weight:900;letter-spacing:14px;margin:0;font-family:'Courier New',Courier,monospace">
                      ${code}
                    </p>
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
                &copy; ${new Date().getFullYear()} EthioFreelance &middot; Ethiopia&apos;s Freelance Platform
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
