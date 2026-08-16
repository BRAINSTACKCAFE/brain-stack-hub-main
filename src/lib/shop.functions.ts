import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string | null;
  price: number | null;
  condition: string;
  specs: string[];
  image_url: string | null;
  in_stock: boolean;
  waybill: boolean;
}

export interface OrderItem {
  id: string;
  product_slug: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface OrderSummary {
  id: string;
  reference: string | null;
  status: string;
  payment_status: string;
  delivery_method: string;
  delivery_address: string | null;
  total_amount: number;
  created_at: string;
  shop_order_items: OrderItem[];
}

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("shop_products")
    .select("id, slug, name, category, summary, price, condition, specs, image_url, in_stock, waybill")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listProducts", error.message);
    return { products: [] as ShopProduct[] };
  }
  return { products: (data ?? []) as ShopProduct[] };
});

const createOrderSchema = z.object({
  deliveryMethod: z.enum(["pickup", "waybill"]),
  deliveryAddress: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        name: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
        unitPrice: z.number().int().min(0),
      }),
    )
    .min(1)
    .max(30),
});

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const reference = `BSC-SHP-${Math.floor(100000 + Math.random() * 900000)}`;

    // Server recalculates the total from shop_products.price — the client's
    // unitPrice is never trusted. Wallet debit + order creation happen
    // atomically inside create_order_and_debit, so a failure at any step
    // rolls back everything (no partial charge, no orphaned order).
    const { data: result, error } = await context.supabase.rpc("create_order_and_debit", {
      p_user_id: context.userId,
      p_reference: reference,
      p_delivery_method: data.deliveryMethod,
      p_delivery_address: data.deliveryAddress ?? null,
      p_notes: data.notes ?? null,
      p_items: data.items.map((i) => ({ slug: i.slug, name: i.name, quantity: i.quantity })),
    });

    if (error) {
      if (error.message.includes("Insufficient wallet balance")) {
        throw new Error("INSUFFICIENT_BALANCE");
      }
      throw new Error(error.message);
    }

    const order = result?.[0];
    if (!order) throw new Error("Could not create order");

    const email = (context.claims as { email?: string } | null)?.email;
    if (email) {
      const { sendEmail, wrapEmail } = await import("./email.server");
      await sendEmail({
        to: email,
        subject: `Order received — ${order.order_reference}`,
        html: wrapEmail(
          `Order ${order.order_reference} received`,
          `<p style="color:#16233b">Thank you for your order. Total: <strong>₦${order.total_amount.toLocaleString()}</strong>.</p>
           <p style="color:#444">We will confirm availability and delivery cost before dispatch.</p>`,
        ),
      });
    }

    return {
      order: {
        id: order.order_id,
        reference: order.order_reference,
        total_amount: order.total_amount,
      },
    };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("shop_orders")
      .select(
        "id, reference, status, payment_status, delivery_method, delivery_address, total_amount, created_at, shop_order_items(id, product_slug, product_name, quantity, unit_price)",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { orders: (data ?? []) as unknown as OrderSummary[] };
  });