import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Copy, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { business, waLink } from "@/config/business";
import { useAuth } from "@/hooks/use-auth";
import { useServicePrices } from "@/hooks/use-prices";
import { createRequest, createGuestRequest } from "@/lib/requests.functions";
import { supabase } from "@/integrations/supabase/client";
import type { Service, ServiceField, ServiceStep } from "@/data/catalog";

const MAX_FILE_SIZE = 600 * 1024;

interface UploadedFile {
  id: string;
  name: string;
  label: string;
  size: number;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  uploadError?: string;
  filePath?: string;
}

type Values = Record<string, string>;
type FileUploads = Record<string, UploadedFile | undefined>;

const genericStep: ServiceStep = {
  title: "Your request",
  fields: [
    { name: "fullName", label: "Full name", type: "text", required: true },
    { name: "phone", label: "Phone number", type: "tel", required: true },
    { name: "email", label: "Email address", type: "email" },
    { name: "details", label: "Tell us what you need", type: "textarea", required: true },
  ],
};

function validate(fields: ServiceField[], values: Values) {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    if (f.type === "file") continue; // file fields are validated separately, against selectedFiles/uploads
    const v = (values[f.name] ?? "").trim();
    if (f.required && !v) errors[f.name] = `${f.label} is required`;
    else if (v && f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
      errors[f.name] = "Enter a valid email address";
    else if (v && f.type === "tel" && !/^[0-9+\-\s()]{7,20}$/.test(v))
      errors[f.name] = "Enter a valid phone number";
    else if (v.length > 2000) errors[f.name] = "This entry is too long";
  }
  return errors;
}

function computePrice(service: Service, values: Values): number | null {
  const rules = service.pricing;
  if (!rules || rules.type !== "perPage") return null;
  const pages = Number(values[rules.field] ?? 0);
  if (!Number.isFinite(pages) || pages <= 0) return null;
  const tier =
    rules.tiers.find((t) => t.upTo !== null && pages <= t.upTo) ??
    rules.tiers[rules.tiers.length - 1];
  return tier ? Math.round(pages * tier.rate) : null;
}

