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
  notes: string | null;
  created_at: string;
  updated_at: string;
  request_deliverables: Array<{
    id: string;
    label: string;
    file_name: string;
    storage_path: string;
    content_type: string | null;
    size_bytes: number | null;
    created_at: string;
  }>;
}

export const listMyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("service_requests")
      .select(
        "id, reference, service_slug, service_name, status, amount, payment_status, notes, created_at, updated_at, request_deliverables(id, label, file_name, storage_path, content_type, size_bytes, created_at)",
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

async function notifyAdminOfRequest(reference: string, serviceName: string, amount: number | null) {
  const adminEmail = process.env["ADMIN_NOTIFICATION_EMAIL"];
  if (!adminEmail) return;

  try {
    const { sendEmail, wrapEmail } = await import("./email.server");
    await sendEmail({
      to: adminEmail,
      subject: `New request — ${reference}`,
      html: wrapEmail(
        `New service request: ${serviceName}`,
        `<p style="color:#16233b">Reference: <strong>${reference}</strong></p>
         <p style="color:#444">Amount: ${amount ? `₦${amount.toLocaleString()}` : "Price on request"}</p>
         <p style="color:#444">Log in to the admin dashboard to review and process this request.</p>`,
      ),
    });
  } catch (err) {
    console.error("notifyAdminOfRequest failed:", err);
  }
}

export const createRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const reference = generateReference(data.serviceSlug);

    // Check if this is an Arewagate service that should be handled directly
    const isArewagateService = [
      'airtime', 'data-bundles', 'electricity', 'tv-subscription',
      'nin-verification', 'bvn-verification', 'cac-verification'
    ].includes(data.serviceSlug);

    if (isArewagateService) {
      return await handleArewagateService({ data, context, reference });
    }

    // Original logic for non-Arewagate services
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
      const errorMsg = error?.message?.toLowerCase() ?? '';
      if (errorMsg.includes('wallet') && (errorMsg.includes('not found') || errorMsg.includes('insufficient') || errorMsg.includes('balance'))) {
        throw new Error("Insufficient account balance. Please fund your wallet and try again.");
      }
      throw new Error(error.message);
    }

    const request = result?.[0];
    if (!request) throw new Error("Could not create request");

    await notifyAdminOfRequest(request.request_reference, data.serviceName, data.amount);

    return { request: { id: request.request_id, reference: request.request_reference } };
  });

/**
 * Handle Arewagate service requests
 * Processes services that integrate directly with Arewagate API
 *
 * NOTE: this is only reachable via `createRequest` above, which the client
 * no longer calls for Arewagate slugs — the form now debits via
 * `debitWalletSecure` and calls the `/api/arewagate/*` routes itself, then
 * records the result via `createServiceRequestSecure` below. This function
 * is kept as a server-side fallback/legacy path, so its `arewagateResult`
 * bug is fixed here too rather than left as a landmine.
 */
