import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listServicePrices, type ServicePrice } from "@/lib/pricing.functions";
import { useAuth } from "./use-auth";

export function useServicePrices() {
  const fetchPrices = useServerFn(listServicePrices);
  const { isAuthenticated } = useAuth();
  const { data } = useQuery<{ prices: ServicePrice[] }>({
    queryKey: ["service-prices"],
    queryFn: fetchPrices,
    staleTime: 60_000,
  });

  const map = new Map<string, number | null>();
  for (const p of data?.prices ?? []) map.set(p.slug, p.price);

  return {
    canSeePrices: isAuthenticated,
    priceFor: (slug: string) => map.get(slug) ?? null,
    prices: data?.prices ?? [],
  };
}
