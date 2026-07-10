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
    await sb.from("questpay_email_events").insert({
      order_id: orderId,
      site: "questpay",
      email_type: subject.includes("SMTP test") ? "studio_test" : subject.includes("order created") || subject.includes("New QuestPay brief") ? "order_created" : "payment_notification",
      recipient: to,
      status,
      provider_message_id: null,
      error_message: error || null,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    });
  } catch {
    // swallow — email logging is best-effort
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

export async function sendOrderCreatedEmails(order: {
  id: string;
  publicOrderId: string;
  serviceName: string;
  amountHuman: string;
  tokenSymbol: string;
  customerName: string;
  contactMethod: string;
  contactValue: string;
  brief: string;
}): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;
  const payUrl = `${siteUrl()}/pay/${encodeURIComponent(order.publicOrderId)}`;
  const studioUrl = `${siteUrl()}/studio/orders/${encodeURIComponent(order.id)}`;
  const recipient = order.contactMethod.toLowerCase().includes("email") && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(order.contactValue) ? order.contactValue : "";
  const messages = [
    ...(ADMIN_EMAIL ? [{ to: ADMIN_EMAIL, type: "order_created_creator", subject: `New QuestPay brief — ${order.serviceName} — ${order.publicOrderId}`, html: `<h1>New QuestPay brief</h1><p><b>Client:</b> ${escapeHtml(order.customerName)}</p><p><b>Contact:</b> ${escapeHtml(order.contactMethod)} — ${escapeHtml(order.contactValue)}</p><p><b>Payment:</b> ${escapeHtml(order.amountHuman)} ${escapeHtml(order.tokenSymbol)}</p><p><b>Brief:</b></p><p>${escapeHtml(order.brief)}</p><p><a href="${studioUrl}">Open private Studio order</a></p>` }] : []),
    ...(recipient ? [{ to: recipient, type: "order_created_client", subject: "QuestPay order created — payment pending", html: `<h1>QuestPay order created</h1><p>Order <b>${escapeHtml(order.publicOrderId)}</b> is awaiting payment.</p><p>${escapeHtml(order.serviceName)} · ${escapeHtml(order.amountHuman)} ${escapeHtml(order.tokenSymbol)} · Polygon mainnet</p><p><a href="${payUrl}">Continue to secure payment instructions</a></p><p>Never share a seed phrase or private key.</p>` }] : []),
  ];
  for (const message of messages) {
    try {
      const result = await transporter.sendMail({ from: SMTP_FROM, to: message.to, subject: message.subject, html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#0B0D14;color:#e2e8f0;padding:28px">${message.html}<hr style="border-color:#334155"><p style="color:#64748b;font-size:12px">Community-built project; not an official Bitcoin.com product.</p></div>` });
      await logEmailEvent(order.id, message.to, message.subject, "sent");
      void result;
    } catch (error: unknown) {
      await logEmailEvent(order.id, message.to, message.subject, "failed", error instanceof Error ? error.message : "SMTP error");
    }
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
        Your payment for <strong style="color: #fff;">${escapeHtml(order.service.name)}</strong> has been verified on Polygon mainnet.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #64748b;">Service</td><td style="padding: 8px 0; color: #fff;">${escapeHtml(order.service.name)}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Amount</td><td style="padding: 8px 0; color: #fff;">${escapeHtml(order.amountHuman)} ${escapeHtml(order.tokenSymbol)}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Transaction</td><td style="padding: 8px 0; color: #39D0FF; font-family: monospace; word-break: break-all;">${escapeHtml(order.txHash)}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">From</td><td style="padding: 8px 0; color: #fff; font-family: monospace; word-break: break-all;">${escapeHtml(order.fromAddress)}</td></tr>
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

export async function sendStudioTestEmail(): Promise<boolean> {
  if (!ADMIN_EMAIL) return false;
  const subject = "QuestPay Studio — SMTP test";
  const transporter = getTransporter();
  if (!transporter) {
    await logEmailEvent(null, ADMIN_EMAIL, subject, "failed", "SMTP not configured");
    return false;
  }
  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: ADMIN_EMAIL,
      subject,
      text: "QuestPay Studio SMTP is working. Community-built project; not an official Bitcoin.com product.",
      html: '<div style="font-family:Inter,sans-serif;background:#0B0D14;color:#e2e8f0;padding:28px"><h1 style="color:#39D0FF">QuestPay Studio SMTP works</h1><p>This controlled diagnostic was sent to the allowlisted administrator.</p><p style="color:#64748b;font-size:12px">Community-built project; not an official Bitcoin.com product.</p></div>',
    });
    await logEmailEvent(null, ADMIN_EMAIL, subject, "sent");
    return true;
  } catch (error: unknown) {
    await logEmailEvent(null, ADMIN_EMAIL, subject, "failed", error instanceof Error ? error.message : "SMTP error");
    return false;
  }
}

export async function sendAdminNotificationEmail(order: EmailOrder): Promise<void> {
  if (!ADMIN_EMAIL) return;
  const subject = `New QuestPay order: ${order.service.name} — ${order.amountHuman} ${order.tokenSymbol}`;
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; background: #0B0D14; color: #e2e8f0; padding: 32px; border-radius: 16px;">
      <h1 style="color: #7C5CFF; font-size: 22px; margin: 0 0 16px;">⚔️ New Paid Order</h1>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #64748b;">Order ID</td><td style="padding: 8px 0; color: #fff; font-family: monospace;">${escapeHtml(order.publicOrderId)}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Service</td><td style="padding: 8px 0; color: #fff;">${order.service.name} ($${order.service.usd})</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Customer</td><td style="padding: 8px 0; color: #fff;">${escapeHtml(order.customerName || "—")}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Contact</td><td style="padding: 8px 0; color: #fff;">${escapeHtml(order.contactMethod || "")}: ${escapeHtml(order.contactValue || "—")}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Amount</td><td style="padding: 8px 0; color: #fff;">${escapeHtml(order.amountHuman)} ${escapeHtml(order.tokenSymbol)}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Tx</td><td style="padding: 8px 0; color: #39D0FF; font-family: monospace; word-break: break-all;">${escapeHtml(order.txHash)}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Brief</td><td style="padding: 8px 0; color: #fff; white-space: pre-wrap;">${escapeHtml(order.brief || "—")}</td></tr>
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