async function handleArewagateService({ data, context, reference }: {
  data: any;
  context: any;
  reference: string;
}) {
  // Import Arewagate functions
  const {
    purchaseAirtime,
    purchaseData,
    verifyUtilityBill,
    verifyNIN,
    verifyBVN,
    verifyCAC
  } = await import("./arewagate.functions");

  // Import wallet functions for debiting wallet
  const { payFromWallet } = await import("./wallet.server");

  // Determine the amount to debit from wallet
  let amountToDebit: number;

  // For services where user specifies amount (airtime, electricity, etc.)
  const userSpecifiedAmountServices = ['airtime', 'electricity', 'tv-subscription'];
  if (userSpecifiedAmountServices.includes(data.serviceSlug)) {
    if (!data.formData.amount) {
      throw new Error("Amount is required for this service");
    }
    amountToDebit = Number(data.formData.amount);
  } else {
    // For fixed-fee services (verification, data bundles with default, etc.)
    amountToDebit = Number(data.amount ?? data.formData.amount ?? 0);
    if (amountToDebit <= 0) {
      // Use default fees for verification services
      const defaultFees: Record<string, number> = {
        'nin-verification': 100,
        'bvn-verification': 100,
        'cac-verification': 100,
        'data-bundles': 500 // Default data bundle amount
      };
      amountToDebit = defaultFees[data.serviceSlug] ?? 0;

      if (amountToDebit <= 0) {
        throw new Error("Amount is required for this service");
      }
    }
  }

  // FIX: this was previously assigned to without ever being declared,
  // which throws `ReferenceError: arewagateResult is not defined` under
  // strict mode the moment any of the branches below runs.
  let arewagateResult: any;

  try {
    // Handle each Arewagate service type
    switch (data.serviceSlug) {
      case 'airtime': {
        // Validate airtime-specific requirements
        if (!data.formData.network || !data.formData.phoneNumber) {
          throw new Error("Missing required fields for airtime purchase");
        }

        // Debit wallet for the airtime amount
        await payFromWallet({
          userId: context.userId,
          amount: amountToDebit,
          requestId: reference,
          reference: `AIRTIME-${reference}`,
          serviceName: "Airtime Top-up"
        });

        // Call Arewagate airtime purchase
        arewagateResult = await purchaseAirtime({
          data: {
            phone: data.formData.phoneNumber,
            network: data.formData.network.toLowerCase(),
            amount: amountToDebit,
          },
        });
        break;
      }

      case 'data-bundles': {
        if (!data.formData.network || !data.formData.planSelection || !data.formData.phoneNumber) {
          throw new Error("Missing required fields for data bundle purchase");
        }

        await payFromWallet({
          userId: context.userId,
          amount: amountToDebit,
          requestId: reference,
          reference: `DATA-${reference}`,
          serviceName: "Data Bundle"
        });

        arewagateResult = await purchaseData({
          data: {
            phone: data.formData.phoneNumber,
            network: data.formData.network.toLowerCase(),
            plan: data.formData.planSelection,
          },
        });
        break;
      }

      case 'electricity': {
        if (!data.formData.provider || !data.formData.meterNumber || !data.formData.meterType) {
          throw new Error("Missing required fields for electricity bill payment");
        }

        await payFromWallet({
          userId: context.userId,
          amount: amountToDebit,
          requestId: reference,
          reference: `ELECTRIC-${reference}`,
          serviceName: "Electricity Bill Payment"
        });

        arewagateResult = await verifyUtilityBill({
          data: {
            category: "electricity",
            provider: data.formData.provider,
            customerId: data.formData.meterNumber,
          },
        });
        break;
      }

      case 'tv-subscription': {
        if (!data.formData.provider || !data.formData.package || !data.formData.smartCardNumber) {
          throw new Error("Missing required fields for TV subscription renewal");
        }

        await payFromWallet({
          userId: context.userId,
          amount: amountToDebit,
          requestId: reference,
          reference: `TV-${reference}`,
          serviceName: "TV Subscription"
        });

        arewagateResult = await verifyUtilityBill({
          data: {
            category: "cable-tv",
            provider: data.formData.provider,
            customerId: data.formData.smartCardNumber,
          },
        });
        break;
      }

      case 'nin-verification': {
        if (!data.formData.nin) {
          throw new Error("NIN number is required for verification");
        }

        await payFromWallet({
          userId: context.userId,
          amount: amountToDebit,
          requestId: reference,
          reference: `NINV-${reference}`,
          serviceName: "NIN Verification"
        });

        arewagateResult = await verifyNIN({ data: { nin: data.formData.nin } });
        break;
      }

      case 'bvn-verification': {
        if (!data.formData.bvn) {
          throw new Error("BVN number is required for verification");
        }

        await payFromWallet({
          userId: context.userId,
          amount: amountToDebit,
          requestId: reference,
          reference: `BVNV-${reference}`,
          serviceName: "BVN Verification"
        });

        arewagateResult = await verifyBVN({ data: { bvn: data.formData.bvn } });
        break;
      }

      case 'cac-verification': {
        if (!data.formData.rcNumber) {
          throw new Error("RC number is required for verification");
        }

        await payFromWallet({
          userId: context.userId,
          amount: amountToDebit,
          requestId: reference,
          reference: `CACV-${reference}`,
          serviceName: "CAC Verification"
        });

        arewagateResult = await verifyCAC({ data: { rcNumber: data.formData.rcNumber } });
        break;
      }

      default:
        throw new Error(`Unsupported Arewagate service: ${data.serviceSlug}`);
    }

    // Create a request record for tracking (without debiting wallet again)
    const { data: requestResult, error: requestError } = await context.supabase
      .from("service_requests")
      .insert({
        user_id: context.userId,
        reference: reference,
        service_slug: data.serviceSlug,
        service_name: data.serviceName || data.serviceSlug,
        category_slug: data.categorySlug,
        amount: amountToDebit,
        payment_status: "paid", // Since we already debited the wallet
        status: "processing",   // Awaiting Arewagate fulfillment
        notes: `Arewagate service: ${data.serviceSlug}`,
        form_data: data.formData
      })
      .select()
      .single();

    if (requestError) {
      // If we couldn't create the request record, we should consider refunding
      // For now, we'll log the error but continue since the Arewagate transaction may have succeeded
      console.error("Failed to create service request record:", requestError);
    }

    // Notify admin of the Arewagate service request
    await notifyAdminOfRequest(reference, data.serviceName || data.serviceSlug, amountToDebit);

    // Return success response with Arewagate result
    return {
      request: {
        id: requestResult?.id ?? reference,
        reference: reference
      },
      arewagateResult: arewagateResult
    };
  } catch (error) {
    // If there was an error, we should attempt to refund the wallet debit if it happened
    // Note: In a more sophisticated implementation, we'd track whether the debit occurred
    // and only refund if it did

    // Re-throw the error to be handled by the caller
    throw error;
  }
}

