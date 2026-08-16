import { createFileRoute, notFound } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { ServiceCard } from "@/components/site/ServiceCard";
import { Button } from "@/components/ui/button";
import { business, disclaimers, waLink } from "@/config/business";
import { getCategory, servicesInCategory } from "@/data/catalog";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const category = getCategory(params.slug);
    if (!category) throw notFound();
    return { name: category.name, blurb: category.blurb, slug: category.slug };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Service category not found — BRAIN STACK CAFE" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.name} — BRAIN STACK CAFE`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.blurb },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.blurb },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => (
    <SiteLayout>
      <PageHero title="This category didn't load" description="Please try again or contact us on WhatsApp." />
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <PageHero title="Category not found" description="The service category you're looking for doesn't exist." />
    </SiteLayout>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { name, blurb, slug } = Route.useLoaderData();
  const items = servicesInCategory(slug);

  return (
    <SiteLayout>
      <PageHero eyebrow="Category" title={name} description={blurb}>
        <Button asChild className="bg-success text-success-foreground hover:bg-success/90">
          <a href={waLink(`Hello ${business.name}, I need help with ${name}.`)} target="_blank" rel="noreferrer">
            Need help with this category? WhatsApp us
          </a>
        </Button>
      </PageHero>

      <div className="bsc-container py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <ServiceCard key={s.slug} service={s} />
          ))}
        </div>

        <p className="mt-10 rounded-2xl border border-border bg-secondary/60 p-5 text-xs text-muted-foreground">
          {slug === "research" ? disclaimers.academic : disclaimers.thirdParty}
        </p>
      </div>
    </SiteLayout>
  );
}