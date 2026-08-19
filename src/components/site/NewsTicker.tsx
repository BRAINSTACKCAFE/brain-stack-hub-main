// src/components/site/NewsTicker.tsx
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActiveAnnouncements } from "@/lib/announcements.functions";

export function NewsTicker() {
  const fetchAnnouncements = useServerFn(listActiveAnnouncements);
  const { data } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
    refetchInterval: 60_000, // pick up new announcements without a full page reload
  });

  const items = data?.announcements ?? [];
  if (items.length === 0) return null;

  // Duplicate the list so the CSS animation loops seamlessly
  const loopItems = [...items, ...items];

  return (
    <div className="bsc-gold overflow-hidden border-b border-border">
      <div className="flex animate-[ticker_30s_linear_infinite] items-center gap-12 whitespace-nowrap py-2">
        {loopItems.map((a, i) => (
          <span key={`${a.id}-${i}`} className="text-sm font-medium text-accent-foreground">
            {a.link_url ? (
              <a href={a.link_url} className="hover:underline" target="_blank" rel="noreferrer">
                {a.message}
              </a>
            ) : (
              a.message
            )}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}