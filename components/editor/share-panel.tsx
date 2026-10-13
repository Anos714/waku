"use client";

import {
  Copy,
  Check,
  QrCode,
  Share2,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Sparkles,
} from "@/components/icons/ui-icons";
import { GoogleMark } from "@/components/icons/ui-icons";
import { PlatformIcon } from "@/components/icons/platform-icons";
import { useEditor } from "./editor-provider";
import { Field, FieldGroup } from "./field-helpers";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopy, useQrCode, generateQrDataUrl, downloadDataUrl, shareUrl } from "@/lib/profile/qr";
import { useProfileUrl } from "@/lib/profile/use-profile-url";
import { sanitizeText } from "@/lib/validation/profile";
import { qrFilename } from "@/lib/cards/export";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import type { Profile } from "@/types";

function buildProfileText(profile: Profile): string {
  const lines: string[] = [];
  lines.push(profile.name.trim());
  if (profile.role.trim()) lines.push(profile.role.trim());
  if (profile.tagline.trim()) lines.push("");
  if (profile.tagline.trim()) lines.push(profile.tagline.trim());
  if (profile.bio.trim()) {
    lines.push("");
    lines.push(profile.bio.trim());
  }
  const extras: string[] = [];
  if (profile.location.trim()) extras.push(`Location: ${profile.location.trim()}`);
  if (profile.websiteUrl.trim()) extras.push(`Website: ${sanitizeText(profile.websiteUrl)}`);
  if (extras.length) {
    lines.push("");
    lines.push(...extras);
  }
  const visible = profile.socials.filter((link) => link.visible && link.url.trim());
  if (visible.length) {
    lines.push("");
    lines.push("Links:");
    visible.forEach((link) => lines.push(`- ${link.label.trim() || link.platform}: ${link.url.trim()}`));
  }
  return lines.join("\n");
}

type PublishState = "idle" | "publishing" | "published";
type SignInProvider = "github" | "google";

interface PublishResponse {
  ok: boolean;
  slug?: string;
  updated?: boolean;
  code?: string;
  message?: string;
  hint?: string;
}

interface AuthConfig {
  authEnabled: boolean;
  providers: Record<SignInProvider, boolean>;
}

