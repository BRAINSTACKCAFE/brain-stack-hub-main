import { createFileRoute } from "@tanstack/react-router";
import { verifyNIN } from "@/lib/arewagate.functions";
import { z } from "zod";

/**
 * API routes for GetID NIN Verification service
 */

export const Route = createFileRoute("/api/arewagate/nin-verification")({
  server: {
    handlers: {
      // POST /api/arewagate/nin-verification - Verify NIN
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { nin } = z.object({
            nin: z.string().length(11, "NIN must be exactly 11 digits")
          }).parse(body);

          const result = await verifyNIN({ nin });
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("NIN verification error:", error);
          return new Response(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error"
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
      }
    }
  }
});
