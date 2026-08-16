import { MessageCircle } from "lucide-react";
import { business, waLink } from "@/config/business";

export function WhatsAppFab() {
  return (
    <a
      href={waLink(`Hello ${business.name}, I would like to make an enquiry.`)}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-success px-4 py-3 text-sm font-semibold text-success-foreground shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircle className="size-5" aria-hidden />
      <span className="hidden sm:inline">Chat on WhatsApp</span>
    </a>
  );
}