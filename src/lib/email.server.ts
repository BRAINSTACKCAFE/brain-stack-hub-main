const FROM = "BRAIN STACK CAFE <onboarding@resend.dev>";

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const key = process.env["RESEND_API_KEY"];
  if (!key || !opts.to) return { sent: false };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [opts.to], subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) {
      console.error("Resend error", res.status, await res.text());
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("Resend request failed", error);
    return { sent: false };
  }
}

export function wrapEmail(title: string, bodyHtml: string) {
  return `<div style="font-family:Helvetica,Arial,sans-serif;background:#f7f5ef;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #16233b;border-radius:6px;padding:24px">
    <p style="letter-spacing:.18em;font-size:11px;text-transform:uppercase;color:#8a7333;margin:0 0 8px">BRAIN STACK CAFE</p>
    <h1 style="font-size:20px;margin:0 0 16px;color:#16233b">${title}</h1>
    ${bodyHtml}
    <p style="margin-top:24px;font-size:12px;color:#666">Need help? WhatsApp us on 07038944249.</p>
  </div>
</div>`;
}

export function statusEmail(opts: {
  name?: string | null;
  reference: string;
  itemName: string;
  status: string;
  notes?: string | null;
}) {
  return wrapEmail(
    `Update on ${opts.reference}`,
    `<p style="color:#16233b">Hello ${opts.name || "there"},</p>
     <p style="color:#16233b">Your request <strong>${opts.itemName}</strong> (${opts.reference}) is now
     <strong>${opts.status.replace(/_/g, " ")}</strong>.</p>
     ${opts.notes ? `<p style="color:#444">${opts.notes}</p>` : ""}`,
  );
}