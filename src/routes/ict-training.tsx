import { createFileRoute } from "@tanstack/react-router";
import { Clock, GraduationCap, MonitorSmartphone } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { business, waLink } from "@/config/business";
import { courses } from "@/data/catalog";

const title = "ICT Training in Nigeria — BRAIN STACK CAFE";
const description =
  "Practical computer and digital skills training — basic computer skills, Microsoft Word, Excel, PowerPoint and internet skills, physically or online.";

export const Route = createFileRoute("/ict-training")({
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
  component: IctTraining,
});

function IctTraining() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="ICT Training"
        title="Empower Yourself Through Technology"
        description="Build practical computer and digital skills for school, work, business and everyday life."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bsc-gold border-0 text-accent-foreground hover:opacity-90">
            <a href={waLink(`Hello ${business.name}, I want to enrol for ICT training.`)} target="_blank" rel="noreferrer">
              Get Started
            </a>
          </Button>
          <Button asChild variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
            <a href="#courses">View Courses</a>
          </Button>
        </div>
      </PageHero>

      <section id="courses" className="bsc-container py-12">
        <h2 className="text-2xl font-bold">Courses</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Structured for students, beginners, professionals, job seekers and business owners.
          Course fees and start dates are confirmed on enrolment.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <article key={c.slug} className="bsc-card bsc-card-hover flex flex-col rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                  <GraduationCap className="size-5" aria-hidden />
                </span>
                <Badge variant="secondary">{c.level}</Badge>
              </div>
              <h3 className="mt-4 text-base font-semibold">{c.title}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {c.outcomes.map((o) => (
                  <li key={o}>• {o}</li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden /> {c.duration}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MonitorSmartphone className="size-3.5" aria-hidden /> {c.mode}
                </span>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm font-semibold">
                  {c.price ? `₦${c.price.toLocaleString()}` : "Fee on request"}
                </span>
                <Button asChild size="sm">
                  <a href={waLink(`Hello ${business.name}, I want to enrol for the ${c.title} course.`)} target="_blank" rel="noreferrer">
                    Enrol
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}