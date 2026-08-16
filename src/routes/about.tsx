import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { business, disclaimers } from "@/config/business";
import { categories } from "@/data/catalog";

const title = "About BRAIN STACK CAFE — Digital & Student Service Centre";
const description =
  "BRAIN STACK CAFE is a digital, educational and ICT service centre helping students, professionals and businesses access essential services conveniently.";

export const Route = createFileRoute("/about")({
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
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <PageHero eyebrow="About us" title={business.promise} description={description} />

      <div className="bsc-container grid gap-10 py-12 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5 text-base text-muted-foreground">
          <p>
            From NIN and JAMB services to online registration, academic support, ICT training,
            utility payments, printing and research assistance — BRAIN STACK CAFE makes essential
            digital services simple and accessible.
          </p>
          <p>
            We work with students, job seekers, professionals, small businesses and everyday
            customers. Instead of moving between different offices and platforms, you can discover
            a service, complete the correct form, upload documents where necessary, pay, receive a
            reference number and track progress in one place.
          </p>
          <p className="rounded-2xl border border-border bg-secondary/60 p-5 text-sm">
            {disclaimers.thirdParty}
          </p>
          <p className="rounded-2xl border border-border bg-secondary/60 p-5 text-sm">
            {disclaimers.academic}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 bsc-card">
          <h2 className="text-lg font-semibold">What we cover</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {categories.map((c) => (
              <li key={c.slug} className="flex items-start gap-3">
                <c.icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="font-medium">{c.name}</span>
                  <span className="block text-muted-foreground">{c.blurb}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SiteLayout>
  );
}