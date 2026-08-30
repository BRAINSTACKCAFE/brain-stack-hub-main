import { createFileRoute } from "@tanstack/react-router";
import { verifyCAC } from "@/lib/arewagate.functions";
import { z } from "zod";

/**
 * API routes for Arewagate CAC Verification service
 */

export const Route = createFileRoute("/api/arewagate/cac-verification")({
  server: {
    handlers: {
      // POST /api/arewagate/cac-verification - Verify CAC
      POST: async ({ request }) => {
        const body = await request.json();
        const { rcNumber } = z.object({
          rcNumber: z.string().min(1, "RC number is required")
        }).parse(body);

        const result = await verifyCAC({ rcNumber });
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }
});
