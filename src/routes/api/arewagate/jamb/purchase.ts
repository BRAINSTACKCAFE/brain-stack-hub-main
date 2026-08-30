import { createFileRoute } from "@tanstack/react-router";
import { purchaseJAMBService } from "@/lib/arewagate.functions";
import { z } from "zod";

export const Route = createFileRoute("/api/arewagate/jamb/purchase")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        const { quantity } = z.object({
          quantity: z.number().int().min(1, "Quantity must be at least 1")
        }).parse(body);

        const result = await purchaseJAMBService({ quantity });
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }
});
