import { createFileRoute } from '@tanstack/react-router';
import {
  getNaijaResultProducts,
  getNaijaResultProductBySlug,
  purchaseNaijaResultCard,
} from "@/lib/naijaresult.functions";
import { z } from "zod";

/**
 * API routes for NaijaResultPins Exam Scratch Card services
 */

export const Route = createFileRoute("/api/arewagate/scratch-card")({
  server: {
    handlers: {
      // GET /api/arewagate/scratch-card - List all available exam scratch card products
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const slug = url.searchParams.get("slug");

        if (slug) {
          // Detailed product request
          try {
            const result = await getNaijaResultProductBySlug({ slug });
            return new Response(JSON.stringify(result), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          } catch (error) {
            return new Response(
              JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" }
              }
            );
          }
        } else {
          // List all products
          try {
            const result = await getNaijaResultProducts();
            return new Response(JSON.stringify(result), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          } catch (error) {
            return new Response(
              JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" }
              }
            );
          }
        }
      },

      // POST /api/arewagate/scratch-card/purchase - Purchase scratch card
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { slug, quantity } = z.object({
            slug: z.string().min(1, "Slug is required"),
            quantity: z.string().refine((val) => { const num = parseInt(val, 10); return !isNaN(num) && num > 0 && num <= 100; }, "Quantity must be between 1 and 100")
          }).parse(body);

          // map slug to card_type_id
          const slugToCardTypeId: Record<string, string> = {
            waec: "1",
            neco: "2",
            nabteb: "3",
          };
          const cardTypeId = slugToCardTypeId[slug.toLowerCase()];
          if (!cardTypeId) {
            return new Response(
              JSON.stringify({ error: `Unsupported slug: ${slug}` }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" }
              }
            );
          }

          const result = await purchaseNaijaResultCard({
            card_type_id: cardTypeId,
            quantity,
          });
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
      }
    }
  }
});
