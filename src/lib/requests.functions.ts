import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

const createRequestSchema = z.object({
  serviceSlug: z.string(),
  serviceName: z.string(),
  categorySlug: z.string(),
  amount: z.number().nullable(),
  formData: z.record(z.unknown()),
});

export interface RequestSummary {
  id: string;
  reference: string;
  service_slug: string;
  service_name: string;
  status: string;
  amount: number | null;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export const listMyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("service_requests")
      .select(
        "id, reference, service_slug, service_name, status, amount, payment_status, created_at, updated_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .returns<RequestSummary[]>();

    if (error) throw new Error(error.message);
    return { requests: data ?? [] };
  });

export const getMyRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: request, error } = await context.supabase
      .from("service_requests")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { request };
  });

export const createRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const reference = generateReference(data.serviceSlug);

    if (data.amount === null) {
      throw new Error("This service is missing a price and can't be submitted yet.");
    }

    const { data: result, error } = await context.supabase.rpc("create_request_and_debit", {
      p_user_id: context.userId,
      p_reference: reference,
      p_service_slug: data.serviceSlug,
      p_service_name: data.serviceName,
      p_category_slug: data.categorySlug,
      p_amount: data.amount,
      p_form_data: data.formData as Json,
    });

    if (error) {
      if (error.message.includes("Insufficient wallet balance")) {
        throw new Error("Insufficient wallet balance. Please fund your wallet and try again.");
      }
      throw new Error(error.message);
    }

    const request = result?.[0];
    if (!request) throw new Error("Could not create request");

    return { request };
  });

export const createGuestRequest = createServerFn({ method: "POST" })
  .inputValidator((input) => createRequestSchema.parse(input))
  .handler(async ({ data }) => {
    const reference = generateReference(data.serviceSlug);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: request, error } = await supabaseAdmin
      .from("service_requests")
      .insert({
        user_id: null,
        reference,
        service_slug: data.serviceSlug,
        service_name: data.serviceName,
        category_slug: data.categorySlug,
        amount: data.amount,
        form_data: data.formData as Json,
        status: "submitted",
        payment_status: "unpaid",
      } as any)
      .select("id, reference")
      .single();

    if (error) throw new Error(error.message);
    return { request };
  });

function generateReference(serviceSlug: string) {
  const prefix = serviceSlug.slice(0, 3).toUpperCase();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `BSC-${prefix}-${random}`;
}