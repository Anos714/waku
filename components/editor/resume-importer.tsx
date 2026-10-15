"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  X,
} from "@/components/icons/ui-icons";
import { useEditor } from "./editor-provider";
import { Field, FieldGroup } from "./field-helpers";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { extractPdfTextFromFile } from "@/lib/resume/extract-pdf-text";
import { createId } from "@/lib/utils";
import type { ResumePatch } from "@/lib/ai/resume";

type Status = "idle" | "uploading" | "reviewing" | "applied" | "error";

/** Browser-side guard matching the server's text bound. */
const MAX_PDF_BYTES = 5 * 1024 * 1024;

type GroupKey = "basics" | "bio" | "skills" | "interests" | "projects";

interface ReviewState {
  patch: ResumePatch;
  warnings: string[];
  model: string;
  selected: Record<GroupKey, boolean>;
}

interface ErrorResponse {
  ok: false;
  code: string;
  message: string;
  hint?: string;
}

/**
 * Resume import: upload a PDF, AI drafts the profile fields, the user reviews
 * every group before anything touches the draft. Applying a group replaces
 * that field — nothing is merged silently.
 */
export function ResumeImporter() {
  const { form, notifyFormExternalChange } = useEditor();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [review, setReview] = useState<ReviewState | null>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);

  function reset() {
    setFileName(null);
    setReview(null);
    setError(null);
    setStatus("idle");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function analyze() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);

    // The PDF never leaves this browser as bytes: text is extracted here and
    // only the text is posted, so the server needs no PDF tooling at all.
    if (file.size > MAX_PDF_BYTES) {
      setStatus("error");
      setError({
        ok: false,
        code: "FILE_TOO_LARGE",
        message: "That resume is larger than 5 MB.",
        hint: "Export a smaller PDF and try again.",
      });
      return;
    }

    let text: string;
    try {
      text = await extractPdfTextFromFile(file);
    } catch {
      setStatus("error");
      setError({
        ok: false,
        code: "PDF_READ_FAILED",
        message: "That PDF could not be read in this browser.",
        hint: "If it is scanned images, export a text-based PDF instead.",
      });
      return;
    }

    if (text.length < 50) {
      setStatus("error");
      setError({
        ok: false,
        code: "NO_TEXT",
        message: "No readable text was found in that PDF.",
        hint: "If it is scanned images, export a text-based PDF instead.",
      });
      return;
    }

    try {
      const response = await fetch("/api/ai/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const body = (await response.json()) as
        | { ok: true; patch: ResumePatch; warnings: string[]; model: string }
        | ErrorResponse;

      if (!response.ok || !body.ok) {
        setStatus("error");
        setError(body as ErrorResponse);
        return;
      }

      setReview({
        patch: body.patch,
        warnings: body.warnings,
        model: body.model,
        selected: {
          basics: true,
          bio: true,
          skills: true,
          interests: true,
          projects: true,
        },
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

  function toggleGroup(key: GroupKey, checked: boolean) {
    setReview((prev) =>
      prev ? { ...prev, selected: { ...prev.selected, [key]: checked } } : prev,
    );
  }

  function applySelected() {
    if (!review) return;
    const { patch, selected } = review;
    const set = form.setValue;

    if (selected.basics) {
      set("name", patch.name || form.getValues("name"), { shouldDirty: true });
      set("role", patch.role, { shouldDirty: true });
      set("location", patch.location, { shouldDirty: true });
      set("websiteUrl", patch.websiteUrl, { shouldDirty: true });
    }
    if (selected.bio) set("bio", patch.bio, { shouldDirty: true });
    if (selected.skills) set("skills", patch.skills, { shouldDirty: true });
    if (selected.interests)
      set("interests", patch.interests, { shouldDirty: true });
    if (selected.projects && patch.projects.length > 0) {
      set(
        "projects",
        patch.projects.map((project) => ({
          id: createId("project"),
          title: project.title,
          description: project.description,
          url: project.url,
          tag: project.tag,
          imageUrl: "",
        })),
        { shouldDirty: true },
      );
    }
    // Uncontrolled boxes (skills, interests) re-seed from the new values.
    notifyFormExternalChange();
    setStatus("applied");
  }

  const hasSelection =
    review != null && (Object.values(review.selected) as boolean[]).some(Boolean);

  return (
    <FieldGroup
      title="Import from resume"
      description="Upload a PDF resume. AI drafts the fields — you review everything before anything changes."
    >
      {status === "applied" ? (
        <div className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/25 text-ink">
            <Check className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">Applied to your draft</p>
            <p className="mt-0.5 text-xs text-ink-3">
              The selected fields are in the form now — edit freely, nothing is
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
              Import another resume
            </Button>
          </div>
        </div>
      ) : (
        <Field id="resume-file" label="PDF resume" hint="Stays in your browser, max 5 MB">
          <div className="flex items-center gap-2.5">
            <label
              htmlFor="resume-file"
              className="group flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg border border-line-2 bg-surface px-3.5 py-3 transition-colors hover:bg-surface-2"
            >
              <FileText className="h-4 w-4 shrink-0 text-ink-3 transition-colors group-hover:text-ink-2" />
              <span className="block truncate text-sm font-medium text-ink">
                {fileName ?? "Choose a PDF resume…"}
              </span>
              <input
                ref={fileRef}
                id="resume-file"
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                disabled={status === "uploading"}
                onChange={(event) =>
                  setFileName(event.currentTarget.files?.[0]?.name ?? null)
                }
              />
            </label>
            <Button
              type="button"
              size="sm"
              disabled={!fileName || status === "uploading"}
              onClick={analyze}
            >
              {status === "uploading" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {status === "uploading" ? "Reading…" : "Analyze"}
            </Button>
          </div>
        </Field>
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setError(null);
              setStatus(review ? "reviewing" : "idle");
            }}
          >
            Dismiss
          </Button>
        </div>
      ) : null}

      {status === "reviewing" && review ? (
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">Review the draft</p>
              <p className="mt-0.5 text-xs text-ink-3">
                Extracted with {review.model}. Only checked groups will be
                applied — applying replaces those fields.
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              aria-label="Discard resume import"
              className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

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
                [
                  review.patch.name,
                  review.patch.role,
                  review.patch.location,
                  review.patch.websiteUrl,
                ]
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .join(" · ") || "Nothing found"
              }
            />
            <ReviewRow
              groupKey="bio"
              title="Bio"
              selected={review.selected.bio}
              onToggle={toggleGroup}
              summary={review.patch.bio.trim() || "Nothing found"}
            />
            <ReviewRow
              groupKey="skills"
              title={`Skills (${review.patch.skills.length})`}
              selected={review.selected.skills}
              onToggle={toggleGroup}
              summary={review.patch.skills.join(", ") || "Nothing found"}
            />
            <ReviewRow
              groupKey="interests"
              title={`Interests (${review.patch.interests.length})`}
              selected={review.selected.interests}
              onToggle={toggleGroup}
              summary={review.patch.interests.join(", ") || "Nothing found"}
            />
            <ReviewRow
              groupKey="projects"
              title={`Projects (${review.patch.projects.length})`}
              selected={review.selected.projects}
              onToggle={toggleGroup}
              summary={
                review.patch.projects.map((p) => p.title).join(" · ") ||
                "Nothing found"
              }
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
