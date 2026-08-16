import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { business } from "@/config/business";

const title = "Privacy Policy — BRAIN STACK CAFE";
const description =
  "How BRAIN STACK CAFE collects, uses, stores and protects personal, identity, academic, document and payment information.";

export const Route = createFileRoute("/privacy")({
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
  component: Privacy,
});

const sections: { h: string; p: string }[] = [
  { h: "Information we collect", p: "Personal information such as your name and contact details, identity information required by a specific service, academic information, documents you upload and payment records related to your requests." },
  { h: "How we use your information", p: "We use your information only to process the service you requested, contact you about that request, verify payment, meet third-party requirements where a service depends on an external body, and improve our support." },
  { h: "Documents you upload", p: "Uploaded documents are stored privately and are accessible only to authorised BRAIN STACK CAFE staff processing your request. Documents are never published or made publicly accessible." },
  { h: "Payment information", p: "Payments are processed through a secure payment provider. Card and banking credentials are handled by that provider, not stored on our systems." },
  { h: "Third-party processors", p: "Some services depend on government agencies, examination bodies or other platforms. Information required for those services is shared only to the extent needed to complete your request." },
  { h: "Data retention", p: "We retain request records for as long as necessary to deliver the service, respond to disputes and meet legal or record-keeping obligations." },
  { h: "Your rights", p: "You may request access to, correction of, or deletion of your personal data, subject to any legal obligation to keep certain records." },
  { h: "Security", p: "We use secure authentication, access controls, encrypted connections and private document storage. No system is perfectly secure, so we also ask customers to protect their account details." },
];

function Privacy() {
  return (
    <SiteLayout>
      <PageHero eyebrow="Legal" title="Privacy Policy" description={description} />
      <div className="bsc-container max-w-3xl py-12">
        <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          This policy is a working draft. Because sensitive personal data may be involved, the final
          wording should be reviewed by a legal professional before launch.
        </p>
        {sections.map((s) => (
          <section key={s.h} className="mt-8">
            <h2 className="text-lg font-semibold">{s.h}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{s.p}</p>
          </section>
        ))}
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Questions about this policy: {business.email} or {business.phone}.
          </p>
        </section>
      </div>
    </SiteLayout>
  );
}