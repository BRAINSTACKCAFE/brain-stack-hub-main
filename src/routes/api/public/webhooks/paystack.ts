import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/paystack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { createHmac, timingSafeEqual } = await import("node:crypto");

        const secret = process.env["PAYSTACK_SECRET_KEY"];
        if (!secret) return new Response("Not configured", { status: 503 });

        const body = await request.text();
        const signature = request.headers.get("x-paystack-signature") ?? "";
        const expected = createHmac("sha512", secret).update(body).digest("hex");
        const sig = Buffer.from(signature);
        const exp = Buffer.from(expected);
        if (sig.length !== exp.length || !timingSafeEqual(sig, exp)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const event = JSON.parse(body) as {
          event?: string;
          data?: {
            reference?: string;
            amount?: number;
            status?: string;
            metadata?: { kind?: string; userId?: string };
          };
        };

        if (event.data?.reference) {
          const ref = event.data.reference;
          const amount = Math.round((event.data.amount ?? 0) / 100);
          const metadata = event.data.metadata ?? null;

          if (event.event === "charge.success") {
            const { markPaymentSuccessful } = await import("@/lib/payments.server");
            await markPaymentSuccessful(ref, amount, metadata);
            // Update payment attempt to success
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              await supabaseAdmin
                .from("payment_attempts")
                .update({ status: "success" })
                .eq("reference", ref)
                .throwOnError();
            } catch (e) {
              console.error("Failed to update payment attempt success", e);
            }
          } else if (event.event === "charge.failed") {
            // Update payment attempt to failed
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              await supabaseAdmin
                .from("payment_attempts")
                .update({ status: "failed" })
                .eq("reference", ref)
                .throwOnError();
            } catch (e) {
              console.error("Failed to update payment attempt failed", e);
            }
          }
        }

        return new Response("ok");
      },
    },
  },
});