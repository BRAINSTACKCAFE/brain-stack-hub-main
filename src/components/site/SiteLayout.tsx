import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppFab } from "./WhatsAppFab";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  children?: ReactNode | undefined;
}) {
  return (
    <section className="bsc-hero">
      <div className="bsc-container grid gap-6 py-14 md:grid-cols-[auto_1fr] md:gap-12 md:py-20">
        {eyebrow && <p className="bsc-label pt-2 text-accent md:w-40">{eyebrow}</p>}
        <div>
          <h1 className="max-w-3xl text-3xl font-bold leading-[1.05] md:text-5xl">{title}</h1>
          {description && (
            <p className="mt-4 max-w-2xl text-base opacity-80 md:text-lg">{description}</p>
          )}
          {children && <div className="mt-7">{children}</div>}
        </div>
      </div>
    </section>
  );
}