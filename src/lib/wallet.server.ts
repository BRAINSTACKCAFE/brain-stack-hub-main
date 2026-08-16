import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function creditWallet(userId: string, amount: number, reason: string, reference: string) {
  const { error } = await supabaseAdmin.rpc("credit_wallet", {
    _user_id: userId,
    _amount: amount,
    _reason: reason,
    _reference: reference,
  });
  if (error) throw new Error(error.message);
}

export async function payFromWallet(input: {
  userId: string;
  amount: number;
  requestId: string;
  reference: string;
  serviceName: string;
}) {
  const { error: debitError } = await supabaseAdmin.rpc("debit_wallet", {
    _user_id: input.userId,
    _amount: input.amount,
    _reason: `${input.serviceName} (${input.reference})`,
    _reference: `WALLETPAY-${input.requestId}`,
  });
  if (debitError) {
    throw new Error(
      debitError.message.includes("Insufficient")
        ? "Insufficient wallet balance — fund your wallet first."
        : debitError.message,
    );
  }

  const { error } = await supabaseAdmin
    .from("service_requests")
    .update({
      payment_status: "paid",
      amount_paid: input.amount,
      paid_at: new Date().toISOString(),
      status: "payment_confirmed",
    })
    .eq("id", input.requestId);
  if (error) throw new Error(error.message);

  return { ok: true as const };
}
