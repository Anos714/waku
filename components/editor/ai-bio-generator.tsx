"use client";

import { useState } from "react";
import { useWatch } from "react-hook-form";
import { Check, Loader2, Sparkles, Wand2 } from "@/components/icons/ui-icons";
import { useEditor } from "./editor-provider";
import { Field, FieldGroup } from "./field-helpers";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AiVariation, WritingStyle } from "@/types";

type Status = "idle" | "loading" | "error" | "ready";
type Target = "bio" | "tagline";

interface ErrorResponse {
  ok: false;
  code: string;
  message: string;
  hint?: string;
}

const STYLE_LABELS: { value: WritingStyle; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "minimal", label: "Minimal" },
  { value: "creative", label: "Creative" },
];

export function AiBioGenerator() {
  const { form } = useEditor();
  const [status, setStatus] = useState<Status>("idle");
  const [target, setTarget] = useState<Target>("bio");
  const [style, setStyle] = useState<WritingStyle>("professional");
  const [variations, setVariations] = useState<AiVariation[]>([]);
  const [draft, setDraft] = useState("");
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const role = useWatch({ control: form.control, name: "role" }) ?? "";
  const skills = useWatch({ control: form.control, name: "skills" }) ?? [];
  const interests = useWatch({ control: form.control, name: "interests" }) ?? [];

  async function run() {
    if (!role.trim()) {
      setInlineError("Add your professional role first. The writer builds from it.");
      return;
    }
    setInlineError(null);
    setStatus("loading");
    setError(null);
    setVariations([]);
    setDraft("");
    setApplied(false);

    try {
      const response = await fetch("/api/ai/bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: target,
          role: role.trim(),
          skills: skills.filter((s) => s.trim()),
          interests: interests.filter((s) => s.trim()),
          style,
          name: form.watch("name")?.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as
        | { ok: true; variations: AiVariation[] }
        | ErrorResponse;

      if (!response.ok || !payload.ok) {
        setStatus("error");
        setError(payload as ErrorResponse);
        return;
      }

      setVariations(payload.variations);
      setDraft(payload.variations[0]?.text ?? "");
      setStatus("ready");
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

  function apply() {
    if (!draft.trim()) return;
    form.setValue(target, draft.trim(), { shouldDirty: true });
    setApplied(true);
    window.setTimeout(() => setApplied(false), 2200);
  }

  const needsConfig = error?.code === "MISSING_API_KEY";
  const allBusy = error?.code === "ALL_MODELS_UNAVAILABLE";

  return (
    <FieldGroup
      title="AI writer"
      description="Drafts a bio or tagline from your role, skills and interests. Nothing is invented, only what you supplied is used."
      badge={
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/30 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-ink-2 ring-1 ring-inset ring-accent/60">
          <Sparkles className="h-3 w-3" />
          Groq
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="ai-target" label="Generate">
          <Select
            value={target}
            onValueChange={(value) => {
              setTarget(value as Target);
              setStatus("idle");
            }}
          >
            <SelectTrigger id="ai-target">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bio">A short bio</SelectItem>
              <SelectItem value="tagline">A tagline</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field id="ai-style" label="Writing style">
          <Select value={style} onValueChange={(value) => setStyle(value as WritingStyle)}>
            <SelectTrigger id="ai-style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STYLE_LABELS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="rounded-lg border border-line bg-surface-2/70 p-3.5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3">
          Writing from
        </p>
        <dl className="mt-2 flex flex-col gap-1 text-xs">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-ink-3">Role</dt>
            <dd className="text-ink-2">{role.trim() || "Not set"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-ink-3">Skills</dt>
            <dd className="text-ink-2">{skills.filter((s) => s.trim()).join(", ") || "Not set"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-ink-3">Interests</dt>
            <dd className="text-ink-2">
              {interests.filter((s) => s.trim()).join(", ") || "Not set"}
            </dd>
          </div>
        </dl>
      </div>

      {inlineError ? (
        <Alert variant="warning">
          <AlertTitle>Missing role</AlertTitle>
          <AlertDescription>{inlineError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="accent"
          onClick={run}
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          {status === "loading"
            ? "Writing…"
            : target === "bio"
              ? "Generate bio"
              : "Generate tagline"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setTarget(target === "bio" ? "tagline" : "bio");
            setStatus("idle");
          }}
        >
          Switch to {target === "bio" ? "tagline" : "bio"}
        </Button>
      </div>

      {status === "loading" ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-2 rounded-lg border border-line bg-surface p-3.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : null}

      {status === "error" && error ? (
        <Alert variant={needsConfig || allBusy ? "warning" : "error"}>
          <AlertTitle>
            {needsConfig
              ? "AI generation is not configured"
              : allBusy
                ? "All AI models are busy"
                : "Generation failed"}
          </AlertTitle>
          <AlertDescription>
            {error.message}
            {error.hint ? <span className="mt-1.5 block">{error.hint}</span> : null}
          </AlertDescription>
          {needsConfig ? (
            <p className="mt-2 text-[0.75rem]">
              Copy <code className="font-mono">.env.example</code> to{" "}
              <code className="font-mono">.env.local</code>, add your key, and restart. The rest
              of Waku is unaffected.
            </p>
          ) : null}
        </Alert>
      ) : null}

      {status === "ready" && variations.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3">
              {variations.length} variations
            </p>
            <ul className="mt-2 flex flex-col gap-2">
              {variations.map((variation, index) => (
                <li
                  key={variation.id}
                  className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3"
                >
                  <span className="mt-0.5 text-xs font-mono text-ink-3">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="flex-1 text-sm leading-relaxed text-ink-2">
                    {variation.text}
                  </p>
                  <Button
                    type="button"
                    variant="quiet"
                    size="sm"
                    onClick={() => setDraft(variation.text)}
                  >
                    Edit
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <Field
            id="ai-draft"
            label="Review and edit before applying"
            hint={`${draft.length} characters`}
          >
            <Textarea
              id="ai-draft"
              rows={target === "bio" ? 4 : 2}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="default"
              onClick={apply}
              disabled={!draft.trim()}
            >
              {applied ? <Check className="h-4 w-4" /> : null}
              {applied
                ? "Applied to profile"
                : `Apply as ${target === "bio" ? "bio" : "tagline"}`}
            </Button>
            <Button type="button" variant="quiet" onClick={() => setStatus("idle")}>
              Discard
            </Button>
          </div>
        </div>
      ) : null}

      {status === "idle" ? (
        <p className="text-[0.6875rem] leading-relaxed text-ink-3">
          The writer only uses the role, skills and interests above. It will not
          invent employers, metrics, clients or qualifications.
        </p>
      ) : null}
    </FieldGroup>
  );
}
