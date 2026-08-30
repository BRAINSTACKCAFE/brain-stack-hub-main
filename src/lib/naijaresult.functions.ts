import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

interface NaijaResultProduct {
  card_type_id: string;
  card_name: string;
  unit_amount: string;
  availability: string;
}

interface NaijaResultAccountResponse {
  firstname: string;
  lastname: string;
  wallet_balance: string;
}

export const getNaijaResultProducts = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = process.env.NAIJARESULT_API_TOKEN;
    if (!token) {
      throw new Error("NaijaResultPins API token is not configured");
    }

    const response = await fetch("https://www.naijaresultpins.com/api/v1", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `NaijaResultPins API request failed: ${response.status} - ${errorText}`
      );
    }

    const result: NaijaResultProduct[] = await response.json();
    return { success: true, data: result };
  });

export const getNaijaResultProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        slug: z.string(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const token = process.env.NAIJARESULT_API_TOKEN;
    if (!token) {
      throw new Error("NaijaResultPins API token is not configured");
    }

    // Map slug to card_type_id as per NaijaResultPins sample data
    const slugToCardTypeId: Record<string, string> = {
      waec: "1",
      neco: "2",
      nabteb: "3",
    };

    const cardTypeId = slugToCardTypeId[data.slug.toLowerCase()];
    if (!cardTypeId) {
      throw new Error(`Unsupported slug: ${data.slug}`);
    }

    // Fetch all products and find matching card_type_id
    const productsResponse = await fetch(
      "https://www.naijaresultpins.com/api/v1",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!productsResponse.ok) {
      const errorText = await productsResponse.text();
      throw new Error(
        `NaijaResultPins API request failed: ${productsResponse.status} - ${errorText}`
      );
    }

    const products: NaijaResultProduct[] = await productsResponse.json();
    const product = products.find((p) => p.card_type_id === cardTypeId);
    if (!product) {
      throw new Error(`Product not found for slug: ${data.slug}`);
    }

    return { success: true, data: product };
  });

export const purchaseNaijaResultCard = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        card_type_id: z.string(),
        quantity: z
          .string()
          .refine((val) => {
            const num = parseInt(val, 10);
            return !isNaN(num) && num > 0 && num <= 100;
          }, "Quantity must be between 1 and 100"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const token = process.env.NAIJARESULT_API_TOKEN;
    if (!token) {
      throw new Error("NaijaResultPins API token is not configured");
    }

    const response = await fetch(
      "https://www.naijaresultpins.com/api/v1/exam-card/buy",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          card_type_id: data.card_type_id,
          quantity: data.quantity,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `NaijaResultPins API request failed: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();
    return { success: true, data: result };
  });

export const getNaijaResultAccountInfo = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = process.env.NAIJARESULT_API_TOKEN;
    if (!token) {
      throw new Error("NaijaResultPins API token is not configured");
    }

    const response = await fetch("https://www.naijaresultpins.com/api/v1/account", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `NaijaResultPins API request failed: ${response.status} - ${errorText}`
      );
    }

    const result: NaijaResultAccountResponse[] = await response.json();
    return { success: true, data: result };
  });