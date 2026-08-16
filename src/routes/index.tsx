import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ClipboardList,
  CreditCard,
  FileSearch,
  MessageCircle,
  ShieldCheck,
  Truck,
} from "lucide-react";
import heroImage from "@/assets/hero-brainstack.jpg";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ServiceCard } from "@/components/site/ServiceCard";
import { business, disclaimers, waLink } from "@/config/business";
import { categories, popularServices, products, servicesInCategory } from "@/data/catalog";

const title = "BRAIN STACK CAFE — Digital, Academic & ICT Service Centre";
const description =
  "NIN & BVN support, JAMB and examination services, NERD & NYSC, CAC & NGO registration, research support, ICT training, printing, computer accessories and utility payments — in one platform.";

export const Route = createFileRoute("/")({
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
  component: Index,
});

const howItWorks = [
  { icon: FileSearch, title: "Find your service", text: "Search or browse clear categories to reach the right service in seconds." },
  { icon: ClipboardList, title: "Complete the form", text: "Each service has its own short, guided form — with document upload where required." },
  { icon: CreditCard, title: "Pay securely", text: "Confirm your details, pay, and receive a reference number and receipt." },
  { icon: ShieldCheck, title: "Track to completion", text: "Follow your request from submitted to completed, with support on WhatsApp." },
];

const faqs = [
  { q: "How do I order a service?", a: "Find the service, open it, complete the service-specific form, submit and you will receive a reference number. Payment and processing details follow." },
  { q: "How do I track my request?", a: "Use the Track a Request page with your reference number, or ask us on WhatsApp with the same reference." },
  { q: "Do you handle NIN modification?", a: "Yes — date of birth, phone number and address modification are supported through a guided application with document upload." },
  { q: "Can I buy a laptop or accessories?", a: "Yes. Browse the shop for laptops, keyboards, mice, storage and accessories. Pick up at the centre or we send it by waybill to your location." },
  { q: "Are you affiliated with JAMB, NIMC or CAC?", a: disclaimers.thirdParty },
  { q: "Can I learn computer skills here?", a: "Yes. ICT training runs physically or online across basic computer skills, Microsoft Office and practical digital skills." },
];

