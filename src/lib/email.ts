import "server-only";
import nodemailer from "nodemailer";
import {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  hasSMTP,
  ADMIN_EMAIL,
  NEXT_PUBLIC_SITE_URL,
} from "./server-config";
import { getSupabase } from "./supabase-server";
import type { ServicePackage } from "./services";

interface EmailOrder {
  publicOrderId: string;
  service: ServicePackage;
  tokenSymbol: string;
  amountHuman: string;
  receiveAddress: string;
  txHash: string;
  fromAddress: string;
  customerName?: string;
  contactMethod?: string;
  contactValue?: string;
  brief?: string;
}

/** Build and lazily cache the SMTP transporter. */
let _transporter: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter | null {
  if (!hasSMTP) return null;
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return _transporter;
}

function siteUrl(): string {
  return NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/** Log an email event to Supabase (fire-and-forget, never throws). */
async function logEmailEvent(
  orderId: string | null,
  to: string,
  subject: string,
  status: "sent" | "failed",
  error?: string,
) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("email_events").insert({
      order_id: orderId,
      to_address: to,
      subject,
      status,
      error: error || null,
    });
  } catch {
    // swallow — email logging is best-effort
  }
}

export async function sendOrderConfirmationEmail(order: EmailOrder): Promise<void> {
  const to = order.contactValue || "";
  const subject = `QuestPay — Payment confirmed for ${order.service.name}`;
  const verifyUrl = `${siteUrl()}/verify/${order.txHash}`;
  const orderUrl = `${siteUrl()}/orders/${order.publicOrderId}`;

  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; background: #0B0D14; color: #e2e8f0; padding: 32px; border-radius: 16px;">
      <h1 style="color: #39D0FF; font-size: 22px; margin: 0 0 16px;">⚔️ QuestPay Payment Confirmed</h1>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        Your payment for <strong style="color: #fff;">${order.service.name}</strong> has been verified on Polygon mainnet.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #64748b;">Service</td><td style="padding: 8px 0; color: #fff;">${order.service.name}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Amount</td><td style="padding: 8px 0; color: #fff;">${order.amountHuman} ${order.tokenSymbol}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Transaction</td><td style="padding: 8px 0; color: #39D0FF; font-family: monospace; word-break: break-all;">${order.txHash}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">From</td><td style="padding: 8px 0; color: #fff; font-family: monospace; word-break: break-all;">${order.fromAddress}</td></tr>
      </table>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background: #39D0FF; color: #000; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 700;">Verify on-chain →</a>
        <a href="${orderUrl}" style="display: inline-block; background: #1A1D2B; color: #e2e8f0; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 700; margin-left: 8px;">View order →</a>
      </p>
      <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;" />
      <p style="color: #475569; font-size: 12px;">Community-built project; not an official Bitcoin.com product.</p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    await logEmailEvent(null, to || ADMIN_EMAIL || "(no recipient)", subject, "failed", "SMTP not configured");
    return;
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: to || ADMIN_EMAIL,
      subject,
      html,
    });
    await logEmailEvent(null, to || ADMIN_EMAIL, subject, "sent");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEmailEvent(null, to || ADMIN_EMAIL, subject, "failed", msg);
  }
}

export async function sendAdminNotificationEmail(order: EmailOrder): Promise<void> {
  if (!ADMIN_EMAIL) return;
  const subject = `New QuestPay order: ${order.service.name} — ${order.amountHuman} ${order.tokenSymbol}`;
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; background: #0B0D14; color: #e2e8f0; padding: 32px; border-radius: 16px;">
      <h1 style="color: #7C5CFF; font-size: 22px; margin: 0 0 16px;">⚔️ New Paid Order</h1>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #64748b;">Order ID</td><td style="padding: 8px 0; color: #fff; font-family: monospace;">${order.publicOrderId}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Service</td><td style="padding: 8px 0; color: #fff;">${order.service.name} ($${order.service.usd})</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Customer</td><td style="padding: 8px 0; color: #fff;">${order.customerName || "—"}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Contact</td><td style="padding: 8px 0; color: #fff;">${order.contactMethod || ""}: ${order.contactValue || "—"}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Amount</td><td style="padding: 8px 0; color: #fff;">${order.amountHuman} ${order.tokenSymbol}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Tx</td><td style="padding: 8px 0; color: #39D0FF; font-family: monospace; word-break: break-all;">${order.txHash}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Brief</td><td style="padding: 8px 0; color: #fff; white-space: pre-wrap;">${order.brief || "—"}</td></tr>
      </table>
      <p style="color: #475569; font-size: 12px;">Community-built project; not an official Bitcoin.com product.</p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    await logEmailEvent(null, ADMIN_EMAIL, subject, "failed", "SMTP not configured");
    return;
  }

  try {
    await transporter.sendMail({ from: SMTP_FROM, to: ADMIN_EMAIL, subject, html });
    await logEmailEvent(null, ADMIN_EMAIL, subject, "sent");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEmailEvent(null, ADMIN_EMAIL, subject, "failed", msg);
  }
}
