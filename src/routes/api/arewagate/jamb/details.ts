import { createFileRoute } from "@tanstack/react-router";
import { getJAMBServiceDetails } from "@/lib/arewagate.functions";

export const Route = createFileRoute("/api/arewagate/jamb/details")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const details = await getJAMBServiceDetails({});
        return new Response(JSON.stringify(details), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }
});
