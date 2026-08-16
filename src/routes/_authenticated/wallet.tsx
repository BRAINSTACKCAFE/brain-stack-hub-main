import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Loader2, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWallet, fundWallet } from "@/lib/wallet.functions";
import { verifyPayment } from "@/lib/payments.functions";

const QUICK = [2000, 5000, 10000, 20000];

export const Route = createFileRoute("/_authenticated/wallet")({
  component: WalletPage,
  head: () => ({
    meta: [
      { title: "Wallet — BRAIN STACK CAFE" },
      { name: "description", content: "Fund your Brain Stack Cafe wallet and pay for services instantly." },
      { property: "og:title", content: "Wallet — BRAIN STACK CAFE" },
      { property: "og:description", content: "Fund your wallet and pay for services instantly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function WalletPage() {
  const fetchWallet = useServerFn(getWallet);
  const fund = useServerFn(fundWallet);
  const verify = useServerFn(verifyPayment);
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("5000");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["wallet"], queryFn: fetchWallet });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") ?? params.get("trxref");
    if (!reference) return;
    verify({ data: { reference } })
      .then((res) => {
        if (res.paid) {
          toast.success("Wallet funded.");
          queryClient.invalidateQueries({ queryKey: ["wallet"] });
        }
      })
      .catch(() => undefined)
      .finally(() => window.history.replaceState({}, "", window.location.pathname));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startFunding = async () => {
    const value = Number(amount);
    if (!value || value < 500) {
      toast.error("Enter at least ₦500.");
      return;
    }
    setBusy(true);
    try {
      const res = await fund({
        data: { amount: value, callbackUrl: `${window.location.origin}/wallet` },
      });
      window.location.href = res.authorizationUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start funding.");
      setBusy(false);
    }
  };

  return (
    <SiteLayout>
      <div className="bsc-container py-12">
        <h1 className="font-display text-3xl font-bold">Wallet</h1>
        <p className="mt-1 text-muted-foreground">
          Fund once, then pay for any service instantly — no card details each time.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="bsc-card h-fit rounded-lg p-6">
            <div className="flex items-center gap-2">
              <WalletIcon className="size-5" />
              <p className="bsc-label text-muted-foreground">Available balance</p>
            </div>
            <p className="mt-3 font-display text-4xl font-bold">
              {isLoading ? "—" : `₦${(data?.balance ?? 0).toLocaleString()}`}
            </p>

            <div className="mt-6 grid grid-cols-4 gap-2">
              {QUICK.map((q) => (
                <Button
                  key={q}
                  variant={Number(amount) === q ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(String(q))}
                >
                  {q / 1000}k
                </Button>
              ))}
            </div>

            <Input
              className="mt-3"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="Amount in naira"
            />
            <Button className="mt-3 w-full" onClick={startFunding} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />} Fund wallet
            </Button>
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>

          <div>
            <h2 className="border-b border-border pb-3 font-display text-lg font-semibold">
              Transaction history
            </h2>
            {isLoading ? (
              <p className="py-8 text-muted-foreground">Loading…</p>
            ) : (data?.transactions.length ?? 0) === 0 ? (
              <div className="mt-6 rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
                No wallet activity yet.
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {data?.transactions.map((t) => (
                  <li key={t.id} className="bsc-card flex items-center justify-between gap-3 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      {t.direction === "credit" ? (
                        <ArrowDownLeft className="size-4 text-success" />
                      ) : (
                        <ArrowUpRight className="size-4 text-destructive" />
                      )}
                      <div>
                        <p className="text-sm font-semibold">{t.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold">
                        {t.direction === "credit" ? "+" : "−"}₦{Number(t.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bal ₦{Number(t.balance_after).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
