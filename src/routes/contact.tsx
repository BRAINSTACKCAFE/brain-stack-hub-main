import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { business, mailLink, telLink, waLink } from "@/config/business";

const title = "Contact BRAIN STACK CAFE — Phone, WhatsApp & Email";
const description =
  "Reach BRAIN STACK CAFE on 07038944249 by phone or WhatsApp, or email brainstackcafe@gmail.com for digital, academic and ICT services.";

export const Route = createFileRoute("/contact")({
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
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  subject: z.string().trim().min(1, "Subject is required").max(150),
  message: z.string().trim().min(1, "Message is required").max(1500),
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      toast.error("Please check the highlighted fields.");
      return;
    }
    setErrors({});
    window.open(
      waLink(
        `Hello ${business.name}.\nName: ${parsed.data.name}\nEmail: ${parsed.data.email}\nSubject: ${parsed.data.subject}\n\n${parsed.data.message}`,
      ),
      "_blank",
      "noopener",
    );
    toast.success("Opening WhatsApp with your message.");
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Contact"
        title="Talk to BRAIN STACK CAFE"
        description="Call, message on WhatsApp or send an email — we'll guide you to the right service."
      />

      <div className="bsc-container grid gap-8 py-12 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          <a href={telLink} className="bsc-card flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
            <Phone className="size-5 text-primary" aria-hidden />
            <span>
              <span className="block text-sm text-muted-foreground">Phone</span>
              <span className="font-semibold">{business.phone}</span>
            </span>
          </a>
          <a
            href={waLink(`Hello ${business.name}, I have an enquiry.`)}
            target="_blank"
            rel="noreferrer"
            className="bsc-card flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
          >
            <MessageCircle className="size-5 text-success" aria-hidden />
            <span>
              <span className="block text-sm text-muted-foreground">WhatsApp</span>
              <span className="font-semibold">{business.phone}</span>
            </span>
          </a>
          <a href={mailLink} className="bsc-card flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
            <Mail className="size-5 text-primary" aria-hidden />
            <span className="min-w-0">
              <span className="block text-sm text-muted-foreground">Email</span>
              <span className="block break-all font-semibold">{business.email}</span>
            </span>
          </a>
          <p className="rounded-2xl border border-dashed border-border p-5 text-xs text-muted-foreground">
            Physical address and opening hours will be published once confirmed.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 bsc-card">
          <h2 className="text-lg font-semibold">Send a message</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors["name"] && <p className="mt-1 text-xs text-destructive">{errors["name"]}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" className="mt-1.5" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {errors["email"] && <p className="mt-1 text-xs text-destructive">{errors["email"]}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" className="mt-1.5" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              {errors["subject"] && <p className="mt-1 text-xs text-destructive">{errors["subject"]}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" rows={5} className="mt-1.5" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              {errors["message"] && <p className="mt-1 text-xs text-destructive">{errors["message"]}</p>}
            </div>
          </div>
          <Button type="submit" className="mt-5 w-full">Send message</Button>
        </form>
      </div>
    </SiteLayout>
  );
}