function Index() {
  return (
    <SiteLayout>
      {/* Hero: asymmetric editorial split */}
      <section className="border-b border-border">
        <div className="bsc-container grid items-stretch gap-0 lg:grid-cols-[1.15fr_1fr]">
          <div className="py-14 pr-0 md:py-20 lg:pr-14">
            <p className="bsc-label text-muted-foreground">{business.promise}</p>
            <h1 className="mt-6 text-[2.6rem] font-bold leading-[0.98] md:text-6xl lg:text-[4.2rem]">
              Identity, exams,
              <br />
              academics &amp; tech
              <br />
              <span className="relative isolate inline-block">
                handled properly.
                <span className="absolute inset-x-0 bottom-1 -z-10 h-3 bg-accent/70" aria-hidden />
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-base text-muted-foreground md:text-lg">
              One centre for NIN and BVN support, JAMB and examination services, NERD and NYSC,
              research and data analysis, printing, ICT training and computer accessories.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/services">
                  Browse all services <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a
                  href={waLink(`Hello ${business.name}, I need help with a service.`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="size-4" /> WhatsApp {business.phone}
                </a>
              </Button>
            </div>
          </div>

          <div className="relative border-l-0 border-border lg:border-l">
            <img
              src={heroImage}
              alt="Students and professionals using computers at a Nigerian ICT and study centre"
              width={1280}
              height={960}
              className="h-full min-h-72 w-full object-cover grayscale-[0.15]"
              loading="eager"
            />
            <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-background/95 px-5 py-4">
              <p className="bsc-label text-muted-foreground">Also in stock</p>
              <p className="mt-1 text-sm font-semibold">
                Laptops, keyboards, mice &amp; accessories — waybill nationwide
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee-style capability strip */}
      <div className="border-b border-border bg-secondary text-foreground">
        <div className="bsc-container flex flex-wrap items-center gap-x-8 gap-y-2 py-3">
          {["NIN & BVN", "JAMB / WAEC / NECO", "NERD & NYSC", "CAC & NGO", "SPSS & STATA", "Printing & Binding", "CAC", "Airtime & Data", "Laptops & Accessories"].map(
            (t) => (
              <span key={t} className="bsc-label opacity-80">
                {t}
              </span>
            ),
          )}
        </div>
      </div>

      {/* Category index — numbered list, not a card grid */}
      <Section index="01" title="Service index" action={{ to: "/services", label: "All services" }}>
        <div className="bsc-rule">
          {categories.map((c, i) => (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="group grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-border py-5 transition-colors hover:bg-secondary/70 md:grid-cols-[4rem_18rem_1fr_auto]"
            >
              <span className="bsc-label text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex items-center gap-3 text-base font-semibold md:text-lg">
                <c.icon className="size-5 shrink-0" aria-hidden />
                {c.name}
              </span>
              <span className="col-span-3 text-sm text-muted-foreground md:col-span-1 md:pr-6">
                {c.blurb}
              </span>
              <ArrowUpRight
                className="size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </Section>

      <Section index="02" title="Most requested" action={{ to: "/services", label: "All services" }}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popularServices.slice(0, 9).map((s) => (
            <ServiceCard key={s.slug} service={s} />
          ))}
        </div>
      </Section>

      {/* Shop band */}
      <Section index="03" title="Computers & accessories">
        <div className="bsc-hero rounded-lg border border-border p-8 md:p-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <p className="bsc-label text-accent">In stock now</p>
              <h3 className="mt-3 text-2xl font-bold md:text-4xl">
                Laptops, keyboards, mice &amp; more — with waybill nationwide
              </h3>
              <p className="mt-4 opacity-80">
                Buy at the centre or have it sent to your nearest park. Upgrades, chargers, storage
                and printer consumables also available.
              </p>
            </div>
            <Button asChild size="lg" className="bsc-gold border-0 text-accent-foreground hover:opacity-90">
              <Link to="/shop">
                <Truck className="size-4" /> Visit the shop
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-3 border-t border-background/20 pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to="/shop"
                className="rounded border border-background/25 p-4 transition-colors hover:border-accent"
              >
                <p className="bsc-label text-accent">{p.category}</p>
                <p className="mt-2 text-sm font-semibold">{p.name}</p>
                <p className="mt-1 text-sm opacity-75">{p.condition ?? "Available"}</p>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <CategorySpotlight
        slug="nin-bvn"
        index="04"
        title="NIN & BVN"
        text="Verification, slip download in Normal, Premium or Compact format, retrieval and guided modification."
      />
      <CategorySpotlight
        slug="nerd-nysc"
        index="05"
        title="NERD & NYSC"
        text="NERD enrolment with project upload, and structured NYSC PCM bio data capture."
      />
      <CategorySpotlight
        slug="research"
        index="06"
        title="Research & projects"
        text="From topic idea to finished work — guidance, data analysis, editing, formatting and consultation."
      />

      <Section index="07" title="ICT training" action={{ to: "/ict-training", label: "View courses" }}>
        <div className="bsc-card flex flex-col justify-between gap-6 rounded-lg p-8 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h3 className="text-2xl font-bold md:text-3xl">Empower yourself through technology</h3>
            <p className="mt-3 text-muted-foreground">
              Practical computer and digital skills for school, work and business — physically or
              online.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/ict-training">See the courses</Link>
          </Button>
        </div>
      </Section>

      <Section index="08" title="How it works">
        <div className="bsc-rule">
          {howItWorks.map((s, i) => (
            <div
              key={s.title}
              className="grid grid-cols-[3rem_1fr] items-start gap-4 border-b border-border py-6 md:grid-cols-[4rem_16rem_1fr]"
            >
              <span className="bsc-label text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="flex items-center gap-3 text-base font-semibold md:text-lg">
                <s.icon className="size-5 shrink-0" aria-hidden />
                {s.title}
              </h3>
              <p className="col-span-2 text-sm text-muted-foreground md:col-span-1">{s.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section index="09" title="Frequently asked questions">
        <Accordion type="single" collapsible className="bsc-card rounded-lg px-5">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left text-base font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      <section className="bsc-container mt-16 md:mt-24">
        <div className="bsc-card flex flex-col items-start justify-between gap-6 rounded-lg p-8 md:flex-row md:items-center">
          <div>
            <p className="bsc-label text-muted-foreground">Support</p>
            <h3 className="mt-2 text-xl font-bold">Not sure which service you need?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Message us on WhatsApp and we will guide you to the right service and requirements.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-success text-success-foreground hover:bg-success/90">
              <a
                href={waLink(`Hello ${business.name}, please help me choose the right service.`)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="size-4" /> WhatsApp us
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contact">Contact page</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Section({
  index,
  title: heading,
  action,
  children,
}: {
  index: string;
  title: string;
  action?: { to: "/services" | "/ict-training"; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="bsc-container mt-16 md:mt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-4">
          <span className="bsc-label text-accent">{index}</span>
          <h2 className="text-2xl font-bold md:text-4xl">{heading}</h2>
        </div>
        {action && (
          <Button asChild variant="ghost" size="sm">
            <Link to={action.to}>
              {action.label} <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

function CategorySpotlight({
  slug,
  index,
  title: heading,
  text,
}: {
  slug: string;
  index: string;
  title: string;
  text: string;
}) {
  const items = servicesInCategory(slug).slice(0, 4);
  return (
    <section className="bsc-container mt-16 md:mt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-4">
            <span className="bsc-label text-accent">{index}</span>
            <h2 className="text-2xl font-bold md:text-4xl">{heading}</h2>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:pl-12">{text}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/category/$slug" params={{ slug }}>
            See all <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((s) => (
          <ServiceCard key={s.slug} service={s} />
        ))}
      </div>
    </section>
  );
}
