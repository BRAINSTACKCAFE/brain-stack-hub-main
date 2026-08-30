import { createFileRoute } from "@tanstack/react-router";
import { getNaijaResultAccountInfo } from "@/lib/naijaresult.functions";

/**
 * API route for NaijaResultPins account balance
 */

export const Route = createFileRoute("/api/arewagate/scratch-card/balance")({
  server: {
    handlers: {
      // GET /api/arewagate/scratch-card/balance - Get account balance
      GET: async () => {
        try {
          const result = await getNaijaResultAccountInfo();
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (error) {
          console.error("NaijaResultPins balance error:", error);
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