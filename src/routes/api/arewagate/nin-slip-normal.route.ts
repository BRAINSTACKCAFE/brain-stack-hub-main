import { createFileRoute } from "@tanstack/react-router";
import { verifyNIN } from "@/lib/arewagate.functions";
import { z } from "zod";

/**
 * API routes for NIN Slip Normal service
 */

export const Route = createFileRoute("/api/arewagate/nin-slip-normal")({
  server: {
    handlers: {
      // POST /api/arewagate/nin-slip-normal - Validate NIN for slip generation
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { nin } = z.object({
            nin: z.string().length(11, "NIN must be exactly 11 digits")
          }).parse(body);

          // Validate NIN with GetID API
          const result = await verifyNIN({ nin });
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("NIN slip normal validation error:", error);
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