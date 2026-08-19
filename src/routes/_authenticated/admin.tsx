import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, ShieldAlert, Trash2, Award } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormPdfButton } from "@/components/site/FormPdfButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  getAdminOverview,
  updateRequestStatus,
  updateOrderStatus,
  saveProduct,
  deleteProduct,
  getDocumentDownloadUrl,
  saveDeliverable,
  deleteDeliverable,
  getDeliverableDownloadUrl,
  type AdminProductRow,
  type RequestDeliverable,
} from "@/lib/admin.functions";
import { listServicePrices, saveServicePrice, type ServicePrice } from "@/lib/pricing.functions";
import { services as catalogServices, getCategory } from "@/data/catalog";
import { listAllAnnouncements, saveAnnouncement, deleteAnnouncement, type Announcement } from "@/lib/announcements.functions";

const REQUEST_STATUSES = [
  "submitted",
  "payment_confirmed",
  "processing",
  "completed",
  "requires_attention",
] as const;

const ORDER_STATUSES = [
  "submitted",
  "payment_confirmed",
  "processing",
  "dispatched",
  "completed",
  "cancelled",
] as const;

const PRODUCT_CATEGORIES = [
  "Laptops",
  "Desktops",
  "Monitors",
  "Keyboards & Mice",
  "Storage",
  "Networking",
  "Printers & Scanners",
  "Accessories",
  "Software",
  "Other",
] as const;

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin — BRAIN STACK CAFE" },
      { name: "description", content: "Manage service requests, shop orders and product listings." },
      { property: "og:title", content: "Admin — BRAIN STACK CAFE" },
      { property: "og:description", content: "Internal operations dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AdminPage() {
  const fetchOverview = useServerFn(getAdminOverview);
  const { data, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: fetchOverview });

  const fetchAnnouncements = useServerFn(listAllAnnouncements);
  const { data: announcementsData, isLoading: announcementsLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
    enabled: !isLoading && !!data?.isAdmin,
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="bsc-container flex items-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading admin data…
        </div>
      </SiteLayout>
    );
  }

  if (!data?.isAdmin) {
    return (
      <SiteLayout>
        <div className="bsc-container py-20">
          <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center">
            <ShieldAlert className="mx-auto size-8" />
            <h1 className="mt-4 font-display text-xl font-bold">Admins only</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account does not have admin access to this dashboard.
            </p>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const paidRequests = data.requests.filter((r) => r.payment_status === "paid").length;
  const revenue = data.orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <SiteLayout>
      <div className="bsc-container py-12">
        <h1 className="font-display text-3xl font-bold">Admin dashboard</h1>
        <p className="mt-1 text-muted-foreground">Requests, orders and shop inventory.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Stat label="Requests" value={String(data.requests.length)} />
          <Stat label="Paid requests" value={String(paidRequests)} />
          <Stat label="Orders" value={String(data.orders.length)} />
          <Stat label="Shop revenue" value={`₦${revenue.toLocaleString()}`} />
        </div>

        <Tabs defaultValue="requests" className="mt-8">
          <TabsList>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-6 space-y-3">
            {data.requests.length === 0 && <Empty text="No requests yet." />}
            {data.requests.map((r) => (
              <RequestRow key={r.id} row={r} />
            ))}
          </TabsContent>

          <TabsContent value="orders" className="mt-6 space-y-3">
            {data.orders.length === 0 && <Empty text="No orders yet." />}
            {data.orders.map((o) => (
              <OrderRow key={o.id} row={o} />
            ))}
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <ProductManager products={data.products} />
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <PricingManager />
          </TabsContent>
          <TabsContent value="announcements" className="mt-6">
            <AnnouncementManager
              announcements={announcementsData?.announcements ?? []}
              isLoading={announcementsLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bsc-card rounded-lg p-4">
      <p className="bsc-label text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
      {text}
    </div>
  );
}

function DocumentItem({
  doc,
}: {
  doc: {
    id: string;
    label: string;
    file_name: string;
    storage_path: string;
    content_type: string | null;
    size_bytes: number | null;
  };
}) {
  const getUrl = useServerFn(getDocumentDownloadUrl);
  const [loading, setLoading] = useState(false);

  const ext = doc.file_name.split(".").pop()?.toLowerCase();
  let icon = "📎";
  if (ext === "pdf") icon = "📄";
  else if (["doc", "docx"].includes(ext ?? "")) icon = "📝";
  else if (["jpg", "jpeg", "png", "gif"].includes(ext ?? "")) icon = "🖼️";

  const download = async () => {
    setLoading(true);
    try {
      const { url } = await getUrl({ data: { storagePath: doc.storage_path } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded bg-secondary/50">
      <div className="flex-shrink-0">
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{doc.label}</p>
        <p className="text-xs text-muted-foreground">
          {doc.file_name} ({Math.round((doc.size_bytes ?? 0) / 1024)} KB)
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={download} disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />} View
      </Button>
    </div>
  );
}

function DeliverableManager({
  requestId,
  deliverables,
}: {
  requestId: string;
  deliverables: RequestDeliverable[];
}) {
  const queryClient = useQueryClient();
  const getUrl = useServerFn(getDeliverableDownloadUrl);
  const save = useServerFn(saveDeliverable);
  const remove = useServerFn(deleteDeliverable);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("Certificate of Registration");

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    if (!label.trim()) {
      toast.error("Give this document a label first.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const path = `${requestId}/${crypto.randomUUID()}-${Date.now()}-${file.name.replace(/[/\\]/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("completion-documents")
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      await save({
        data: {
          requestId,
          label: label.trim(),
          fileName: file.name,
          storagePath: path,
          contentType: file.type || null,
          sizeBytes: file.size,
        },
      });

      toast.success("Document sent to customer.");
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload document.");
    } finally {
      setUploading(false);
    }
  };

  const view = async (storagePath: string) => {
    try {
      const { url } = await getUrl({ data: { storagePath } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open file.");
    }
  };

  const destroy = async (id: string) => {
    try {
      await remove({ data: { id } });
      toast.success("Document removed.");
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete document.");
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-3">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Award className="size-4" /> Send document to customer
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Certificate of Registration"
          className="max-w-xs"
        />
        <Input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
          disabled={uploading}
          className="max-w-xs"
        />
        {uploading && <Loader2 className="size-4 animate-spin self-center" />}
      </div>

      {deliverables?.length > 0 && (
        <div className="mt-3 space-y-2">
          {deliverables?.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded bg-background px-3 py-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{d.label}</p>
                <p className="text-xs text-muted-foreground">
                  {d.file_name} ({Math.round((d.size_bytes ?? 0) / 1024)} KB)
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => view(d.storage_path)}>
                View
              </Button>
              <Button size="sm" variant="outline" onClick={() => destroy(d.id)} aria-label="Delete document">
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RequestRow({
  row,
}: {
  row: {
    id: string;
    reference: string;
    service_name: string;
    status: string;
    payment_status: string;
    amount: number | null;
    notes: string | null;
    created_at: string;
    user_id: string | null;
    documents: Array<{
      id: string;
      label: string;
      file_name: string;
      storage_path: string;
      content_type: string | null;
      size_bytes: number | null;
      created_at: string;
    }>;
    deliverables: RequestDeliverable[];
  };
}) {
  const queryClient = useQueryClient();
  const update = useServerFn(updateRequestStatus);
  const [status, setStatus] = useState(row.status);
  const [notes, setNotes] = useState(row.notes ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await update({
        data: {
          id: row.id,
          status: status,
          notes: notes.trim() || null,
        },
      });
      toast.success("Request updated and customer notified.");
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bsc-card rounded-lg p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display font-semibold">{row.service_name}</p>
          <p className="text-xs text-muted-foreground">
            {row.reference} · {new Date(row.created_at).toLocaleDateString()} ·{" "}
            {row.amount ? `₦${row.amount.toLocaleString()}` : "Price on request"} · {row.payment_status}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FormPdfButton requestId={row.id} />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REQUEST_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />} Save
          </Button>
        </div>
      </div>
      <Textarea
        className="mt-3"
        rows={2}
        placeholder="Note for the customer (sent by email)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {row.documents.length > 0 && (
        <div className="mt-4">
          <p className="font-medium text-sm mb-2">Attached Documents:</p>
          <div className="space-y-2">
            {row.documents.map((doc) => (
              <DocumentItem key={doc.id} doc={doc} />
            ))}
          </div>
        </div>
      )}

      <DeliverableManager requestId={row.id} deliverables={row.deliverables} />
    </div>
  );
}

function OrderRow({
  row,
}: {
  row: {
    id: string;
    reference: string | null;
    status: string;
    payment_status: string;
    delivery_method: string;
    delivery_address: string | null;
    total_amount: number;
    created_at: string;
    shop_order_items: { id: string; product_name: string; quantity: number; unit_price: number }[];
  };
}) {
  const queryClient = useQueryClient();
  const update = useServerFn(updateOrderStatus);
  const [status, setStatus] = useState(row.status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await update({ data: { id: row.id, status: status } });
      toast.success("Order updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (error) {
  console.error("Upload failed:", error);
  toast.error(error instanceof Error ? error.message : "Could not upload document.");
} finally {
      setSaving(false);
    }
  };

  return (
    <div className="bsc-card rounded-lg p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display font-semibold">
            {row.reference ?? row.id.slice(0, 8)} · ₦{row.total_amount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(row.created_at).toLocaleDateString()} · {row.delivery_method}
            {row.delivery_address ? ` · ${row.delivery_address}` : ""} · {row.payment_status}
          </p>
          <ul className="mt-2 text-sm text-muted-foreground">
            {row.shop_order_items.map((i) => (
              <li key={i.id}>
                {i.product_name} × {i.quantity}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />} Save
          </Button>
        </div>
      </div>
    </div>
  );
}

const emptyProduct = {
  slug: "",
  name: "",
  category: "Laptops",
  summary: "",
  price: "",
  condition: "New" as const,
  in_stock: true,
  waybill: true,
  is_active: true,
  image_url: "",
};

function ProductManager({ products }: { products: AdminProductRow[] }) {
  const queryClient = useQueryClient();
  const save = useServerFn(saveProduct);
  const remove = useServerFn(deleteProduct);
  const [form, setForm] = useState({ ...emptyProduct });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setForm({ ...emptyProduct });
    setEditingId(null);
  };

  const handleImageSelect = async (file: File | null) => {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Use a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB.");
      return;
    }

    setUploading(true);
    try {
      const path = `${crypto.randomUUID()}-${Date.now()}-${file.name.replace(/[/\\]/g, "_")}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success("Image uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      await save({
        data: {
          ...(editingId ? { id: editingId } : {}),
          slug: form.slug.trim().toLowerCase(),
          name: form.name.trim(),
          category: form.category,
          summary: form.summary.trim() || null,
          price: form.price ? Number(form.price) : null,
          condition: form.condition,
          in_stock: form.in_stock,
          waybill: form.waybill,
          is_active: form.is_active,
          image_url: form.image_url.trim() || null,
        },
      });
      toast.success(editingId ? "Product updated." : "Product added.");
      reset();
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (p: AdminProductRow) => {
    setEditingId(p.id);
    setForm({
      slug: p.slug,
      name: p.name,
      category: p.category,
      summary: p.summary ?? "",
      price: p.price ? String(p.price) : "",
      condition: p.condition as const,
      in_stock: p.in_stock,
      waybill: p.waybill,
      is_active: p.is_active,
      image_url: p.image_url ?? "",
    });
  };

  const destroy = async (id: string) => {
    try {
      await remove({ data: { id } });
      toast.success("Product removed.");
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete product.");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <div className="bsc-card h-fit rounded-lg p-5">
        <h2 className="font-display text-lg font-semibold">
          {editingId ? "Edit product" : "Add product"}
        </h2>
        <div className="mt-4 space-y-3">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Slug (url id)">
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="hp-elitebook-840"
            />
          </Field>
          <Field label="Category">
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Summary">
            <Textarea
              rows={2}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </Field>
          <Field label="Price (₦)">
            <Input
              inputMode="numeric"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, "") })}
            />
          </Field>
          <Field label="Condition">
            <Select
              value={form.condition}
              onValueChange={(v) => setForm({ ...form, condition: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["New", "UK Used", "Refurbished"].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Product image">
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
                disabled={uploading}
              />
              {uploading && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> Uploading…
                </p>
              )}
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="Product preview"
                  className="h-24 w-24 rounded border border-border object-cover"
                />
              )}
            </div>
          </Field>

          <Toggle
            label="In stock"
            checked={form.in_stock}
            onChange={(v) => setForm({ ...form, in_stock: v })}
          />
          <Toggle
            label="Waybill available"
            checked={form.waybill}
            onChange={(v) => setForm({ ...form, waybill: v })}
          />
          <Toggle
            label="Visible in shop"
            checked={form.is_active}
            onChange={(v) => setForm({ ...form, is_active: v })}
          />

          <div className="flex gap-2 pt-2">
            <Button onClick={submit} disabled={saving || uploading || !form.name || !form.slug} className="flex-1">
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editingId ? "Save changes" : "Add product"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {products.length === 0 && <Empty text="No products yet — add your first item." />}
        {products.map((p) => (
          <div key={p.id} className="bsc-card flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
            <div className="flex items-center gap-3">
              {p.image_url && (
                <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded border border-border object-cover" />
              )}
              <div>
                <p className="font-display font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.category} · {p.condition} ·{" "}
                  {p.price ? `₦${p.price.toLocaleString()}` : "Price on request"} ·{" "}
                  {p.in_stock ? "In stock" : "Out of stock"} · {p.is_active ? "Visible" : "Hidden"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => edit(p)}>
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => destroy(p.id)} aria-label="Delete product">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function PricingManager() {
  const fetchPrices = useServerFn(listServicePrices);
  const savePrice = useServerFn(saveServicePrice);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ prices: ServicePrice[] }>({
    queryKey: ["service-prices"],
    queryFn: fetchPrices,
  });

  const byslug = new Map<string, number | null>();
  for (const p of data?.prices ?? []) byslug.set(p.slug, p.price);

  const rows = catalogServices.filter(
    (s) =>
      !filter ||
      s.name.toLowerCase().includes(filter.toLowerCase()) ||
      s.slug.includes(filter.toLowerCase()),
  );

  const commit = async (slug: string, name: string, categorySlug: string) => {
    const raw = drafts[slug];
    const price = raw === undefined || raw === "" ? null : Number(raw);
    setSavingSlug(slug);
    try {
      await savePrice({ data: { slug, name, categorySlug, price } });
      toast.success(`${name} price updated.`);
      queryClient.invalidateQueries({ queryKey: ["service-prices"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save price.");
    } finally {
      setSavingSlug(null);
    }
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Set the price of every service here. Prices show across the site to signed-in customers and
        are charged on payment or wallet debit. Leave blank for "Price on request".
      </p>
      <Input
        className="mt-4 max-w-sm"
        placeholder="Search services…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {isLoading ? (
        <div className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading prices…
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {rows.map((s) => {
            const current = byslug.get(s.slug) ?? null;
            const value = drafts[s.slug] ?? (current === null ? "" : String(current));
            return (
              <div
                key={s.slug}
                className="bsc-card flex flex-wrap items-center justify-between gap-3 rounded-lg p-4"
              >
                <div>
                  <p className="font-display font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getCategory(s.category)?.name ?? s.category} ·{" "}
                    {current === null ? "Price on request" : `₦${current.toLocaleString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    className="w-40"
                    inputMode="numeric"
                    placeholder="₦ amount"
                    value={value}
                    onChange={(e) =>
                      setDrafts({ ...drafts, [s.slug]: e.target.value.replace(/\D/g, "") })
                    }
                  />
                  <Button size="sm" onClick={() => commit(s.slug, s.name, s.category)} disabled={savingSlug === s.slug}>
                    {savingSlug === s.slug && <Loader2 className="size-4 animate-spin" />} Save
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const emptyAnnouncement = {
  message: "",
  link_url: "",
  is_active: true,
  priority: 0,
};

function AnnouncementManager({
  announcements,
  isLoading,
}: {
  announcements: Announcement[];
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const save = useServerFn(saveAnnouncement);
  const remove = useServerFn(deleteAnnouncement);
  const [form, setForm] = useState({ ...emptyAnnouncement });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reset = () => {
    setForm({ ...emptyAnnouncement });
    setEditingId(null);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await save({
        data: {
          ...(editingId ? { id: editingId } : {}),
          message: form.message.trim(),
          link_url: form.link_url.trim() || null,
          is_active: form.is_active,
          priority: form.priority,
        },
      });
      toast.success(editingId ? "Announcement updated." : "Announcement added.");
      reset();
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({
      message: a.message,
      link_url: a.link_url ?? "",
      is_active: a.is_active,
      priority: a.priority,
    });
  };

  const destroy = async (id: string) => {
    setDeletingId(id);
    try {
      await remove({ data: { id } });
      toast.success("Announcement removed.");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete announcement.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <div className="bsc-card h-fit rounded-lg p-5">
        <h2 className="font-display text-lg font-semibold">
          {editingId ? "Edit announcement" : "Add announcement"}
        </h2>
        <div className="mt-4 space-y-3">
          <Field label="Message">
            <Textarea
              rows={3}
              maxLength={280}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </Field>
          <Field label="Link URL (optional)">
            <Input
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="https://…"
            />
          </Field>
          <Field label="Priority (0–100, higher shows first)">
            <Input
              inputMode="numeric"
              value={String(form.priority)}
              onChange={(e) =>
                setForm({ ...form, priority: Number(e.target.value.replace(/\D/g, "")) || 0 })
              }
            />
          </Field>
          <Toggle
            label="Active"
            checked={form.is_active}
            onChange={(v) => setForm({ ...form, is_active: v })}
          />
          <div className="flex gap-2 pt-2">
            <Button onClick={submit} disabled={saving || !form.message.trim()} className="flex-1">
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editingId ? "Save changes" : "Add announcement"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading announcements…
          </div>
        ) : announcements.length === 0 ? (
          <Empty text="No announcements yet." />
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="bsc-card flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
              <div>
                <p className="font-medium">{a.message}</p>
                <p className="text-xs text-muted-foreground">
                  Priority {a.priority} · {a.is_active ? "Active" : "Inactive"}
                  {a.link_url ? ` · ${a.link_url}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(a)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => destroy(a.id)}
                  disabled={deletingId === a.id}
                  aria-label="Delete announcement"
                >
                  {deletingId === a.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded border border-border px-3 py-2">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}