import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  kind: z.enum(["request", "order"]),
  id: z.string().uuid(),
  callbackUrl: z.string().url(),
});

export const initializePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const secret = process.env["PAYSTACK_SECRET_KEY"];
    if (!secret) throw new Error("Payments are not configured yet.");

    let amount = 0;
    let label = "";

    if (data.kind === "request") {
      const { data: row, error } = await context.supabase
        .from("service_requests")
        .select("id, reference, service_name, amount, payment_status")
        .eq("id", data.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) throw new Error("Request not found.");
      if (row.payment_status === "paid") throw new Error("This request is already paid.");
      if (!row.amount) throw new Error("This service is priced on request — contact us on WhatsApp.");
      amount = row.amount;
      label = `${row.service_name} (${row.reference})`;
    } else {
      const { data: row, error } = await context.supabase
        .from("shop_orders")
        .select("id, reference, total_amount, payment_status")
        .eq("id", data.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) throw new Error("Order not found.");
      if (row.payment_status === "paid") throw new Error("This order is already paid.");
      amount = row.total_amount;
      label = `Shop order ${row.reference ?? row.id}`;
    }

    const email = (context.claims as { email?: string } | null)?.email;
    if (!email) throw new Error("No email on your account.");

    const paymentReference = `BSCPAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount: amount * 100,
        reference: paymentReference,
        callback_url: data.callbackUrl,
        metadata: { kind: data.kind, id: data.id, label },
      }),
    });

    const payload = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string };
    };

    if (!res.ok || !payload.status || !payload.data?.authorization_url) {
      console.error("Paystack init failed", res.status, payload.message);
      throw new Error("Could not start payment. Please try again.");
    }

    const table = data.kind === "request" ? "service_requests" : "shop_orders";
    const { error: updateError } = await context.supabase
      .from(table)
      .update({ payment_reference: paymentReference, payment_status: "pending" })
      .eq("id", data.id);
    if (updateError) throw new Error(updateError.message);

    return { authorizationUrl: payload.data.authorization_url, reference: paymentReference };
  });

export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ reference: z.string().min(4).max(100) }).parse(input))
  .handler(async ({ data }) => {
    const secret = process.env["PAYSTACK_SECRET_KEY"];
    if (!secret) throw new Error("Payments are not configured yet.");

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const payload = (await res.json()) as {
      status?: boolean;
      data?: { status?: string; amount?: number; metadata?: { kind?: string; userId?: string } };
    };

    if (!payload.status || payload.data?.status !== "success") return { paid: false };

    const { markPaymentSuccessful } = await import("./payments.server");
    await markPaymentSuccessful(
      data.reference,
      Math.round((payload.data.amount ?? 0) / 100),
      payload.data.metadata ?? null,
    );
    return { paid: true };
  });