// src/lib/announcements.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export interface Announcement {
  id: string;
  message: string;
  link_url: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
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

// Public — no auth required, powers the homepage ticker
export const listActiveAnnouncements = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("announcements")
    .select("id, message, link_url, is_active, priority, created_at")
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listActiveAnnouncements", error.message);
    return { announcements: [] as Announcement[] };
  }
  return { announcements: (data ?? []) as Announcement[] };
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

// Admin — sees everything including inactive
export const listAllAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("announcements")
      .select("id, message, link_url, is_active, priority, created_at")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { announcements: (data ?? []) as Announcement[] };
  });

const announcementSchema = z.object({
  id: z.string().uuid().optional(),
  message: z.string().min(2).max(280),
  link_url: z.string().url().max(500).optional().nullable(),
  is_active: z.boolean(),
  priority: z.number().int().min(0).max(100),
});

export const saveAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => announcementSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...values } = data;
    const payload = { ...values, link_url: values.link_url || null };

    if (id) {
      const { error } = await context.supabase.from("announcements").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("announcements").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });