import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { getAirtimeNetworks, purchaseAirtime } from '@/lib/arewagate.functions'
export const Route = createFileRoute("/api/arewagate/airtime")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const networks = await getAirtimeNetworks({});
          return new Response(JSON.stringify(networks), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("GET /api/arewagate/airtime failed:", err);
          return new Response(
            JSON.stringify({
              error: err instanceof Error ? err.message : "Unknown error",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { phone, network, amount } = z
            .object({
              phone: z.string().regex(/^(0|\+234)?[789]\d{9}$/, "Invalid phone number"),
              network: z.enum(["mtn", "glo", "airtel", "9mobile", "etisalat"]),
              amount: z.number().int().min(50, "Amount must be at least ₦50"),
            })
            .parse(body);

          const result = await purchaseAirtime({ data: { phone, network, amount } });
          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("POST /api/arewagate/airtime failed:", err);
          const message = err instanceof z.ZodError
            ? err.issues.map((i) => i.message).join(", ")
            : err instanceof Error
            ? err.message
            : "Unknown error";
          return new Response(JSON.stringify({ error: message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});