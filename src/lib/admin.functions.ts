import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AdminRequestRow {
  id: string;
  reference: string;
  service_name: string;
  service_slug: string;
  status: string;
  payment_status: string;
  amount: number | null;
  notes: string | null;
  created_at: string;
  user_id: string | null;
  documents: Array<{
    id: string;
    label: string;
    file_name: string;
    storage_path: string;
    content_type: string | null;
    size_bytes: number | null;
    created_at: string;
  }>;
}

export interface AdminOrderRow {
  id: string;
  reference: string | null;
  status: string;
  payment_status: string;
  delivery_method: string;
  delivery_address: string | null;
  total_amount: number;
  created_at: string;
  user_id: string;
  shop_order_items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
}

export interface AdminProductRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string | null;
  price: number | null;
  condition: string;
  in_stock: boolean;
  waybill: boolean;
  is_active: boolean;
  image_url: string | null;
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!data) return { isAdmin: false as const };

    // Fetch requests, orders, products, and documents in parallel
    const [requestsResult, ordersResult, productsResult, documentsResult] = await Promise.all([
      context.supabase
        .from("service_requests")
        .select("id, reference, service_name, service_slug, status, payment_status, amount, notes, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(200),
      context.supabase
        .from("shop_orders")
        .select(
          "id, reference, status, payment_status, delivery_method, delivery_address, total_amount, created_at, user_id, shop_order_items(id, product_name, quantity, unit_price)",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      context.supabase
        .from("shop_products")
        .select("id, slug, name, category, summary, price, condition, in_stock, waybill, is_active, image_url")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("request_documents")
        .select("id, request_id, label, file_name, storage_path, content_type, size_bytes, created_at"),
    ]);

    // Group documents by request_id
    const documentsByRequestId: Record<string, Array<typeof documentsResult[0]['data']>[number]> = {};
    (documentsResult.data ?? []).forEach(doc => {
      if (!documentsByRequestId[doc.request_id]) {
        documentsByRequestId[doc.request_id] = [];
      }
      documentsByRequestId[doc.request_id].push(doc);
    });

    // Attach documents to requests
    const requestsWithDocuments = (requestsResult.data ?? []).map(request => ({
      ...request,
      documents: documentsByRequestId[request.id] ?? [],
    }));

    return {
      isAdmin: true as const,
      requests: requestsWithDocuments as AdminRequestRow[],
      orders: (ordersResult.data ?? []) as unknown as AdminOrderRow[],
      products: (productsResult.data ?? []) as AdminProductRow[],
    };
  });

export const updateRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["submitted", "payment_confirmed", "processing", "completed", "requires_attention"]),
        notes: z.string().max(1000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { data: row, error } = await context.supabase
      .from("service_requests")
      .update({ status: data.status, notes: data.notes ?? null })
      .eq("id", data.id)
      .select("id, reference, service_name, user_id")
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (row?.user_id) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { sendEmail, statusEmail } = await import("./email.server");
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name")
        .eq("id", row.user_id)
        .maybeSingle();
      if (profile?.email) {
        await sendEmail({
          to: profile.email,
          subject: `Update on ${row.reference}`,
          html: statusEmail({
            name: profile.full_name,
            reference: row.reference,
            itemName: row.service_name,
            status: data.status,
            notes: data.notes ?? null,
          }),
        });
      }
    }

    return { ok: true };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["submitted", "payment_confirmed", "processing", "dispatched", "completed", "cancelled"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("shop_orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only"),
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(60),
  summary: z.string().max(300).optional().nullable(),
  price: z.number().int().min(0).nullable(),
  condition: z.enum(["New", "UK Used", "Refurbished"]),
  in_stock: z.boolean(),
  waybill: z.boolean(),
  is_active: z.boolean(),
  image_url: z.string().url().max(500).optional().nullable(),
});

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => productSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...values } = data;
    const payload = { ...values, summary: values.summary ?? null, image_url: values.image_url || null };

    if (id) {
      const { error } = await context.supabase.from("shop_products").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("shop_products").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("shop_products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
  export const getDocumentDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ storagePath: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("request-documents")
      .createSignedUrl(data.storagePath, 60); // link valid for 60 seconds

    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });