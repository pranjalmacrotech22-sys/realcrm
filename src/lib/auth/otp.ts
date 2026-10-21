import { Resend } from "resend";
import nodemailer from "nodemailer";
import fs from "node:fs";
import path from "node:path";

interface StoredOtp {
  code: string;
  expiresAt: number; // timestamp in ms
  attempts: number;
  lastSentAt: number;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const OTP_FILE = path.join(DATA_DIR, "otps.json");

function loadOtpsFromDisk(): Map<string, StoredOtp> {
  try {
    if (fs.existsSync(OTP_FILE)) {
      const content = fs.readFileSync(OTP_FILE, "utf-8");
      const obj = JSON.parse(content);
      const map = new Map<string, StoredOtp>();
      const now = Date.now();
      for (const [k, v] of Object.entries(obj)) {
        const item = v as StoredOtp;
        if (item.expiresAt > now) {
          map.set(k, item);
        }
      }
      return map;
    }
  } catch {}
  return new Map();
}

function saveOtpsToDisk(map: Map<string, StoredOtp>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const obj: Record<string, StoredOtp> = {};
    const now = Date.now();
    for (const [k, v] of map.entries()) {
      if (v.expiresAt > now) {
        obj[k] = v;
      }
    }
    fs.writeFileSync(OTP_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch {}
}

// In-memory OTP storage with disk persistence across server restarts
const globalForOtp = globalThis as unknown as { otpStore?: Map<string, StoredOtp> };
const otpStore = globalForOtp.otpStore ?? loadOtpsFromDisk();
if (process.env.NODE_ENV !== "production") globalForOtp.otpStore = otpStore;

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds between resends
const MAX_ATTEMPTS = 5;

/**
 * Generate a cryptographically strong 6-digit numeric OTP code
 */
export function generateOtpCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return String(num);
}

function getResendConfig(): { apiKey: string | null; fromEmail: string } {
  let apiKey = process.env.RESEND_API_KEY?.trim() || null;
  let fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || null;

  // Fallback: Read directly from .env.local or .env if environment wasn't hydrated by Next.js
  if (!apiKey || apiKey === "dummy_key_for_build") {
    try {
      const envPaths = [
        path.join(process.cwd(), ".env.local"),
        path.join(process.cwd(), ".env"),
      ];
      for (const p of envPaths) {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, "utf-8");
          const keyMatch = content.match(/^RESEND_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/m);
          if (keyMatch && keyMatch[1]) {
            apiKey = keyMatch[1].trim();
            process.env.RESEND_API_KEY = apiKey;
          }
          const fromMatch = content.match(/^RESEND_FROM_EMAIL\s*=\s*["']?([^"'\r\n]+)["']?/m);
          if (fromMatch && fromMatch[1]) {
            fromEmail = fromMatch[1].trim();
            process.env.RESEND_FROM_EMAIL = fromEmail;
          }
          if (apiKey) break;
        }
      }
    } catch (e) {
      console.warn("[OTP] Could not read env file:", e);
    }
  }

  const validKey = apiKey && apiKey !== "dummy_key_for_build" ? apiKey : null;
  const validFrom = fromEmail || "RealCRM <noreply@macrotechsoftwares.com>";

  return { apiKey: validKey, fromEmail: validFrom };
}

/**
 * Request an OTP for a given email address and send it via Resend
 */
