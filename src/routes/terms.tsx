import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { disclaimers } from "@/config/business";

const title = "Terms & Conditions — BRAIN STACK CAFE";
const description =
  "Terms covering service requests, payment, refunds, processing times, customer responsibilities and third-party service dependencies at BRAIN STACK CAFE.";

export const Route = createFileRoute("/terms")({
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
  component: Terms,
});

const sections: { h: string; p: string }[] = [
  { h: "Service requests", p: "A request is only considered received once it has been submitted through the platform and a reference number has been issued." },
  { h: "Payment", p: "Services are delivered after payment is confirmed. Confirmation is verified on our side — a completed checkout screen alone does not confirm payment." },
  { h: "Refunds and cancellation", p: "Refund eligibility depends on how far a request has progressed and on the policies of any third party involved. The refund policy will be published once finalised." },
  { h: "Incorrect customer information", p: "You are responsible for the accuracy of the information and documents you submit. Requests delayed or rejected because of incorrect details may attract additional charges." },
  { h: "Document requirements", p: "Some services cannot proceed without specific supporting documents. We will tell you what is missing and mark the request as requiring attention." },
  { h: "Third-party dependencies", p: disclaimers.thirdParty },
  { h: "Academic support limitations", p: disclaimers.academic },
  { h: "Processing times", p: "Processing times vary by service and by the third parties involved. Estimates given are indicative, not guarantees." },
  { h: "Service availability", p: "Services may be temporarily unavailable due to maintenance or third-party downtime." },
  { h: "Liability", p: "Our liability for any request is limited to the amount paid for that request, to the extent permitted by law." },
];

function Terms() {
  return (
    <SiteLayout>
      <PageHero eyebrow="Legal" title="Terms & Conditions" description={description} />
      <div className="bsc-container max-w-3xl py-12">
        {sections.map((s) => (
          <section key={s.h} className="mt-8 first:mt-0">
            <h2 className="text-lg font-semibold">{s.h}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{s.p}</p>
          </section>
        ))}
      </div>
    </SiteLayout>
  );
}