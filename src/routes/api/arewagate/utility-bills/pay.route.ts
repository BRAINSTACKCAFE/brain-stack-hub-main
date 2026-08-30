import { createFileRoute } from "@tanstack/react-router";
import { payUtilityBill } from "@/lib/arewagate.functions";
import { z } from "zod";

/**
 * API route for Arewagate Utility Bill payments (electricity, TV subscription)
 */

export const Route = createFileRoute("/api/arewagate/utility-bills/pay")({
  server: {
    handlers: {
      // POST /api/arewagate/utility-bills/pay - Pay a utility bill
      POST: async ({ request }) => {
        const body = await request.json();
        const { category, provider, customerId, amount } = z.object({
          category: z.string().min(1, "Category is required"),
          provider: z.string().min(1, "Provider is required"),
          customerId: z.string().min(1, "Customer ID is required"),
          amount: z.number().positive("Amount must be positive")
        }).parse(body);

        const result = await payUtilityBill({
          data: { category, provider, customerId, amount }
        });

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }
});