export const getMyDeliverableDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: deliverable, error } = await context.supabase
      .from("request_deliverables")
      .select("storage_path, request_id")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!deliverable) throw new Error("Not found");

    // RLS already scopes this select to the owner's own requests, but
    // double-check explicitly for a clean error rather than relying on
    // a silently-empty result.
    const { data: owns } = await context.supabase
      .from("service_requests")
      .select("id")
      .eq("id", deliverable.request_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!owns) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from("completion-documents")
      .createSignedUrl(deliverable.storage_path, 60);
    if (signError) throw new Error(signError.message);
    return { url: signed.signedUrl };
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

    await notifyAdminOfRequest(request.reference, data.serviceName, data.amount);

    return { request };
  });

/**
 * Record a service request that has ALREADY been paid for by the client
 * calling `debitWalletSecure` directly (the Arewagate flow: debit wallet →
 * call the Arewagate API route → record the result here). This function
 * does not touch the wallet at all — it only writes the tracking row.
 *
 * SECURITY: userId is not part of the input schema, same reasoning as
 * `debitWalletSecure` — it always comes from `context.userId` via
 * `requireSupabaseAuth`, never from the client.
 */
const createServiceRequestSecureSchema = z.object({
  reference: z.string().min(1, "Reference is required"),
  serviceSlug: z.string().min(1),
  serviceName: z.string().min(1),
  categorySlug: z.string().min(1),
  amount: z.number().nullable(),
  paymentStatus: z.enum(["paid", "unpaid"]).default("paid"),
  status: z.string().min(1).default("processing"),
  notes: z.string().nullable().optional(),
  formData: z.record(z.unknown()),
});

export const createServiceRequestSecure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createServiceRequestSecureSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: request, error } = await context.supabase
      .from("service_requests")
      .insert({
        user_id: context.userId,
        reference: data.reference,
        service_slug: data.serviceSlug,
        service_name: data.serviceName,
        category_slug: data.categorySlug,
        amount: data.amount,
        payment_status: data.paymentStatus,
        status: data.status,
        notes: data.notes ?? null,
        form_data: data.formData as Json,
      })
      .select("id, reference")
      .single();

    if (error) throw new Error(error.message);

    await notifyAdminOfRequest(request.reference, data.serviceName, data.amount);

    return { id: request.id, reference: request.reference };
  });

function generateReference(serviceSlug: string) {
  const prefix = serviceSlug.slice(0, 3).toUpperCase();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `BSC-${prefix}-${random}`;
}