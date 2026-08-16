import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const referenceSchema = z.object({
  reference: z.string().min(3).max(32),
});

export interface TrackedRequest {
  id: string;
  reference: string;
  service_slug: string;
  service_name: string;
  status: string;
  payment_status: string;
  amount: number | null;
  created_at: string;
  updated_at: string;
  form_data: Record<string, string> | null;
}

export const trackRequestByReference = createServerFn({ method: "POST" })
  .inputValidator((input) => referenceSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: request, error } = await supabaseAdmin
      .from("service_requests")
      .select(
        "id, reference, service_slug, service_name, status, payment_status, amount, created_at, updated_at, form_data"
      )
      .eq("reference", data.reference.toUpperCase().trim())
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return request as TrackedRequest | null;
  });
