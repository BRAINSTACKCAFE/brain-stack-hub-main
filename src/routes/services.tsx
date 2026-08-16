import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { ServiceCard } from "@/components/site/ServiceCard";
import { categories, searchServices, type Audience, type Delivery } from "@/data/catalog";

const title = "All Services — BRAIN STACK CAFE";
const description =
  "Browse every BRAIN STACK CAFE service: NIN & BVN, JAMB and examinations, NERD & NYSC, CAC & NGO registration, research support, ICT training, printing, binding, CAC support and utilities.";

export const Route = createFileRoute("/services")({
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
  component: ServicesPage,
});

type Filter = "all" | "popular" | Delivery | Audience;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "popular", label: "Popular" },
  { key: "online", label: "Online" },
  { key: "physical", label: "In-centre" },
  { key: "student", label: "Student" },
  { key: "business", label: "Business" },
];

function ServicesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [filter, setFilter] = useState<Filter>("all");

  const results = useMemo(() => {
    let list = searchServices(query);
    if (category !== "all") list = list.filter((s) => s.category === category);
    if (filter === "popular") list = list.filter((s) => s.popular);
    else if (filter === "online" || filter === "physical")
      list = list.filter((s) => s.delivery === filter || s.delivery === "hybrid");
    else if (filter === "student" || filter === "business" || filter === "general")
      list = list.filter((s) => s.audience.includes(filter));
    return list;
  }, [query, category, filter]);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Service marketplace"
        title="Find the service you need"
        description="Search by name or keyword — NIN, JAMB, WAEC, NECO, NERD, NYSC, SPSS, binding, CAC, airtime and more."
      >
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services…"
            aria-label="Search services"
            className="h-12 bg-card pl-10 text-foreground"
          />
        </div>
      </PageHero>

      <div className="bsc-container py-10">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={category === "all" ? "secondary" : "ghost"}
            onClick={() => setCategory("all")}
          >
            All categories
          </Button>
          {categories.map((c) => (
            <Button
              key={c.slug}
              size="sm"
              variant={category === c.slug ? "secondary" : "ghost"}
              onClick={() => setCategory(c.slug)}
            >
              {c.name}
            </Button>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          {results.length} service{results.length === 1 ? "" : "s"} found
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((s) => (
            <ServiceCard key={s.slug} service={s} />
          ))}
        </div>

        {results.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No service matched that search. Try a different keyword or message us on WhatsApp.
          </p>
        )}
      </div>
    </SiteLayout>
  );
}