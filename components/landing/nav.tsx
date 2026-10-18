"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, LogOut } from "@/components/icons/ui-icons";
import { Button } from "@/components/ui/button";
import { WakuLogo } from "@/components/icons/waku-logo";
import { PlatformIcon } from "@/components/icons/platform-icons";
import { GoogleMark } from "@/components/icons/ui-icons";
import { GITHUB_REPO_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SignInProvider = "github" | "google";

interface AuthConfig {
  authEnabled: boolean;
  providers: Record<SignInProvider, boolean>;
}

const LINKS = [
  { label: "Watch", href: "/#watch" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Showcase", href: "/#showcase" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "FAQ", href: "/#faq" },
];

/**
 * The landing nav. Shrinks and softens once the page is scrolled, and offers
 * sign-in (or the account menu) on the right. Session state resolves after
 * mount via `authClient.useSession()`, so an anonymous render never blocks.
 */
export function Nav({ className }: { className?: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-line bg-bg/80 backdrop-blur-md transition-[box-shadow,background-color] duration-200",
        scrolled && "bg-bg/95 shadow-[0_1px_0_0_var(--color-line)]",
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-5 sm:gap-4 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[0.9375rem] font-semibold tracking-tight text-ink transition-opacity hover:opacity-70"
        >
          <WakuLogo className="h-7 w-7" />
          Waku
        </Link>

        {/* On tablets the four links plus the action cluster no longer fit on
            one row — they used to wrap and stretch the bar — so they wait for
            the desktop breakpoint. */}
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="md"
            className="hidden px-3 sm:inline-flex sm:px-4"
          >
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Star Waku on GitHub"
            >
              <PlatformIcon platform="github" className="h-4 w-4" />
              <span className="hidden lg:inline">Star on GitHub</span>
            </a>
          </Button>
          <AccountArea />
          <Button asChild size="md" className="group">
            <Link href="/create">
              <span className="sm:hidden">Create</span>
              <span className="hidden sm:inline">Create your profile</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/**
 * Sign-in when anonymous, the account menu when signed in. Providers are gated
 * by `/api/config` so a button that cannot work is never offered as though it
 * could.
 */
function AccountArea() {
  const { data: session } = authClient.useSession();
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [signingInWith, setSigningInWith] = useState<SignInProvider | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/config")
      .then((response) => response.json())
      .then((body: AuthConfig & { ok?: boolean }) => {
        if (!active || !body.ok) return;
        setConfig({
          authEnabled: body.authEnabled,
          providers: {
            github: body.providers?.github ?? false,
            google: body.providers?.google ?? false,
          },
        });
      })
      .catch(() => {
        // Unreachable server: let the sign-in attempt surface the real error.
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSignIn(provider: SignInProvider) {
    setSigningInWith(provider);
    try {
      await authClient.signIn.social({ provider, callbackURL: "/" });
    } catch {
      setSigningInWith(null);
    }
  }

  async function handleSignOut() {
    await authClient.signOut();
    window.location.reload();
  }

  if (session) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-lg border border-line-2 bg-surface-2 pl-1.5 pr-2.5 text-xs font-medium text-ink transition-colors hover:border-ink/30"
            aria-label="Account menu"
          >
            <AccountAvatar name={session.user.name} image={session.user.image} />
            <span className="hidden max-w-[8rem] truncate lg:inline">
              {session.user.name}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{session.user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void handleSignOut()}>
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Publishing needs the database; without it the button would only disappoint.
  if (config && !config.authEnabled) return null;

  const githubDisabled = config !== null && !config.providers.github;
  const googleDisabled = config !== null && !config.providers.google;

  // Both providers unconfigured: nothing to sign in with, so hide the affordance.
  if (githubDisabled && googleDisabled) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="md">
          Sign in
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Sign in to publish</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <SignInItem
          provider="github"
          label="GitHub"
          pending={signingInWith === "github"}
          disabled={githubDisabled}
          onSelect={() => void handleSignIn("github")}
        />
        <SignInItem
          provider="google"
          label="Google"
          pending={signingInWith === "google"}
          disabled={googleDisabled}
          onSelect={() => void handleSignIn("google")}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SignInItem({
  provider,
  label,
  pending,
  disabled,
  onSelect,
}: {
  provider: SignInProvider;
  label: string;
  pending: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      disabled={pending || disabled}
      className="gap-2.5 data-[disabled]:opacity-50"
      title={disabled ? `${label} sign-in is not configured on this server.` : undefined}
    >
      {pending ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-2 border-t-ink" />
      ) : provider === "github" ? (
        <PlatformIcon platform="github" className="h-4 w-4" />
      ) : (
        <GoogleMark className="h-4 w-4" />
      )}
      {pending ? "Redirecting…" : `Continue with ${label}`}
    </DropdownMenuItem>
  );
}

function AccountAvatar({
  name,
  image,
}: {
  name: string;
  image?: string | null;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        width={24}
        height={24}
        className="h-6 w-6 rounded-full object-cover"
      />
    );
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[0.625rem] font-semibold text-bg">
      {initials || "?"}
    </span>
  );
}
