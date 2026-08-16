import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Truck, ShoppingCart, Minus, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { business, waLink } from "@/config/business";
import { products as staticProducts } from "@/data/catalog";
import { listProducts, createOrder, type ShopProduct } from "@/lib/shop.functions";
import { useAuth } from "@/hooks/use-auth";

const title = "Computers & Accessories — BRAIN STACK CAFE";
const description =
  "Buy laptops, keyboards, mice, storage and computer accessories from BRAIN STACK CAFE. Pickup at the centre or waybill delivery anywhere in Nigeria.";

export const Route = createFileRoute("/shop")({
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
  component: ShopPage,
});

function ShopPage() {
  const [category, setCategory] = useState<string>("All");
  const [cart, setCart] = useState<Record<string, number>>({});
  const fetchProducts = useServerFn(listProducts);
  const { data } = useQuery({ queryKey: ["shop-products"], queryFn: fetchProducts });

  const catalog: ShopProduct[] = useMemo(() => {
    const dbProducts = data?.products ?? [];
    if (dbProducts.length > 0) return dbProducts;
    return staticProducts.map((p) => ({
      id: p.id,
      slug: p.id,
      name: p.name,
      category: p.category,
      summary: p.summary,
      price: p.price,
      condition: p.condition,
      specs: p.specs ?? [],
      image_url: null,
      in_stock: p.inStock,
      waybill: p.waybill,
    }));
  }, [data]);

  const categories = useMemo(
    () => Array.from(new Set(catalog.map((p) => p.category))).sort(),
    [catalog],
  );
  const items = useMemo(
    () => (category === "All" ? catalog : catalog.filter((p) => p.category === category)),
    [catalog, category],
  );

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([slug, qty]) => ({ product: catalog.find((p) => p.slug === slug), quantity: qty }))
        .filter((l): l is { product: ShopProduct; quantity: number } => !!l.product),
    [cart, catalog],
  );
  const cartCount = cartLines.reduce((n, l) => n + l.quantity, 0);

  const addToCart = (p: ShopProduct) => {
    setCart((c) => ({ ...c, [p.slug]: (c[p.slug] ?? 0) + 1 }));
    toast.success(`${p.name} added to cart`);
  };
  const setQty = (slug: string, qty: number) =>
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[slug];
      else next[slug] = qty;
      return next;
    });

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Shop"
        title="Computers & accessories"
        description="Laptops, keyboards, mice, storage and everyday accessories. Buy at the centre or send it by waybill to any state in Nigeria."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="bsc-gold border-0 text-accent-foreground">
            <Truck className="mr-1.5 size-3.5" aria-hidden /> Waybill available nationwide
          </Badge>
          <CartSheet lines={cartLines} count={cartCount} setQty={setQty} clear={() => setCart({})} />
          <Button asChild className="bg-success text-success-foreground hover:bg-success/90">
            
              <a href={waLink(`Hello ${business.name}, I want to buy a computer accessory.`)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="size-4" /> Ask about stock
            </a>
          </Button>
        </div>
      </PageHero>

      <div className="bsc-container py-12">
        <div className="flex flex-wrap gap-2">
          {["All", ...categories].map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "default" : "outline"}
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <article key={p.id} className="bsc-card bsc-card-hover flex flex-col rounded-lg p-5">
              {p.image_url && (
                <img
                  src={p.image_url}
                  alt={p.name}
                  loading="lazy"
                  className="mb-4 h-40 w-full rounded border border-border object-cover"
                />
              )}
              <div className="flex items-start justify-between gap-3">
                <span className="bsc-label text-muted-foreground">{p.category}</span>
                <Badge variant="outline">{p.condition}</Badge>
              </div>
              <h2 className="mt-3 text-lg font-semibold">{p.name}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{p.summary}</p>
              {p.specs.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {p.specs.map((s) => (
                    <li key={s} className="rounded bg-secondary px-2 py-1 text-xs text-muted-foreground">
                      {s}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto pt-5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-bold">
                    {p.price ? `₦${p.price.toLocaleString()}` : "Price on request"}
                  </span>
                  <span className="bsc-label text-muted-foreground">
                    {p.in_stock ? "In stock" : "Out of stock"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={!p.in_stock || !p.price}
                    onClick={() => addToCart(p)}
                  >
                    <ShoppingCart className="size-4" /> Add to cart
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    
                     <a href={waLink(
                        `Hello ${business.name}, I want to order: ${p.name}${
                          p.price ? ` (₦${p.price.toLocaleString()})` : ""
                        }.`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="bsc-card mt-12 rounded-lg p-6">
          <h2 className="text-lg font-semibold">Waybill & delivery</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Items can be picked up at the centre or sent by waybill to your nearest park or delivery
            point. Waybill charges depend on destination and item size, and are confirmed before
            dispatch. Stock and pricing are updated regularly — confirm availability on WhatsApp
            before payment.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}

function CartSheet({
  lines,
  count,
  setQty,
  clear,
}: {
  lines: { product: ShopProduct; quantity: number }[];
  count: number;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
}) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const submitOrder = useServerFn(createOrder);
  const [open, setOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "waybill">("pickup");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const total = lines.reduce((sum, l) => sum + (l.product.price ?? 0) * l.quantity, 0);

  const placeOrder = async () => {
    if (deliveryMethod === "waybill" && address.trim().length < 6) {
      toast.error("Enter a delivery address for waybill.");
      return;
    }
    setSaving(true);
    try {
      const { order } = await submitOrder({
        data: {
          deliveryMethod,
          deliveryAddress: deliveryMethod === "waybill" ? address.trim() : null,
          notes: notes.trim() || null,
          items: lines.map((l) => ({
            slug: l.product.slug,
            name: l.product.name,
            quantity: l.quantity,
            unitPrice: l.product.price ?? 0,
          })),
        },
      });
      clear();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      toast.success(`Order placed — ${order.reference}. Payment taken from your wallet.`);
      navigate({ to: "/orders" });
    } catch (error) {
      if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
        toast.error("Insufficient wallet balance. Redirecting you to fund your wallet…");
        setOpen(false);
        navigate({ to: "/wallet" });
        return;
      }
      toast.error(error instanceof Error ? error.message : "Could not place order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <ShoppingCart className="size-4" /> Cart{count > 0 ? ` (${count})` : ""}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
          <SheetDescription>Pickup at the centre or waybill nationwide.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 px-4 pb-6">
          {lines.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <>
              <ul className="space-y-3">
                {lines.map((l) => (
                  <li key={l.product.slug} className="rounded border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{l.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ₦{(l.product.price ?? 0).toLocaleString()} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="size-7"
                          onClick={() => setQty(l.product.slug, l.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{l.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="size-7"
                          onClick={() => setQty(l.product.slug, l.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="bsc-label text-muted-foreground">Total</span>
                <span className="font-display text-xl font-bold">₦{total.toLocaleString()}</span>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  {(["pickup", "waybill"] as const).map((m) => (
                    <Button
                      key={m}
                      size="sm"
                      variant={deliveryMethod === m ? "default" : "outline"}
                      onClick={() => setDeliveryMethod(m)}
                      className="flex-1 capitalize"
                    >
                      {m}
                    </Button>
                  ))}
                </div>
                {deliveryMethod === "waybill" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="cart-address">Delivery address / park</Label>
                    <Input
                      id="cart-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Cross Line Park, Owerri, Imo State"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="cart-notes">Notes (optional)</Label>
                  <Textarea
                    id="cart-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {isAuthenticated ? (
                <Button className="w-full" onClick={placeOrder} disabled={saving}>
                  {saving && <Loader2 className="size-4 animate-spin" />} Place order · ₦{total.toLocaleString()}
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link to="/auth">Sign in to place order</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}