import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface WalletTransaction {
  id: string;
  direction: "credit" | "debit";
  amount: number;
  balance_after: number;
  reason: string;
  reference: string | null;
  created_at: string;
}

export const getWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: wallet }, { data: transactions }] = await Promise.all([
      context.supabase.from("wallets").select("balance").eq("user_id", context.userId).maybeSingle(),
      context.supabase
        .from("wallet_transactions")
        .select("id, direction, amount, balance_after, reason, reference, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    return {
      balance: Number(wallet?.balance ?? 0),
      transactions: (transactions ?? []) as unknown as WalletTransaction[],
    };
  });

export const fundWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        amount: z.number().int().min(200).max(2000000),
        callbackUrl: z.string().url(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const secret = process.env["PAYSTACK_SECRET_KEY"];
    if (!secret) throw new Error("Payments are not configured yet.");

    const email = (context.claims as { email?: string } | null)?.email;
    if (!email) throw new Error("No email on your account.");

    const reference = `BSCWAL-${context.userId.slice(0, 8)}-${Date.now()}`;

    // Create pending payment attempt record for wallet funding
    await supabaseAdmin
      .from("payment_attempts")
      .insert({
        reference,
        amount: data.amount,
        kind: "wallet",
        user_id: context.userId,
        status: "pending",
        metadata: { kind: "wallet", userId: context.userId },
      })
      .throwOnError();

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount: data.amount * 100,
        reference,
        callback_url: data.callbackUrl,
        metadata: { kind: "wallet", userId: context.userId },
      }),
    });

    const payload = (await res.json()) as {
      status?: boolean;
      data?: { authorization_url?: string };
    };

    if (!res.ok || !payload.status || !payload.data?.authorization_url) {
      // Mark attempt as failed
      await supabaseAdmin
        .from("payment_attempts")
        .update({ status: "failed" })
        .eq("reference", reference)
        .throwOnError();
      throw new Error("Could not start wallet funding. Please try again.");
    }

    return { authorizationUrl: payload.data.authorization_url, reference };
  });

export const payRequestFromWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("service_requests")
      .select("id, reference, service_name, amount, payment_status")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Request not found.");
    if (row.payment_status === "paid") throw new Error("This request is already paid.");
    if (!row.amount) throw new Error("This service is priced on request — contact us on WhatsApp.");

    const { payFromWallet } = await import("./wallet.server");
    return payFromWallet({
      userId: context.userId,
      amount: row.amount,
      requestId: row.id,
      reference: row.reference,
      serviceName: row.service_name,
    });
  });

/**
 * Debit the caller's own wallet for a service that is being paid for
 * immediately client-side (e.g. an Arewagate airtime/data/verification
 * purchase), rather than through the `create_request_and_debit` RPC used
 * by regular priced services.
 *
 * SECURITY: userId is intentionally NOT part of the input schema. It is
 * always taken from `context.userId`, which `requireSupabaseAuth` derives
 * from the caller's own session. A client can never specify whose wallet
 * gets debited — this is what fixes "Cannot debit wallet for another
 * user": there is no longer any client-supplied id for that check to
 * reject.
 */
export const debitWalletSecure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        amount: z.number().positive("Amount must be positive"),
        requestId: z.string().min(1, "Request ID is required"),
        reference: z.string().min(1, "Reference is required"),
        serviceName: z.string().min(1, "Service name is required"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { payFromWallet } = await import("./wallet.server");
    return payFromWallet({
      userId: context.userId,
      amount: data.amount,
      requestId: data.requestId,
      reference: data.reference,
      serviceName: data.serviceName,
    });
  });