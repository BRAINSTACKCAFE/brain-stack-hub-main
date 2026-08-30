import { createFileRoute } from "@tanstack/react-router";
import { getDataPlans } from "@/lib/arewagate.functions";

export const Route = createFileRoute("/api/arewagate/data/details")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const network = url.searchParams.get("network");

        if (!network) {
          return new Response(JSON.stringify({ error: "Network parameter is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const plans = await getDataPlans({ network });
        return new Response(JSON.stringify(plans), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }
});