export function ServiceRequestForm({ service }: { service: Service }) {
  const steps = useMemo(() => service.steps ?? [genericStep], [service]);
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | undefined>>({});
  const [uploads, setUploads] = useState<FileUploads>({});
  const [ref, setRef] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { priceFor, canSeePrices } = useServicePrices();
  const computed = computePrice(service, values);
  const amount = computed ?? priceFor(service.slug) ?? service.price ?? null;
  const submitRequest = useServerFn(createRequest);
  const submitGuestRequest = useServerFn(createGuestRequest);

  const reviewing = index === steps.length;
  const total = steps.length + 1;
  const step = steps[index];

  const set = (name: string, value: string) => {
    const next = service.uppercase ? value.toUpperCase() : value;
    setValues((v) => ({ ...v, [name]: next }));
    setErrors((e) => ({ ...e, [name]: "" }));
  };

  const handleFileSelect = async (name: string, file: File | null) => {
    if (!file) {
      setSelectedFiles(prev => ({ ...prev, [name]: undefined }));
      setUploads(prev => ({ ...prev, [name]: undefined }));
      setErrors((e) => ({ ...e, [name]: "" }));
      return;
    }

    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!allowedTypes.includes(fileExt)) {
      setErrors((e) => ({ ...e, [name]: `Invalid file type. Allowed: PDF, DOC, DOCX, JPG, JPEG, PNG` }));
      setSelectedFiles(prev => ({ ...prev, [name]: undefined }));
      setUploads(prev => ({ ...prev, [name]: undefined }));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrors((e) => ({ ...e, [name]: `${file.name} must be less than 600 KB` }));
      setSelectedFiles(prev => ({ ...prev, [name]: undefined }));
      setUploads(prev => ({ ...prev, [name]: undefined }));
      return;
    }

    setErrors((e) => ({ ...e, [name]: "" }));
    setSelectedFiles(prev => ({ ...prev, [name]: file }));

    // NOTE: no `uploadError: undefined` / `filePath: undefined` here —
    // exactOptionalPropertyTypes forbids explicitly assigning undefined
    // to an optional prop; just omit the key instead.
    setUploads(prev => ({
      ...prev,
      [name]: {
        id: '',
        name: file.name,
        label: step?.fields.find(f => f.name === name)?.label ?? name,
        size: file.size,
        uploadStatus: 'uploading',
      }
    }));

    if (!user) {
      toast.error("User not authenticated. Please sign in and try again.");
      setUploads(prev => ({
        ...prev,
        [name]: {
          ...prev[name]!,
          uploadStatus: 'error',
          uploadError: 'User not authenticated'
        }
      }));
      return;
    }

    try {
      const { error: bucketError } = await supabase.storage.getBucket('request-documents');

      if (bucketError) {
        if (bucketError.message?.includes('not found') ||
            bucketError.message?.includes('Could not find the bucket')) {
          throw new Error(`Storage bucket 'request-documents' not found: ${bucketError.message}`);
        } else if (bucketError.message?.includes('Unauthorized')) {
          throw new Error("Unauthorized to access storage bucket");
        } else {
          throw new Error(`Storage bucket error: ${bucketError.message}`);
        }
      }

      const filePath = `${user.id}/${crypto.randomUUID()}-${Date.now()}-${file.name.replace(/[/\\]/g, '_')}`;

      const { error: uploadError } = await supabase.storage
        .from("request-documents")
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        let errorMessage = `Upload failed`;
        if (uploadError.message?.includes('Bucket')) {
          errorMessage += `: Storage bucket issue`;
        } else if (uploadError.message?.includes('Unauthorized')) {
          errorMessage += `: Unauthorized to upload`;
        } else if (uploadError.message?.includes('size')) {
          errorMessage += `: File too large (max 600 KB)`;
        } else {
          errorMessage += `: ${uploadError.message}`;
        }
        throw new Error(errorMessage);
      }

      const { error: docError } = await supabase.from("request_documents").insert({
        request_id: null,
        label: step?.fields.find(f => f.name === name)?.label ?? name,
        file_name: file.name,
        storage_path: filePath,
        content_type: file.type,
        size_bytes: file.size,
      });

      if (docError) throw new Error(`Could not record file: ${docError.message}`);

      setUploads(prev => ({
        ...prev,
        [name]: {
          ...prev[name]!,
          uploadStatus: 'success',
          filePath
        }
      }));

      toast.success(`File uploaded successfully`);
    } catch (error: any) {
      setUploads(prev => ({
        ...prev,
        [name]: {
          ...prev[name]!,
          uploadStatus: 'error',
          uploadError: error.message
        }
      }));
      toast.error(`Upload failed: ${error.message}`);
    }
  };

  const next = () => {
    if (!step) return;
    const errs = validate(step.fields, values);

    for (const f of step.fields) {
      if (f.type === "file") {
        const file = selectedFiles[f.name];
        const upload = uploads[f.name];

        if (f.required && !file) {
          errs[f.name] = `${f.label} is required`;
        } else if (upload && upload.uploadStatus === 'error') {
          errs[f.name] = upload.uploadError || `Upload failed`;
        } else if (upload && upload.uploadStatus === 'uploading') {
          errs[f.name] = `Still uploading...`;
        }
      }
    }

    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Please fix the errors above and try again.");
      return;
    }

    setIndex((i) => i + 1);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const fileUpdates: Array<{ fieldName: string; filePath: string }> = [];

      Object.entries(uploads).forEach(([fieldName, upload]) => {
        if (upload?.uploadStatus === 'success' && upload.filePath && selectedFiles[fieldName]) {
          fileUpdates.push({ fieldName, filePath: upload.filePath });
        }
      });

      const linkFiles = async (requestId: string) => {
        const promises = fileUpdates.map(update =>
          supabase.from("request_documents")
            .update({ request_id: requestId })
            .eq("storage_path", update.filePath)
        );
        await Promise.all(promises);
      };

      if (isAuthenticated) {
        const result = await submitRequest({
          data: {
            serviceSlug: service.slug,
            serviceName: service.name,
            categorySlug: service.category,
            amount,
            formData: values,
          },
        });

        await linkFiles(result.request.id);

        setRef(result.request.reference);
        toast.success("Request submitted", { description: `Reference ${result.request.reference}` });
        return;
      }

      const result = await submitGuestRequest({
        data: {
          serviceSlug: service.slug,
          serviceName: service.name,
          categorySlug: service.category,
          amount,
          formData: values,
        },
      });

      await linkFiles(result.request.id);

      setRef(result.request.reference);
      toast.success("Request saved", { description: `Reference ${result.request.reference}` });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save request");
    } finally {
      setSaving(false);
    }
  };

  if (ref) {
    const summary = Object.entries(values)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    return (
      <div className="rounded-2xl border border-border bg-card p-6 bsc-card">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-7 text-success" aria-hidden />
          <h3 className="text-lg font-semibold">Request prepared</h3>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Keep this reference number. Send it to us on WhatsApp to complete payment and start
          processing. You can track it any time from the tracking page.
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3">
          <span className="font-display text-lg font-bold tracking-wide">{ref}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void navigator.clipboard.writeText(ref);
              toast.success("Reference copied");
            }}
          >
            <Copy className="size-4" /> Copy
          </Button>
        </div>
        <Button asChild className="mt-5 w-full bg-success text-success-foreground hover:bg-success/90">
          <a
            href={waLink(
              "Hello " + business.name + ", I have submitted a request.\nReference: " + ref + "\nService: " + service.name + "\n" + summary
            )}
            target="_blank"
            rel="noreferrer"
          >
            Send on WhatsApp
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 bsc-card">
      {service.notice && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-accent/50 bg-accent/10 px-4 py-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-accent-foreground" aria-hidden />
          <p>{service.notice}</p>
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">Step {index + 1} of {total}</span>
        <span className="text-muted-foreground">{reviewing ? "Review & submit" : step?.title}</span>
      </div>
      <Progress value={((index + 1) / total) * 100} className="mt-3" />

      {canSeePrices && amount ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Amount payable:{" "}
          <span className="font-semibold text-foreground">₦{amount.toLocaleString()}</span>
          {computed ? " (calculated automatically)" : null}
        </p>
      ) : null}

      {!reviewing && step && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {step.fields.map((f) => (
            <div
              key={f.name}
              className={f.type === "textarea" || f.type === "select" ? "sm:col-span-2" : ""}
            >
              <Label htmlFor={f.name}>
                {f.label}
                {f.required && <span className="text-destructive"> *</span>}
              </Label>

              {f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  className="mt-1.5"
                  rows={4}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : f.type === "select" ? (
                <select
                  id={f.name}
                  className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                >
                  <option value="">Select an option</option>
                  {f.options?.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : f.type === "file" ? (
                <div className="mt-1.5">
                  <Input
                    id={f.name}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileSelect(f.name, e.target.files?.[0] ?? null)}
                    className="mb-2"
                  />

                  {selectedFiles[f.name] && (() => {
                    const file = selectedFiles[f.name]!;
                    const upload = uploads[f.name];
                    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
                    const icon = ['pdf'].includes(ext)
                      ? '📄'
                      : ['doc', 'docx'].includes(ext)
                      ? '📝'
                      : ['jpg', 'jpeg', 'png', 'gif'].includes(ext)
                      ? '🖼️'
                      : '📎';
                    return (
                      <div className="mt-2 p-3 rounded border">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">{icon}</div>
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm">{Math.round(file.size / 1024)} KB</p>
                            {upload && (
                              <>
                                {upload.uploadStatus === 'uploading' && (
                                  <p className="text-xs text-accent">Uploading...</p>
                                )}
                                {upload.uploadStatus === 'success' && (
                                  <p className="text-xs text-success">Uploaded ✓</p>
                                )}
                                {upload.uploadStatus === 'error' && (
                                  <p className="text-xs text-destructive">
                                    {upload.uploadError || 'Upload failed'}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <Input
                  id={f.name}
                  type={f.type}
                  className="mt-1.5"
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}

              {errors[f.name] && (
                <p className="mt-1 text-xs text-destructive">{errors[f.name]}</p>
              )}
              {f.help && <p className="mt-1 text-xs text-muted-foreground">{f.help}</p>}
            </div>
          ))}
        </div>
      )}

      {reviewing && (
        <dl className="mt-6 divide-y divide-border rounded-xl border border-border">
          {steps
            .flatMap((s) => s.fields)
            .map((f) => (
              <div key={f.name} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                <dt className="text-muted-foreground">{f.label}</dt>
                <dd className="text-right font-medium">{values[f.name] || "—"}</dd>
              </div>
            ))}
        </dl>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <ChevronLeft className="size-4" /> Previous
        </Button>
        {reviewing ? (
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {isAuthenticated ? "Save request" : "Submit request"}
          </Button>
        ) : (
          <Button onClick={next}>
            Next <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}