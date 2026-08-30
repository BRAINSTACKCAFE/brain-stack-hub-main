import { createFileRoute } from "@tanstack/react-router";
import { purchaseData } from "@/lib/arewagate.functions";
import { z } from "zod";

export const Route = createFileRoute("/api/arewagate/data/purchase")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        const { phone, network, plan } = z.object({
          phone: z.string().regex(/^(0|\+234)?[789]\d{9}$/, "Invalid phone number"),
          network: z.enum(["mtn", "glo", "airtel", "9mobile", "etisalat"]),
          plan: z.string().min(1, "Plan is required"),
        }).parse(body);

        const result = await purchaseData({ phone, network, plan });
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }
});