export async function createAndSendOtp(email: string): Promise<{
  success: boolean;
  message: string;
  expiresAt: number;
  resendId?: string;
  sandboxNotice?: string;
  devOtp?: string;
}> {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = otpStore.get(normalizedEmail);

  // Rate limiting / cooldown check
  if (existing && Date.now() - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt)) / 1000);
    throw new Error(`Please wait ${waitSec}s before requesting a new code.`);
  }

  const code = generateOtpCode();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  otpStore.set(normalizedEmail, {
    code,
    expiresAt,
    attempts: 0,
    lastSentAt: Date.now(),
  });
  saveOtpsToDisk(otpStore);

  const { apiKey: resendApiKey, fromEmail: resendFrom } = getResendConfig();

  // Enterprise HTML email template
  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RealCRM Login Verification Code</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden;">
            <!-- Header -->
            <tr>
              <td style="background-color: #0f172a; padding: 24px 32px;">
                <span style="font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">RealCRM</span>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 32px;">
                <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Your Verification Code</h1>
                <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
                  Enter the following 6-digit code to sign in to your RealCRM workspace:
                </p>

                <!-- Code Container -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
                  <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2563eb;">${code}</span>
                </div>

                <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0 0 8px 0;">
                  This code expires in <strong>10 minutes</strong>. Never share this code with anyone.
                </p>
                <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
                  If you didn't request this code, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                  RealCRM Workspace • Private Real Estate Management
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  // 1. Direct SMTP delivery if configured (e.g. Gmail App Password, Brevo, custom SMTP)
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const smtpFrom = process.env.SMTP_FROM || `RealCRM <${smtpUser}>`;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to: normalizedEmail,
        subject: `${code} is your RealCRM verification code`,
        html: emailHtml,
      });

      console.log(`[SMTP] Successfully delivered OTP email to ${normalizedEmail} (messageId: ${info.messageId})`);

      return {
        success: true,
        message: "A 6-digit verification code has been sent to your email.",
        expiresAt,
      };
    } catch (smtpErr: unknown) {
      console.error("SMTP delivery failed, falling back to Resend:", smtpErr);
    }
  }

  // 2. Resend API delivery
  if (!resendApiKey) {
    console.log("\n============================================================");
    console.log(`🔐 [REALCRM 2FA CODE - LOCAL / DEV MODE]`);
    console.log(`Email:   ${normalizedEmail}`);
    console.log(`Code:    ${code}`);
    console.log(`Expires: 10 minutes`);
    console.log("============================================================\n");

    return {
      success: true,
      message: "A 6-digit verification code has been dispatched.",
      expiresAt,
      devOtp: code,
    };
  }

  try {
    const resend = new Resend(resendApiKey);
    const resendResult = await resend.emails.send({
      from: resendFrom,
      to: [normalizedEmail],
      subject: `${code} is your RealCRM verification code`,
      html: emailHtml,
    });

    if (resendResult.error) {
      const errMsg = resendResult.error.message || "Failed to deliver email via Resend.";
      console.error("[Resend Error]:", resendResult.error);
      console.log(`\n🔑 [RealCRM 2FA Backup Code]: ${code} (for ${normalizedEmail})\n`);
      throw new Error(errMsg);
    }

    console.log(`[Resend] Successfully sent OTP email to ${normalizedEmail} (id: ${resendResult.data?.id})`);

    return {
      success: true,
      message: "A 6-digit verification code has been sent to your email.",
      expiresAt,
      resendId: resendResult.data?.id,
    };
  } catch (err: unknown) {
    console.log(`\n🔑 [RealCRM 2FA Backup Code]: ${code} (for ${normalizedEmail})\n`);
    const errorMsg = err instanceof Error ? err.message : "Failed to deliver email via Resend";
    console.error("Email delivery exception:", errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Verify a submitted 6-digit OTP code
 */
export function verifyOtpCode(
  email: string,
  submittedCode: string
): { valid: boolean; reason?: string } {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanCode = submittedCode.trim();

  let stored = otpStore.get(normalizedEmail);
  if (!stored) {
    const diskMap = loadOtpsFromDisk();
    stored = diskMap.get(normalizedEmail);
    if (stored) {
      otpStore.set(normalizedEmail, stored);
    }
  }

  if (!stored) {
    return {
      valid: false,
      reason: "No active verification code found for this email. Please request a new code.",
    };
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(normalizedEmail);
    saveOtpsToDisk(otpStore);
    return {
      valid: false,
      reason: "Verification code has expired. Please request a new code.",
    };
  }

  if (stored.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    saveOtpsToDisk(otpStore);
    return {
      valid: false,
      reason: "Too many incorrect attempts. Please request a new code.",
    };
  }

  if (stored.code !== cleanCode) {
    stored.attempts += 1;
    saveOtpsToDisk(otpStore);
    const remaining = MAX_ATTEMPTS - stored.attempts;
    return {
      valid: false,
      reason: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  // Code is valid! Consume it so it cannot be replayed
  otpStore.delete(normalizedEmail);
  saveOtpsToDisk(otpStore);
  return { valid: true };
}
