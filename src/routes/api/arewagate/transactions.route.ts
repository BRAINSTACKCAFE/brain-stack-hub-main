import { createFileRoute } from '@tanstack/react-router';
import { listTransactions, getTransactionDetails } from "@/lib/arewagate.functions";
import { z } from "zod";

/**
 * API routes for Arewagate Transaction services
 */

export const Route = createFileRoute("/api/arewagate/transactions")({
  server: {
    handlers: {
      // GET /api/arewagate/transactions?perPage=10&category=airline&status=completed - List transactions
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const perPage = url.searchParams.get("perPage");
        const category = url.searchParams.get("category");
        const status = url.searchParams.get("status");

        const params: any = {};
        if (perPage) params.perPage = parseInt(perPage);
        if (category) params.category = category;
        if (status) params.status = status;

        const transactions = await listTransactions(params);
        return new Response(JSON.stringify(transactions), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },

      // GET /api/arewagate/transactions/:transactionId - Get transaction details
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const pathParts = url.pathname.split("/");
        const transactionId = pathParts[pathParts.length - 1];

        if (!transactionId) {
          return new Response(JSON.stringify({ error: "Transaction ID is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const transaction = await getTransactionDetails({ transactionId });
        return new Response(JSON.stringify(transaction), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }
});
