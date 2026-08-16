import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { listMyOrders, type OrderSummary } from "@/lib/shop.functions";
import { initializePayment } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/orders")({
  component: OrdersPage,
  head: () => ({
    meta: [
      { title: "My orders — BRAIN STACK CAFE" },
      { name: "description", content: "View your computer and accessory orders, delivery details and payment status." },
      { property: "og:title", content: "My orders — BRAIN STACK CAFE" },
      { property: "og:description", content: "Track your shop orders and payments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function OrdersPage() {
  const fetchOrders = useServerFn(listMyOrders);
  const pay = useServerFn(initializePayment);
  const [payingId, setPayingId] = useState<string | null>(null);
  const { data, isLoading } = useQuery<{ orders: OrderSummary[] }>({
    queryKey: ["my-orders"],
    queryFn: fetchOrders,
  });

  const orders = data?.orders ?? [];

  const startPayment = async (id: string) => {
    setPayingId(id);
    try {
      const res = await pay({
        data: { kind: "order", id, callbackUrl: `${window.location.origin}/orders` },
      });
      window.location.href = res.authorizationUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start payment.");
      setPayingId(null);
    }
  };

  return (
    <SiteLayout>
      <div className="bsc-container py-12">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Package className="size-5" />
          <h1 className="font-display text-2xl font-bold">My orders</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-6 rounded-xl border-2 border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">You haven't placed any orders yet.</p>
            <Button asChild className="mt-4">
              <Link to="/shop">Browse the shop</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((o) => (
              <article key={o.id} className="bsc-card rounded-lg p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-semibold">{o.reference ?? o.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString()} · {o.delivery_method}
                      {o.delivery_address ? ` · ${o.delivery_address}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-secondary px-2 py-1 text-xs font-semibold uppercase">
                      {o.status.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold uppercase ${
                        o.payment_status === "paid"
                          ? "bg-success text-success-foreground"
                          : "bg-accent text-accent-foreground"
                      }`}
                    >
                      {o.payment_status}
                    </span>
                  </div>
                </div>

                <ul className="mt-4 space-y-1 text-sm">
                  {o.shop_order_items.map((i) => (
                    <li key={i.id} className="flex justify-between">
                      <span>
                        {i.product_name} × {i.quantity}
                      </span>
                      <span>₦{(i.unit_price * i.quantity).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="font-display text-lg font-bold">
                    ₦{o.total_amount.toLocaleString()}
                  </span>
                  {o.payment_status !== "paid" && (
                    <Button size="sm" onClick={() => startPayment(o.id)} disabled={payingId === o.id}>
                      {payingId === o.id && <Loader2 className="size-4 animate-spin" />} Pay now
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}