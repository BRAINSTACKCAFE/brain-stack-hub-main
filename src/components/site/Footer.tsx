import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { business, disclaimers, mailLink, telLink, waLink } from "@/config/business";
import { categories } from "@/data/catalog";

export function Footer() {
  return (
    <footer className="bsc-hero mt-24 border-t border-border">
      <div className="bsc-container grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="bsc-gold grid size-9 place-items-center rounded-xl font-display text-sm font-extrabold text-accent-foreground">
              BS
            </span>
            <span className="font-display text-sm font-extrabold">BRAIN STACK CAFE</span>
          </div>
          <p className="mt-4 text-sm opacity-75">
            {business.promise} {business.tagline}
          </p>
        </div>

        <div>
          <h3 className="bsc-label text-accent">Services</h3>
          <ul className="mt-4 space-y-2 text-sm opacity-80">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to="/category/$slug" params={{ slug: c.slug }} className="hover:opacity-100">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="bsc-label text-accent">Company</h3>
          <ul className="mt-4 space-y-2 text-sm opacity-80">
            <li><Link to="/about">About us</Link></li>
            <li><Link to="/ict-training">ICT Training</Link></li>
            <li><Link to="/shop">Computers & Accessories</Link></li>
            <li><Link to="/track">Track a request</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms & Conditions</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="bsc-label text-accent">Talk to us</h3>
          <ul className="mt-4 space-y-3 text-sm opacity-85">
            <li>
              <a href={telLink} className="inline-flex items-center gap-2">
                <Phone className="size-4" aria-hidden /> {business.phone}
              </a>
            </li>
            <li>
              <a href={waLink(`Hello ${business.name}, I need help with a service.`)} className="inline-flex items-center gap-2" target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" aria-hidden /> WhatsApp {business.phone}
              </a>
            </li>
            <li>
              <a href={mailLink} className="inline-flex items-center gap-2 break-all">
                <Mail className="size-4 shrink-0" aria-hidden /> {business.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/15">
        <div className="bsc-container space-y-3 py-6 text-xs opacity-70">
          <p>{disclaimers.thirdParty}</p>
          <p>© {new Date().getFullYear()} {business.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}