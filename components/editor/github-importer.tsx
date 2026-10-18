"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Loader2,
  RotateCcw,
  Sparkles,
  Star,
  X,
} from "@/components/icons/ui-icons";
import { PlatformIcon } from "@/components/icons/platform-icons";
import { useEditor } from "./editor-provider";
import { FieldGroup } from "./field-helpers";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { authClient } from "@/lib/auth-client";
import { createId } from "@/lib/utils";
import { computeRank } from "@/lib/rank/score";
import type { MappedProject } from "@/lib/github/map";

type Status = "idle" | "fetching" | "reviewing" | "applied" | "error";

type GroupKey = "basics" | "projects" | "skills";

interface GithubProfileBasics {
  login: string;
  name: string;
  bio: string;
  websiteUrl: string;
  avatarUrl: string;
  followers: number;
  publicRepos: number;
}

interface GithubStatsPayload {
  login: string;
  followers: number;
  publicRepos: number;
  totalStars: number;
  repoCount: number;
  topLanguages: string[];
}

interface GithubResult {
  ok: true;
  profile: GithubProfileBasics;
  projects: MappedProject[];
  skills: string[];
  stats: GithubStatsPayload;
  warnings: string[];
}

interface ErrorResponse {
  ok: false;
  code: string;
  message: string;
  hint?: string;
}

interface ReviewState {
  profile: GithubProfileBasics;
  projects: MappedProject[];
  skills: string[];
  stats: GithubStatsPayload;
  warnings: string[];
  selected: Record<GroupKey, boolean>;
}

interface AuthConfig {
  githubRepos: boolean;
}

type SyncOutcome =
  | { status: "synced"; stats: GithubStatsPayload }
  | { status: "unconnected" }
  | { status: "failed" };

/** Per-browser throttle for the automatic rank sync. */
const SYNC_KEY = "waku.github.sync.v1";
const SYNC_THROTTLE_MS = 60 * 60 * 1000;

/**
 * GitHub import: pull the signed-in user's repositories, let them review every
 * group, and only then write the selected fields into the draft.
 *
 * The panel only mounts for signed-in users on a server that can run the import
 * (`githubRepos` from /api/config). The anonymous path is untouched: with no
 * session this renders nothing and the editor behaves exactly as before.
 */
