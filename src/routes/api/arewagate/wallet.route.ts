import { createFileRoute } from '@tanstack/react-router';
import { getWalletBalance } from "@/lib/arewagate.functions";

/**
 * API routes for Arewagate Wallet services
 */

export const Route = createFileRoute("/api/arewagate/wallet")({
  server: {
    handlers: {
      // GET /api/arewagate/wallet/balance - Get wallet balance
      GET: async ({ request }) => {
        const balance = await getWalletBalance({});
        return new Response(JSON.stringify(balance), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }
});