export function SharePanel() {
  const { profile, form, importedSlug } = useEditor();
  const slug = profile.slug.trim() || "profile";
  const [textCopied, setTextCopied] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "shared">("idle");
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [liveSlug, setLiveSlug] = useState<string | null>(null);
  const [liveCopied, setLiveCopied] = useState(false);
  const [signingInWith, setSigningInWith] = useState<SignInProvider | null>(null);
  const [config, setConfig] = useState<AuthConfig | null>(null);

  const profileUrl = useProfileUrl(slug);
  // Only rendered after a successful publish; before that it tracks the preview
  // link harmlessly.
  const liveUrl = useProfileUrl(liveSlug ?? slug);
  const qrDataUrl = useQrCode(profileUrl, 640);
  const { copied, copy } = useCopy();

  const { data: session } = authClient.useSession();

  // Which providers this server can actually offer. Until it resolves the
  // buttons stay enabled rather than flickering disabled on slow networks.
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

  // Claiming a local draft on first sign-in is handled by <DraftClaimer>,
  // which stays mounted across the editor's tabs.

  async function handlePublish() {
    setPublishState("publishing");
    setPublishError(null);
    try {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const body = (await response.json()) as PublishResponse;
      if (!response.ok || !body.ok) {
        setPublishState("idle");
        setPublishError(body.message ?? "Publishing failed.");
        return;
      }
      // Remember the server-assigned URL and fold it back into the draft, so
      // the link, QR code and local preview all point at the live page and the
      // next publish updates this same page in place.
      if (body.slug) {
        setLiveSlug(body.slug);
        form.setValue("slug", body.slug, { shouldDirty: true });
      }
      setPublishState("published");
    } catch {
      setPublishState("idle");
      setPublishError("The request could not reach the server.");
    }
  }

  async function handleSignIn(provider: SignInProvider) {
    setSigningInWith(provider);
    setPublishError(null);
    try {
      // Better Auth redirects the browser to the provider; after the callback
      // the user lands back on this page with a session.
      await authClient.signIn.social({
        provider,
        callbackURL: window.location.pathname + window.location.search,
      });
    } catch {
      setSigningInWith(null);
      setPublishError("Sign-in could not start. Check your connection and try again.");
    }
  }

  async function handleShare() {
    const result = await shareUrl(profileUrl, `${profile.name} — Waku`);
    if (result === "shared") setShareState("shared");
  }

  async function downloadQr() {
    const large = await generateQrDataUrl(profileUrl, 1024);
    if (large) downloadDataUrl(large, qrFilename(slug));
  }

  async function copyText() {
    const ok = await copy(buildProfileText(profile));
    if (ok) {
      setTextCopied(true);
      window.setTimeout(() => setTextCopied(false), 2000);
    }
  }

  async function copyLiveUrl() {
    if (!liveSlug) return;
    const ok = await copy(liveUrl);
    if (ok) {
      setLiveCopied(true);
      window.setTimeout(() => setLiveCopied(false), 2000);
    }
  }

  const publishedUrl = liveSlug ? liveUrl : null;

  return (
    <FieldGroup
      title="Share"
      description="Preview links, QR codes and exports — all generated locally."
    >
      <Field id="share-url" label="Profile link">
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg border border-line-2 bg-surface-2 px-3 py-2 text-xs text-ink-2">
            {profileUrl}
          </code>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => copy(profileUrl)}
            aria-label="Copy profile link"
          >
            {copied ? (
              <Check key="copied" className="h-4 w-4 animate-pop text-accent-2" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        {copied ? (
          <p className="text-xs font-medium text-ink-2">Link copied to clipboard.</p>
        ) : null}
      </Field>

      {importedSlug ? (
        <Alert variant="info">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0">
            <AlertTitle>Your draft is now live</AlertTitle>
            <AlertDescription>
              The profile you built anonymously was imported as your first page
              at <span className="font-mono">/p/{importedSlug}</span>.
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      <div className="rounded-lg border border-line bg-surface p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-ink">
            <Globe className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">Publish this page</p>
            <div className="mt-0.5 text-[0.6875rem] leading-relaxed text-ink-3">
              {config && !config.authEnabled ? (
                "Publishing is not configured on this server — add DATABASE_URL to publish."
              ) : publishState === "published" ? (
                "Anyone with the link can now see your profile."
              ) : session ? (
                "Save your profile to the database so anyone with the link can view it."
              ) : (
                "Sign in with GitHub or Google to publish. Nothing leaves this browser until then."
              )}
            </div>
          </div>
        </div>

        {config && !config.authEnabled ? null : session ? (
          <>
            {publishedUrl ? (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg border border-line-2 bg-surface-2 px-3 py-2 text-xs text-ink">
                    {publishedUrl}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyLiveUrl}
                    aria-label="Copy live profile link"
                  >
                    {liveCopied ? (
                      <Check key="live-copied" className="h-4 w-4 animate-pop text-accent-2" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {liveCopied ? (
                  <p className="mt-1.5 text-xs font-medium text-ink-2">
                    Live link copied to clipboard.
                  </p>
                ) : null}
              </div>
            ) : null}
            <Button
              type="button"
              variant={publishState === "published" ? "outline" : "default"}
              size="sm"
              className="mt-3 w-full"
              onClick={handlePublish}
              disabled={publishState === "publishing"}
            >
              {publishState === "publishing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : publishState === "published" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              {publishState === "publishing"
                ? "Publishing…"
                : publishState === "published"
                  ? "Republish changes"
                  : "Publish profile"}
            </Button>
          </>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <SignInButton
              provider="github"
              label="GitHub"
              pending={signingInWith === "github"}
              disabled={config !== null && !config.providers.github}
              onClick={() => handleSignIn("github")}
            />
            <SignInButton
              provider="google"
              label="Google"
              pending={signingInWith === "google"}
              disabled={config !== null && !config.providers.google}
              onClick={() => handleSignIn("google")}
            />
            {config && (!config.providers.github || !config.providers.google) ? (
              <p className="col-span-full text-[0.6875rem] leading-relaxed text-ink-3">
                Some providers are unavailable on this server — add their
                client ID and secret to{" "}
                <span className="font-mono">.env.local</span> (see{" "}
                <span className="font-mono">.env.example</span>) and restart.
              </p>
            ) : null}
          </div>
        )}

        {publishError ? (
          <p className="mt-2 text-xs font-medium text-red-600">{publishError}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleShare}
          className={shareState === "shared" ? "border-accent" : ""}
        >
          {shareState === "shared" ? (
            <Check key="shared" className="h-4 w-4 animate-pop text-accent-2" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          {shareState === "shared" ? "Shared" : "Share"}
        </Button>
        <Button type="button" variant="outline" onClick={copyText}>
          {textCopied ? (
            <Check key="text-copied" className="h-4 w-4 animate-pop text-accent-2" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {textCopied ? "Copied" : "Copy profile text"}
        </Button>
        <Button type="button" variant="outline" onClick={downloadQr} disabled={!qrDataUrl}>
          <Download className="h-4 w-4" />
          Download QR
        </Button>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" asChild>
                <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open preview
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Opens /p/{slug} in a new tab</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {qrDataUrl ? (
        <div className="flex items-center gap-4 rounded-lg border border-line bg-surface p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`QR code for ${profileUrl}`}
            width={112}
            height={112}
            className="h-28 w-28 shrink-0"
          />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <QrCode className="h-4 w-4" />
              QR code
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-3">
              Points at your profile link. Anyone who scans it lands on{" "}
              <span className="font-mono">/p/{slug}</span>.
            </p>
          </div>
        </div>
      ) : null}

      <Alert variant="info">
        <AlertTitle>Unpublished changes stay local</AlertTitle>
        <AlertDescription>
          Drafts are stored in this browser. Use{" "}
          <span className="font-semibold">Publish profile</span> above to write your
          page to the database so <span className="font-mono">/p/{slug}</span> is
          reachable by anyone with the link.
        </AlertDescription>
      </Alert>
    </FieldGroup>
  );
}

function SignInButton({
  provider,
  label,
  pending,
  disabled,
  onClick,
}: {
  provider: SignInProvider;
  label: string;
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClick}
            disabled={pending || disabled}
            className="w-full"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : provider === "github" ? (
              <PlatformIcon platform="github" className="h-4 w-4" />
            ) : (
              <GoogleMark className="h-4 w-4" />
            )}
            {pending ? "Redirecting…" : `Sign in with ${label}`}
          </Button>
        </TooltipTrigger>
        {disabled ? (
          <TooltipContent>{label} sign-in is not configured on this server.</TooltipContent>
        ) : null}
      </Tooltip>
    </TooltipProvider>
  );
}
