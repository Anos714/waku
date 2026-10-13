import { Sparkles } from "@/components/icons/ui-icons";

/**
 * The announcement strip above the landing nav — a slim dark patti that echoes
 * the footer so the page reads as framed top and bottom on the warm canvas.
 *
 * It sits in normal flow above the sticky nav, so it scrolls away on its own
 * and hands the top edge to the nav; the accent glow is the same one the hero
 * uses, which keeps the two in one visual language. Landing-only, because it
 * announces what is coming to the product rather than something every page
 * needs to repeat.
 */
export function PromoBar() {
  return (
    <div className="relative select-none overflow-hidden border-b border-white/10 bg-bg-deep">
      <div
        className="accent-glow pointer-events-none absolute inset-x-0 top-0 h-16"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex h-10 max-w-6xl items-center justify-center gap-2.5 px-5 md:px-8">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
        <p className="flex items-center gap-2 whitespace-nowrap text-[0.8125rem] text-white/65">
          <span className="hidden sm:inline">More themes, fresh designs, and much more</span>
          <span className="sm:hidden">More themes &amp; designs</span>
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-accent">
            coming soon
          </span>
        </p>
      </div>
    </div>
  );
}
