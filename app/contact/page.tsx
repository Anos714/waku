import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import { ContactForm } from "@/components/contact/contact-form";
import { ArrowUpRight, Mail, MapPin } from "@/components/icons/ui-icons";
import { PlatformIcon } from "@/components/icons/platform-icons";
import { CONTACT_EMAIL, GITHUB_REPO_URL, mailto } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the person behind Waku — email, GitHub, or a message composed straight from this page.",
};

const CHANNELS = [
  {
    label: "Email",
    value: CONTACT_EMAIL,
    description: "Anything at all — bugs, ideas, questions, or just to say hi.",
    href: mailto(CONTACT_EMAIL),
    Icon: Mail,
  },
  {
    label: "GitHub",
    value: "Anos714/waku",
    description: "Issues and pull requests. The whole app is open source there.",
    href: GITHUB_REPO_URL,
    external: true,
    Icon: GithubMark,
  },
];

function GithubMark({ className }: { className?: string }) {
  return <PlatformIcon platform="github" className={className} />;
}

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <div className="accent-glow pointer-events-none absolute inset-x-0 top-0 h-24" aria-hidden="true" />

        <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-14 md:px-8 md:pt-20">
          <p className="eyebrow text-ink-3">Contact</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-ink balance sm:text-5xl">
            Say hello, or tell us what to build next.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
            Every message lands in front of a person, not a queue. Bug reports,
            feature ideas, legal questions — all welcome.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">            {/* Channels */}
            <div className="flex flex-col gap-4">
              {CHANNELS.map((channel) => (
                <a
                  key={channel.label}
                  href={channel.href}
                  {...(channel.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="group flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card-sm transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-line-2 hover:shadow-card"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-2 transition-colors group-hover:bg-accent group-hover:text-accent-ink">
                    <channel.Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3">
                        {channel.label}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-ink-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
                    </span>
                    <span className="mt-1.5 block font-medium text-ink">
                      {channel.value}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-ink-2">
                      {channel.description}
                    </span>
                  </span>
                </a>
              ))}

              <div className="rounded-2xl border border-dashed border-line-2 bg-bg-subtle/40 p-5">
                <span className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3">
                  <MapPin className="h-3.5 w-3.5" />
                  Response time
                </span>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  Usually within a day or two. If something is actively broken,
                  opening a{" "}
                  <Link
                    href={`${GITHUB_REPO_URL}/issues`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-ink underline decoration-line-2 underline-offset-4 transition-colors hover:decoration-accent-2"
                  >
                    GitHub issue
                  </Link>{" "}
                  is the fastest way to reach us.
                </p>
              </div>
            </div>

            {/* Form */}
            <ContactForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