export function GithubImporter() {
  const { form, notifyFormExternalChange } = useEditor();
  const { data: session, isPending } = authClient.useSession();
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [review, setReview] = useState<ReviewState | null>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncedStats, setSyncedStats] = useState<GithubStatsPayload | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);

  // Sync the public-stats snapshot so a GitHub-connected account gets a rank
  // without importing anything first. The fetch returns an outcome; the effect
  // and the retry button both apply it. A not-connected response is not an error
  // (the connect flow handles it); anything else is surfaced quietly so a broken
  // rank never looks like a missing feature.
  const syncRank = useCallback(async (): Promise<SyncOutcome> => {
    try {
      const response = await fetch("/api/github/sync", { method: "POST" });
      const body = (await response.json()) as {
        ok?: boolean;
        stats?: GithubStatsPayload;
        code?: string;
      };

      if (response.ok && body.ok && body.stats) {
        return { status: "synced", stats: body.stats };
      }
      if (body.code === "GITHUB_NOT_CONNECTED") return { status: "unconnected" };
      return { status: "failed" };
    } catch {
      // A rank sync must never interrupt the editor.
      return { status: "failed" };
    }
  }, []);

  const applyOutcome = useCallback((outcome: SyncOutcome) => {
    if (outcome.status === "synced") {
      setSyncedStats(outcome.stats);
      setSyncFailed(false);
      try {
        window.localStorage.setItem(SYNC_KEY, String(Date.now()));
      } catch {
        // Ignore: the throttle is best-effort.
      }
      return;
    }
    if (outcome.status === "failed") setSyncFailed(true);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/config")
      .then((response) => response.json())
      .then((body: { ok?: boolean; githubRepos?: boolean }) => {
        if (!active || !body.ok) return;
        setConfig({ githubRepos: body.githubRepos ?? false });
      })
      .catch(() => {
        // Unreachable server: leave the panel hidden rather than show a broken one.
      });
    return () => {
      active = false;
    };
  }, []);

  const userId = session?.user?.id;
  useEffect(() => {
    if (!config?.githubRepos || !userId) return;

    try {
      const last = Number(window.localStorage.getItem(SYNC_KEY) ?? 0);
      if (last && Date.now() - last < SYNC_THROTTLE_MS) return;
    } catch {
      // localStorage unavailable: fall through and try anyway.
    }

    void syncRank().then(applyOutcome);
  }, [config?.githubRepos, userId, syncRank, applyOutcome]);

  // Anonymous visitors keep the original editor: nothing renders until both the
  // session and the server capability are known to be present.
  if (isPending || !config?.githubRepos || !session) return null;

  const syncedRank = syncedStats ? computeRank(syncedStats) : null;

  async function importRepos() {
    setStatus("fetching");
    setError(null);
    try {
      const response = await fetch("/api/github/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = (await response.json()) as GithubResult | ErrorResponse;

      if (!response.ok || !body.ok) {
        setStatus("error");
        setError(body as ErrorResponse);
        return;
      }

      setReview({
        profile: body.profile,
        projects: body.projects,
        skills: body.skills,
        stats: body.stats,
        warnings: body.warnings,
        selected: { basics: true, projects: true, skills: true },
      });
      setStatus("reviewing");
    } catch {
      setStatus("error");
      setError({
        ok: false,
        code: "NETWORK",
        message: "The request could not reach the server.",
        hint: "Check your connection and try again.",
      });
    }
  }

  function reset() {
    setReview(null);
    setError(null);
    setStatus("idle");
  }

  function toggleGroup(key: GroupKey, checked: boolean) {
    setReview((prev) =>
      prev ? { ...prev, selected: { ...prev.selected, [key]: checked } } : prev,
    );
  }

  function applySelected() {
    if (!review) return;
    const { profile, projects, skills, selected } = review;
    const set = form.setValue;

    if (selected.basics) {
      set("name", profile.name || form.getValues("name"), { shouldDirty: true });
      if (profile.bio) set("bio", profile.bio, { shouldDirty: true });
      if (profile.websiteUrl)
        set("websiteUrl", profile.websiteUrl, { shouldDirty: true });
      if (profile.avatarUrl)
        set("avatarUrl", profile.avatarUrl, { shouldDirty: true });
    }
    if (selected.projects && projects.length > 0) {
      set(
        "projects",
        projects.map((project) => ({ id: createId("project"), ...project })),
        { shouldDirty: true },
      );
    }
    if (selected.skills && skills.length > 0) {
      set("skills", skills, { shouldDirty: true });
    }

    // Uncontrolled boxes (skills) re-seed from the new values.
    notifyFormExternalChange();
    setStatus("applied");
  }

  async function connectGithub() {
    setConnecting(true);
    try {
      await authClient.linkSocial({
        provider: "github",
        callbackURL: window.location.pathname + window.location.search,
      });
    } catch {
      setConnecting(false);
      setError({
        ok: false,
        code: "LINK_FAILED",
        message: "GitHub could not be connected.",
        hint: "Try signing out and back in with GitHub, then import again.",
      });
      setStatus("error");
    }
  }

  const needsConnect =
    error?.code === "GITHUB_NOT_CONNECTED" ||
    error?.code === "GITHUB_REAUTH_REQUIRED";

  const hasSelection =
    review != null && (Object.values(review.selected) as boolean[]).some(Boolean);

  return (
    <FieldGroup
      title="Import from GitHub"
      description="Pull your repositories into featured work. Review every field before anything changes."
    >
      {status === "applied" ? (
        <div className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/25 text-ink">
            <Check className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">Applied to your draft</p>
            <p className="mt-0.5 text-xs text-ink-3">
              The selected fields are in the form now. Edit freely, nothing is
              published until you publish.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={reset}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Import GitHub again
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink">
            <PlatformIcon platform="github" className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">
              {session.user.name ? `Signed in as ${session.user.name}` : "GitHub ready"}
            </p>
            <p className="mt-0.5 text-xs text-ink-3">
              Public and private repos, ranked by stars. Only what you approve
              lands in the draft.
            </p>
            {syncedRank ? (
              <p className="mt-1 text-xs text-ink-3">
                Rank{" "}
                <span className="font-medium text-ink">{syncedRank.score}/100</span>
                {" · "}
                <span className="font-medium text-ink">{syncedRank.tier.label}</span>
              </p>
            ) : null}
            {syncFailed && !syncedRank ? (
              <button
                type="button"
                onClick={() => {
                  void syncRank().then(applyOutcome);
                }}
                className="mt-1 text-xs font-medium text-ink-2 underline-offset-2 hover:text-ink hover:underline"
              >
                Rank failed to sync. Try again
              </button>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            disabled={status === "fetching"}
            onClick={importRepos}
          >
            {status === "fetching" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {status === "fetching" ? "Reading..." : "Import repositories"}
          </Button>
        </div>
      )}

      {status === "error" && error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="flex items-start gap-1.5 text-sm font-medium text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error.message}
          </p>
          {error.hint ? (
            <p className="mt-1 text-xs text-red-600">{error.hint}</p>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            {needsConnect ? (
              <Button
                type="button"
                size="sm"
                disabled={connecting}
                onClick={connectGithub}
              >
                {connecting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PlatformIcon platform="github" className="h-3.5 w-3.5" />
                )}
                {error.code === "GITHUB_REAUTH_REQUIRED"
                  ? "Reconnect GitHub"
                  : "Connect GitHub"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                setStatus(review ? "reviewing" : "idle");
              }}
            >
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      {status === "reviewing" && review ? (
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">Review the draft</p>
              <p className="mt-0.5 text-xs text-ink-3">
                From @{review.stats.login}. Only checked groups will be applied,
                and applying replaces those fields.
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              aria-label="Discard GitHub import"
              className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <StatChip label="Stars" value={review.stats.totalStars} />
            <StatChip label="Followers" value={review.stats.followers} />
            <StatChip label="Repos" value={review.stats.publicRepos} />
          </div>

          <RankSummary stats={review.stats} />

          {review.warnings.length > 0 ? (
            <ul className="flex flex-col gap-1 rounded-md bg-surface-2 p-3">
              {review.warnings.map((warning) => (
                <li
                  key={warning}
                  className="flex items-start gap-1.5 text-xs text-ink-2"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-3" />
                  {warning}
                </li>
              ))}
            </ul>
          ) : null}

          <ul className="flex flex-col gap-2">
            <ReviewRow
              groupKey="basics"
              title="Basics"
              selected={review.selected.basics}
              onToggle={toggleGroup}
              summary={
                [review.profile.name, review.profile.bio, review.profile.websiteUrl]
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .join(" · ") || "Nothing found"
              }
            />
            <ReviewRow
              groupKey="projects"
              title={`Projects (${review.projects.length})`}
              selected={review.selected.projects}
              onToggle={toggleGroup}
              summary={
                review.projects.map((p) => p.title).join(" · ") || "Nothing found"
              }
            />
            <ReviewRow
              groupKey="skills"
              title={`Skills (${review.skills.length})`}
              selected={review.selected.skills}
              onToggle={toggleGroup}
              summary={review.skills.join(", ") || "Nothing found"}
            />
          </ul>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!hasSelection}
              onClick={applySelected}
            >
              <Check className="h-3.5 w-3.5" />
              Apply selected
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={reset}>
              Discard
            </Button>
          </div>
        </div>
      ) : null}
    </FieldGroup>
  );
}

function RankSummary({ stats }: { stats: GithubStatsPayload }) {
  const rank = computeRank({
    totalStars: stats.totalStars,
    followers: stats.followers,
    publicRepos: stats.publicRepos,
    repoCount: stats.repoCount,
    topLanguages: stats.topLanguages,
  });

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-bg px-3 py-2.5">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <Sparkles className="h-3.5 w-3.5 text-ink-3" />
          Rank: {rank.tier.label}
        </p>
        <p className="mt-0.5 truncate text-xs text-ink-3">
          {rank.factors.map((f) => `${f.label} ${f.points}/${f.max}`).join(" · ")}
        </p>
      </div>
      <span className="shrink-0 text-lg font-semibold tabular-nums text-ink">
        {rank.score}
        <span className="text-xs font-medium text-ink-3">/100</span>
      </span>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line bg-bg px-3 py-2">
      <p className="flex items-center gap-1 text-[0.6875rem] font-medium text-ink-3">
        <Star className="h-3 w-3" />
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-ink">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function ReviewRow({
  groupKey,
  title,
  summary,
  selected,
  onToggle,
}: {
  groupKey: GroupKey;
  title: string;
  summary: string;
  selected: boolean;
  onToggle: (key: GroupKey, checked: boolean) => void;
}) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-md border border-line bg-bg px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-3">
          {summary}
        </p>
      </div>
      <Switch
        checked={selected}
        onCheckedChange={(checked) => onToggle(groupKey, checked)}
        aria-label={`Apply ${title}`}
        className="mt-0.5 shrink-0"
      />
    </li>
  );
}