"use client";

import Link from "next/link";
import { ArrowUp } from "@/components/icons/ui-icons";
import { WakuLogo } from "@/components/icons/waku-logo";
import { GITHUB_REPO_URL } from "@/lib/site";

type FooterLink = { label: string; href: string; external?: boolean };
type FooterColumn = { title: string; links: FooterLink[] };

const COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Editor", href: "/create" },
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "FAQ", href: "/#faq" },
      { label: "GitHub", href: GITHUB_REPO_URL, external: true },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Rate Waku", href: "/rate" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy-policy" },
      { label: "Cookie Policy", href: "/legal/cookie-policy" },
      { label: "Terms & Conditions", href: "/legal/terms" },
    ],
  },
  {
    title: "Showcase",
    links: [{ label: "Demo profile", href: "/p/ada" }],
  },
];

/** The two products whose ideas shaped Waku — credited where visitors look. */
const INSPIRATION: FooterLink[] = [
  { label: "Linktree", href: "https://linktr.ee/" },
  { label: "Kado", href: "https://kado.armandev.space/" },
];

/**
 * The directories Waku is listed in — a build-in-public signal more than a
 * growth channel. The UsefulShelf lime theme is a near-match for the accent.
 * `attrs` carries any directory-specific verification attributes onto the link.
 */
const LISTINGS: {
  href: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  attrs?: Record<string, string>;
}[] = [
  {
    href: "https://zerorevenue.club/?utm_source=zerorevenue.club&utm_medium=referral&utm_content=badge",
    src: "https://zerorevenue.club/badges/zero-revenue-club.svg",
    alt: "Listed on Zero Revenue Club",
    width: 190,
    height: 44,
  },
  {
    href: "https://usefulshelf.co/?utm_source=wakucards.vercel.app&utm_medium=referral&utm_campaign=badge&utm_content=lime",
    src: "https://usefulshelf.co/badge/usefulshelf.svg?theme=lime",
    alt: "Featured on UsefulShelf",
    width: 248,
    height: 66,
  },
];

const WORDMARK_GRADIENT =
  "linear-gradient(180deg, var(--accent) 6%, color-mix(in oklab, var(--accent) 55%, var(--bg-deep)) 55%, color-mix(in oklab, var(--accent) 15%, var(--bg-deep)) 100%)";

export function Footer() {
  function backToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer className="border-t border-white/10 bg-bg-deep text-white/60">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 text-white">
              <WakuLogo className="h-9 w-9 shrink-0" />
              <span className="text-sm font-semibold tracking-tight">Waku</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/45">
              A personal identity builder. Build a profile page and a matching
              identity card, then publish it at a link you own — reachable by
              anyone, updated by you.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-10 gap-y-8 lg:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-white/35">
                  {column.title}
                </p>
                <ul className="mt-3 flex flex-col gap-2.5 text-sm">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        {...(link.external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-4 text-xs sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p className="flex flex-wrap items-center gap-x-1.5 text-white/50">
            Made by <span className="text-white/80">Rahul Sain</span>
            <span className="text-white/25">·</span>
            Inspired by{" "}
            {INSPIRATION.map((link, index) => (
              <span key={link.href} className="inline-flex items-center gap-1.5">
                {index > 0 ? <span className="text-white/25">&amp;</span> : null}
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              </span>
            ))}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {LISTINGS.map((listing) => (
              <a
                key={listing.href}
                href={listing.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 shrink-0 items-center transition-opacity duration-200 hover:opacity-80"
                title={listing.alt}
                {...listing.attrs}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a third-party badge SVG, shipped as-is */}
                <img
                  src={listing.src}
                  alt={listing.alt}
                  width={listing.width}
                  height={listing.height}
                  loading="lazy"
                  decoding="async"
                  className="h-11 w-auto"
                />
              </a>
            ))}
          </div>
          <button
            type="button"
            onClick={backToTop}
            className="inline-flex items-center gap-1.5 text-white/50 transition-colors hover:text-white"
          >
            Back to Top
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div
        className="h-[21vw] overflow-hidden px-4 pt-[1.5vw]"
        aria-hidden="true"
      >
        <span
          className="block select-none text-center text-[30vw] font-black uppercase leading-[0.78] tracking-[-0.04em]"
          style={{
            backgroundImage: WORDMARK_GRADIENT,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Waku
        </span>
      </div>
    </footer>
  );
}
