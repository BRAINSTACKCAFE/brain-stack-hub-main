import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendEmail, wrapEmail } from "./email.server";

export async function markPaymentSuccessful(
  paymentReference: string,
  amountPaid: number,
  metadata?: { kind?: string; userId?: string } | null,
) {
  const paidAt = new Date().toISOString();

  if (paymentReference.startsWith("BSCWAL-")) {
    const userId = metadata?.userId;
    if (!userId) return null;
    const { creditWallet } = await import("./wallet.server");
    try {
      await creditWallet(userId, amountPaid, "Wallet funding", paymentReference);
    } catch (error) {
      // duplicate reference means the webhook already credited this payment
      if (!(error instanceof Error) || !error.message.includes("duplicate")) throw error;
    }
    return { kind: "wallet" as const, id: userId };
  }

const { data: request } = await supabaseAdmin
  .from("service_requests")
  .update({ payment_status: "paid", amount_paid: amountPaid, paid_at: paidAt, status: "payment_confirmed" })
  .eq("payment_reference", paymentReference)
  .neq("payment_status", "paid")
  .select("id, reference, service_name, user_id")
  .maybeSingle();

  if (request) {
    await notify(request.user_id, `Payment confirmed — ${request.reference}`, request.service_name, amountPaid);
    return { kind: "request" as const, id: request.id };
  }

  const { data: order } = await supabaseAdmin
    .from("shop_orders")
    .update({ payment_status: "paid", paid_at: paidAt, status: "payment_confirmed" })
    .eq("payment_reference", paymentReference)
    .select("id, reference, user_id")
    .maybeSingle();

  if (order) {
    await notify(order.user_id, `Payment confirmed — ${order.reference}`, "Shop order", amountPaid);
    return { kind: "order" as const, id: order.id };
  }

  return null;
}

async function notify(userId: string | null, subject: string, item: string, amount: number) {
  if (!userId) return;
  const { data: profile } = await (supabaseAdmin as any)
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.email) return;

  await sendEmail({
    to: profile.email,
    subject,
    html: wrapEmail(
      subject,
      `<p style="color:#16233b">Hello ${profile.full_name || "there"},</p>
       <p style="color:#16233b">We have received your payment of <strong>₦${amount.toLocaleString()}</strong> for <strong>${item}</strong>.</p>
       <p style="color:#444">Processing has started. You can follow progress from your dashboard.</p>`,
    ),
  });
}