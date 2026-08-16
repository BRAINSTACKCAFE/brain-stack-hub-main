import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Check } from "lucide-react";
import { categoryIcons, type Service } from "@/data/catalog";
import { PriceTag } from "@/components/site/PriceTag";

export function ServiceCard({ service }: { service: Service }) {
  const Icon = categoryIcons[service.category] ?? Check;
  return (
    <Link
      to="/service/$slug"
      params={{ slug: service.slug }}
      className="bsc-card bsc-card-hover group flex flex-col rounded-lg p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <Icon className="size-5 text-foreground" aria-hidden />
        {service.popular && (
          <span className="bsc-label rounded-full bg-accent px-2.5 py-1 text-accent-foreground">
            Popular
          </span>
        )}
      </div>
      <h3 className="mt-5 text-base font-semibold leading-snug">{service.name}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{service.summary}</p>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="bsc-label text-muted-foreground">
          <PriceTag slug={service.slug} asLink={false} />
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold">
          {service.cta ?? "Get started"}
          <ArrowUpRight
            className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}