"use client";

import Link from "next/link";
import { ArrowUpRight } from "@/components/icons/ui-icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useInView } from "@/lib/use-in-view";
import { publicHost } from "@/lib/site";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    id: "what-is-waku",
    question: "What is Waku, in one line?",
    answer:
      "A personal identity builder. You build a profile page and a matching identity card in your browser, then publish it at a link you own — reachable by anyone, updated by you.",
  },
  {
    id: "account-needed",
    question: "Do I need an account to start?",
    answer:
      "No. The editor opens on an example profile you overwrite field by field — nothing to install, no sign-up. Sign in with GitHub or Google only when you want your page live.",
  },
  {
    id: "cost",
    question: "What does it cost?",
    answer:
      "Nothing — Waku is free. Build, theme and publish as much as you like, and keep the link.",
  },
  {
    id: "where-it-lives",
    question: "Where does my page live once I publish it?",
    answer:
      "At your own link — " + publicHost() + "/p/your-name — reachable by anyone with the URL. Republishing updates that same URL in place, so your link never changes and old shares keep working.",
  },
  {
    id: "edit-after-publish",
    question: "Can I change my page after publishing?",
    answer:
      "Yes. Sign back in, edit anything — the bio, the theme, the links, the photo — and hit publish again. The same URL updates in place; there is never a new link to hand out.",
  },
  {
    id: "draft-data",
    question: "What happens to my data before I publish?",
    answer:
      "Nothing leaves your browser. Your draft is saved on your machine as you type, and it is uploaded only when you decide to publish.",
  },
  {
    id: "share-besides-link",
    question: "What can I share besides the link?",
    answer:
      "Four card layouts export at 2× as PNG — photo, name, tagline, handles and an optional QR code that opens your page. Drop one into a slide deck, a README or a forum signature.",
  },
] as const;

/**
 * The FAQ. Kept honest: every answer matches what the product actually does
 * (drafts stay local, publishing is what asks for an account, republish keeps
 * the URL), instead of marketing filler. The left column stays in view while
 * the accordion is scanned through on desktop, and both halves enter with the
 * section's shared fade-up.
 */
export function Faq() {
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <section id="faq" className="scroll-mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <div
          ref={ref}
          className={cn(
            "flex flex-col lg:sticky lg:top-24 lg:self-start",
            inView ? "animate-fade-up" : "opacity-0",
          )}
        >
          <p className="eyebrow text-ink-3">FAQ</p>
          <h2 className="mt-4 max-w-sm text-3xl font-semibold tracking-tight text-ink balance sm:text-4xl">
            Questions, answered.
          </h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-ink-2">
            Everything worth knowing before you build. If something is missing,
            we are a message away.
          </p>
          <Link
            href="/contact"
            className="group mt-7 inline-flex w-fit items-center gap-1.5 rounded-full border border-line bg-bg px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-ink/30 hover:text-ink"
          >
            Ask us anything
            <ArrowUpRight className="h-3.5 w-3.5 text-ink-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div
          className={cn(
            "rounded-2xl border border-line bg-bg shadow-card-sm",
            inView ? "animate-fade-up" : "opacity-0",
          )}
          style={{ animationDelay: "80ms" }}
        >
          <Accordion type="single" collapsible defaultValue={FAQS[0].id}>
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className={cn(
                  "px-6 md:px-7",
                  i === 0 && "pt-1.5",
                  i === FAQS.length - 1 && "border-b-0 pb-1.5",
                )}
              >
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
