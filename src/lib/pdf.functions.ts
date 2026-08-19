// src/lib/pdf.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PAGE_WIDTH = 595; // A4 in points
const PAGE_HEIGHT = 842;
const MARGIN = 50;

function formatLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function buildRequestPdf(row: {
  reference: string;
  service_name: string;
  status: string;
  payment_status: string;
  created_at: string;
  form_data: Record<string, unknown>;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;
  const contentWidth = PAGE_WIDTH - MARGIN * 2;

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };

  // Header
  page.drawText("BRAIN STACK CAFE", { x: MARGIN, y, size: 10, font: bold, color: rgb(0.5, 0.4, 0.1) });
  y -= 18;
  page.drawText(row.service_name, { x: MARGIN, y, size: 18, font: bold });
  y -= 26;

  // Tracking number block
  page.drawRectangle({
    x: MARGIN,
    y: y - 8,
    width: contentWidth,
    height: 30,
    color: rgb(0.95, 0.95, 0.95),
  });
  page.drawText("Tracking Reference:", { x: MARGIN + 8, y: y + 4, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(row.reference, { x: MARGIN + 8, y: y - 10, size: 14, font: bold });
  y -= 46;

  // Meta line
  const submitted = new Date(row.created_at).toLocaleDateString();
  page.drawText(
    `Status: ${row.status.replace(/_/g, " ")}   ·   Payment: ${row.payment_status}   ·   Submitted: ${submitted}`,
    { x: MARGIN, y, size: 9, font, color: rgb(0.35, 0.35, 0.35) },
  );
  y -= 24;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 22;

  // Form fields
  for (const [key, rawValue] of Object.entries(row.form_data ?? {})) {
    const label = formatLabel(key);
    const value = rawValue === null || rawValue === undefined || rawValue === "" ? "—" : String(rawValue);

    ensureSpace(34);
    page.drawText(label, { x: MARGIN, y, size: 9, font: bold, color: rgb(0.3, 0.3, 0.3) });
    y -= 14;

    const lines = wrapText(value, font, 11, contentWidth);
    for (const line of lines) {
      ensureSpace(16);
      page.drawText(line, { x: MARGIN, y, size: 11, font });
      y -= 15;
    }
    y -= 8;
  }

  return doc.save();
}

const getPdfByIdSchema = z.object({ id: z.string().uuid() });
const getPdfByReferenceSchema = z.object({ reference: z.string() });

export const getRequestFormPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => getPdfByIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("service_requests")
      .select("id, reference, service_name, status, payment_status, created_at, form_data, user_id")
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) throw new Error("Request not found");

    // Only the owner or an admin can generate this PDF — relies on RLS too,
    // but this gives a clean error instead of a silent empty result.
    const isOwner = row.user_id === context.userId;
    if (!isOwner) {
      const { data: isAdmin } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (!isAdmin) throw new Error("Forbidden");
    }

    const pdfBytes = await buildRequestPdf({
      reference: row.reference,
      service_name: row.service_name,
      status: row.status,
      payment_status: row.payment_status,
      created_at: row.created_at,
      form_data: (row.form_data as Record<string, unknown>) ?? {},
    });

    return {
      filename: `${row.reference}.pdf`,
      base64: Buffer.from(pdfBytes).toString("base64"),
    };
  });

export const getRequestFormPdfByReference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => getPdfByReferenceSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("service_requests")
      .select("id, reference, service_name, status, payment_status, created_at, form_data, user_id")
      .eq("reference", data.reference)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) throw new Error("Request not found");

    // Only the owner or an admin can generate this PDF — relies on RLS too,
    // but this gives a clean error instead of a silent empty result.
    const isOwner = row.user_id === context.userId;
    if (!isOwner) {
      const { data: isAdmin } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (!isAdmin) throw new Error("Forbidden");
    }

    const pdfBytes = await buildRequestPdf({
      reference: row.reference,
      service_name: row.service_name,
      status: row.status,
      payment_status: row.payment_status,
      created_at: row.created_at,
      form_data: (row.form_data as Record<string, unknown>) ?? {},
    });

    return {
      filename: `${row.reference}.pdf`,
      base64: Buffer.from(pdfBytes).toString("base64"),
    };
  });