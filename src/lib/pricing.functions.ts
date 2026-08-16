import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export interface ServicePrice {
  slug: string;
  name: string;
  category_slug: string | null;
  price: number | null;
  is_active: boolean;
}

export const listServicePrices = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  const client = createClient<Database>(url, key, {
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

  const { data } = await client
    .from("service_prices")
    .select("slug, name, category_slug, price, is_active")
    .eq("is_active", true);

  return { prices: (data ?? []) as ServicePrice[] };
});

export const saveServicePrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        slug: z.string().min(2).max(90),
        name: z.string().min(2).max(140),
        categorySlug: z.string().max(60).nullable().optional(),
        price: z.number().int().min(0).max(100000000).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { error } = await context.supabase.from("service_prices").upsert(
      {
        slug: data.slug,
        name: data.name,
        category_slug: data.categorySlug ?? null,
        price: data.price,
        is_active: true,
      },
      { onConflict: "slug" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
