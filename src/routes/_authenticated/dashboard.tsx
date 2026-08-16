import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FileText, Package, Plus, Loader2, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { listMyRequests, type RequestSummary } from "@/lib/requests.functions";
import { initializePayment, verifyPayment } from "@/lib/payments.functions";
import { getWallet, payRequestFromWallet } from "@/lib/wallet.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard — BRAIN STACK CAFE" },
      { name: "description", content: "Manage your BRAIN STACK CAFE service requests and shop orders." },
      { property: "og:title", content: "Dashboard — BRAIN STACK CAFE" },
      { property: "og:description", content: "Manage your service requests and shop orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function DashboardPage() {
  const fetchRequests = useServerFn(listMyRequests);
  const pay = useServerFn(initializePayment);
  const verify = useServerFn(verifyPayment);
  const fetchWallet = useServerFn(getWallet);
  const payWallet = useServerFn(payRequestFromWallet);
  const queryClient = useQueryClient();
  const [payingId, setPayingId] = useState<string | null>(null);
  const { data, isLoading } = useQuery<{ requests: RequestSummary[] }>({
    queryKey: ["my-requests"],
    queryFn: fetchRequests,
  });
  const { data: wallet } = useQuery({ queryKey: ["wallet"], queryFn: fetchWallet });

  const requests = data?.requests ?? [];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") ?? params.get("trxref");
    if (!reference) return;
    verify({ data: { reference } })
      .then((res) => {
        if (res.paid) {
          toast.success("Payment confirmed.");
          queryClient.invalidateQueries({ queryKey: ["my-requests"] });
        }
      })
      .catch(() => undefined)
      .finally(() => window.history.replaceState({}, "", window.location.pathname));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPayment = async (id: string) => {
    setPayingId(id);
    try {
      const res = await pay({
        data: { kind: "request", id, callbackUrl: `${window.location.origin}/dashboard` },
      });
      window.location.href = res.authorizationUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start payment.");
      setPayingId(null);
    }
  };

  const payFromWallet = async (id: string) => {
    setPayingId(id);
    try {
      await payWallet({ data: { id } });
      toast.success("Paid from wallet.");
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wallet payment failed.");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <SiteLayout>
      <div className="bsc-container py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Your dashboard</h1>
            <p className="mt-1 text-muted-foreground">Track requests, view updates and manage orders.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/wallet"
              className="bsc-card bsc-card-hover flex items-center gap-3 rounded-lg px-4 py-2.5"
            >
              <WalletIcon className="size-5" />
              <span>
                <span className="bsc-label block text-muted-foreground">Wallet</span>
                <span className="font-display text-lg font-bold">
                  ₦{(wallet?.balance ?? 0).toLocaleString()}
                </span>
              </span>
            </Link>
            <Button asChild>
              <Link to="/services">
                <Plus className="mr-2 size-4" />
                New request
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <FileText className="size-5" />
              <h2 className="font-display text-lg font-semibold">Service requests</h2>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 py-10 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading requests…
              </div>
            ) : requests.length === 0 ? (
              <div className="mt-6 rounded-xl border-2 border-dashed border-border p-8 text-center">
                <p className="text-muted-foreground">You haven't submitted any requests yet.</p>
                <Button asChild className="mt-4">
                  <Link to="/services">Browse services</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div>
                      <p className="font-display font-semibold">{r.service_name}</p>
                      <p className="text-xs text-muted-foreground">{r.reference}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={r.status} />
                      {r.payment_status !== "paid" && r.amount ? (
                        <>
                          {(wallet?.balance ?? 0) >= r.amount ? (
                            <Button size="sm" onClick={() => payFromWallet(r.id)} disabled={payingId === r.id}>
                              {payingId === r.id && <Loader2 className="size-4 animate-spin" />} Pay ₦
                              {r.amount.toLocaleString()} from wallet
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => startPayment(r.id)} disabled={payingId === r.id}>
                              {payingId === r.id && <Loader2 className="size-4 animate-spin" />} Pay ₦
                              {r.amount.toLocaleString()}
                            </Button>
                          )}
                        </>
                      ) : null}
                      <Button asChild variant="outline" size="sm">
                        <Link to="/track" search={{ ref: r.reference }}>
                          Track
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Package className="size-5" />
              <h2 className="font-display text-lg font-semibold">Quick links</h2>
            </div>
            <nav className="mt-4 grid gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link to="/wallet">Fund wallet</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/orders">My orders</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/services">Browse services</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/shop">Shop accessories</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/track">Track a request</Link>
              </Button>
            </nav>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const label = status ?? "pending";
  const variant =
    label === "completed"
      ? "bg-success text-success-foreground"
      : label === "in_progress"
        ? "bg-accent text-accent-foreground"
        : "bg-secondary text-secondary-foreground";
  return <span className={`rounded px-2 py-1 text-xs font-semibold uppercase ${variant}`}>{label.replace("_", " ")}</span>;
}
