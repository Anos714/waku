"use client";

import Link from "next/link";
import { Check, Clock, ExternalLink, LogOut } from "@/components/icons/ui-icons";
import { useEditor } from "./editor-provider";
import { ResetDialog } from "./reset-dialog";
import { Button } from "@/components/ui/button";
import { WakuLogo } from "@/components/icons/waku-logo";
import { useProfileUrl } from "@/lib/profile/use-profile-url";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function EditorHeader() {
  const { profile, savedAt, isDirty } = useEditor();
  const slug = profile.slug.trim() || "profile";
  const profileUrl = useProfileUrl(slug);
  const { data: session } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut();
    // Reload so server-rendered state and any cached session data are cleared.
    window.location.reload();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink transition-opacity hover:opacity-70"
        >
          <WakuLogo variant="mark" className="h-6 w-6" />
          Waku
        </Link>
        <span className="hidden text-ink-3 sm:inline">/</span>
        <span className="hidden text-sm text-ink-2 sm:inline">Editor</span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[0.6875rem] font-medium text-ink-2 md:inline-flex"
          title={savedAt ? `Last saved at ${savedAt.toLocaleTimeString()}` : "Draft"}
        >
          {isDirty ? (
            <>
              <Clock className="h-3 w-3" />
              Saving…
            </>
          ) : (
            <>
              <Check className="h-3 w-3 text-ink-2" />
              {savedAt ? "Saved locally" : "Draft"}
            </>
          )}
        </span>

        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={profileUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">View page</span>
          </Link>
        </Button>

        <ResetDialog />

        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8 items-center gap-2 rounded-lg border border-line-2 bg-surface-2 pl-1.5 pr-2.5 text-xs font-medium text-ink transition-colors hover:border-ink/30"
                aria-label="Account menu"
              >
                <AccountAvatar name={session.user.name} image={session.user.image} />
                <span className="hidden max-w-[8rem] truncate sm:inline">
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
        ) : null}
      </div>
    </header>
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
        width={22}
        height={22}
        className="h-[22px] w-[22px] rounded-full object-cover"
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
    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-ink text-[0.625rem] font-semibold text-bg">
      {initials || "?"}
    </span>
  );
}
