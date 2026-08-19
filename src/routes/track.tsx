import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Loader2, MessageCircle, FileDown } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { business, waLink } from "@/config/business";
import { trackRequestByReference } from "@/lib/tracking.functions";
import { getRequestFormPdfByReference } from "@/lib/pdf.functions";

const title = "Track Your Request — BRAIN STACK CAFE";
const description =
  "Enter your BRAIN STACK CAFE reference number to check the status of your service request.";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Track,
});

const statuses = ["submitted", "payment_confirmed", "processing", "completed", "requires_attention"];

const statusLabel: Record<string, string> = {
  submitted: "Submitted",
  payment_confirmed: "Payment confirmed",
  processing: "Processing",
  completed: "Completed",
  requires_attention: "Requires attention",
};

function Track() {
  const search = useSearch({ from: "/track" }) as { ref?: string };
  const [ref, setRef] = useState(search.ref ?? "");
  const [result, setResult] = useState<{
    reference: string;
    service_name: string;
    status: string;
    payment_status: string;
    created_at: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const track = useServerFn(trackRequestByReference);
  const getPdf = useServerFn(getRequestFormPdfByReference);

  const trimmed = ref.trim().toUpperCase();

  const handleTrack = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await track({ data: { reference: trimmed } });
      if (!data) {
        setError("We couldn't find a request with that reference number.");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!result) return;
    setDownloadingPdf(true);
    try {
      const { filename, base64 } = await getPdf({ data: { reference: result.reference } });
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Auto-search when a reference is passed in the URL (e.g. from dashboard)
  useEffect(() => {
    if (search.ref) {
      void handleTrack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Tracking"
        title="Track Your Request"
        description="Every request gets a unique reference number, for example BSC-NIN-000001."
      />

      <div className="bsc-container grid gap-8 py-12 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 bsc-card">
          <form onSubmit={handleTrack}>
            <label htmlFor="ref" className="text-sm font-medium">
              Reference number
            </label>
            <div className="mt-2 flex gap-2">
              <Input
                id="ref"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="BSC-NIN-000001"
              />
              <Button type="submit" variant="outline" size="icon" aria-label="Search" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              </Button>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 rounded-xl border border-border bg-secondary/50 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{statusLabel[result.status] ?? result.status}</p>
              <p className="mt-2 text-sm text-muted-foreground">{result.service_name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Submitted {new Date(result.created_at).toLocaleDateString()}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full"
                onClick={downloadPdf}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileDown className="size-4" />
                )}
                Download filled form (PDF)
              </Button>
            </div>
          )}

          <Button
            asChild
            disabled={!trimmed}
            className="mt-4 w-full bg-success text-success-foreground hover:bg-success/90"
          >
            <a
              href={waLink(`Hello ${business.name}, please check the status of my request. Reference: ${trimmed}`)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="mr-2 size-4" /> Check status on WhatsApp
            </a>
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 bsc-card">
          <h2 className="text-lg font-semibold">How request statuses work</h2>
          <ol className="mt-4 space-y-3 text-sm">
            {statuses.map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span className="grid size-7 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">
                  {i + 1}
                </span>
                {statusLabel[s]}
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm text-muted-foreground">
            If something is missing we will mark the request as <strong>Requires attention</strong>{" "}
            and tell you exactly what to provide.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}