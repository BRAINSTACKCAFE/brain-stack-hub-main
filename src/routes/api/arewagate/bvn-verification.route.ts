import { createFileRoute } from '@tanstack/react-router';
import { verifyBVN } from "@/lib/arewagate.functions";
import { z } from "zod";

/**
 * API routes for GetID BVN Verification service
 */

export const Route = createFileRoute("/api/arewagate/bvn-verification")({
  server: {
    handlers: {
      // POST /api/arewagate/bvn-verification - Verify BVN
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { bvn } = z.object({
            bvn: z.string().length(11, "BVN must be exactly 11 digits")
          }).parse(body);

          const result = await verifyBVN({ bvn });
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("BVN verification error:", error);
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
