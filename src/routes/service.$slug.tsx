import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, MessageCircle } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { ServiceRequestForm } from "@/components/site/ServiceRequestForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { business, disclaimers, telLink, waLink } from "@/config/business";
import { getCategory, getService } from "@/data/catalog";
import { PriceTag } from "@/components/site/PriceTag";

export const Route = createFileRoute("/service/$slug")({
  loader: ({ params }) => {
    const service = getService(params.slug);
    if (!service) throw notFound();
    return { slug: service.slug, name: service.name, summary: service.summary };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Service not found — BRAIN STACK CAFE" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.name} — BRAIN STACK CAFE`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.summary },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.summary },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => (
    <SiteLayout>
      <PageHero title="This service didn't load" description="Please try again or contact us on WhatsApp." />
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <PageHero title="Service not found" description="The service you're looking for doesn't exist." />
    </SiteLayout>
  ),
  component: ServicePage,
});

function ServicePage() {
  const { slug } = Route.useLoaderData();
  const service = getService(slug)!;
  const category = getCategory(service.category);

  return (
    <SiteLayout>
      <PageHero eyebrow={category?.name} title={service.name} description={service.summary}>
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="bsc-gold border-0 text-accent-foreground">
            <PriceTag slug={service.slug} />
          </Badge>
          <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">
            {service.delivery === "hybrid" ? "Online or in-centre" : service.delivery === "online" ? "Online" : "In-centre"}
          </Badge>
        </div>
      </PageHero>

      <div className="bsc-container grid gap-8 py-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          {service.description && <p className="text-base text-muted-foreground">{service.description}</p>}

          <h2 className="mt-8 text-lg font-semibold">What you'll need</h2>
          <ul className="mt-3 space-y-2">
            {service.requirements.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>

          {service.priceNote && (
            <p className="mt-4 text-sm text-muted-foreground">{service.priceNote}</p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-success text-success-foreground hover:bg-success/90">
              <a href={waLink(`Hello ${business.name}, I need help with ${service.name}.`)} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" /> WhatsApp about this service
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={telLink}>Call {business.phone}</a>
            </Button>
          </div>

          <p className="mt-8 rounded-2xl border border-border bg-secondary/60 p-5 text-xs text-muted-foreground">
            {service.category === "research" ? disclaimers.academic : disclaimers.thirdParty}
          </p>

          <p className="mt-6 text-sm text-muted-foreground">
            Already submitted?{" "}
            <Link to="/track" className="font-semibold text-primary underline">
              Track your request
            </Link>
            .
          </p>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Start your request</h2>
          <ServiceRequestForm service={service} />
        </div>
      </div>
    </SiteLayout>
  );
}