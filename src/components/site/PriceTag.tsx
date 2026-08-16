import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useServicePrices } from "@/hooks/use-prices";

export function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

/** Prices are only revealed to signed-in customers. */
export function PriceTag({ slug, asLink = true }: { slug: string; asLink?: boolean }) {
  const { canSeePrices, priceFor } = useServicePrices();

  if (!canSeePrices) {
    const label = (
      <span className="inline-flex items-center gap-1">
        <Lock className="size-3" aria-hidden />
        Sign in to view price
      </span>
    );
    if (!asLink) return label;
    return (
      <Link to="/auth" className="underline-offset-2 hover:underline">
        {label}
      </Link>
    );
  }

  const price = priceFor(slug);
  return <span>{price ? formatNaira(price) : "Price on request"}</span>;
}
