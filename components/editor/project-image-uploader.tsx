"use client";

import { useCallback, useState } from "react";
import { useWatch } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { ImagePlus, Loader2, X, AlertTriangle } from "@/components/icons/ui-icons";
import { useEditor } from "./editor-provider";
import { Field } from "./field-helpers";
import { Input } from "@/components/ui/input";
import { resolveProjectImageUrl } from "@/lib/profile/project-image";
import { cn } from "@/lib/utils";

type Status = "idle" | "uploading" | "error";

/**
 * Per-project screenshot picker: upload a file (stored on Cloudinary, same
 * `/api/upload` route as the avatar) or paste an image URL — exactly the
 * avatar flow, scoped to one project. The thumbnail stays small; the public
 * card shows the same 64px thumb.
 */
export function ProjectImageUploader({ index }: { index: number }) {
  const { form } = useEditor();
  const projects = useWatch({ control: form.control, name: "projects" });
  const imageUrl = projects?.[index]?.imageUrl ?? "";
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fieldId = `projects.${index}.imageUrl`;
  const fieldError = form.formState.errors.projects?.[index];
  const validationError =
    fieldError && typeof fieldError === "object" && "imageUrl" in fieldError
      ? (fieldError as { imageUrl?: { message?: string } }).imageUrl?.message
      : undefined;

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;

      setStatus("uploading");
      setErrorMessage(null);

      try {
        const payload = new FormData();
        payload.append("file", file);
        payload.append("kind", "project");

        const response = await fetch("/api/upload", { method: "POST", body: payload });
        const body = (await response.json()) as
          | { ok: true; publicId: string; url: string }
          | { ok: false; message: string; hint?: string };

        if (!response.ok || !body.ok) {
          setStatus("error");
          setErrorMessage(!body.ok ? body.message : "The upload failed.");
          return;
        }

        // Store the public ID — the thumbnail delivery URL is derived from it.
        form.setValue(`projects.${index}.imageUrl` as const, body.publicId, {
          shouldDirty: true,
        });
        setStatus("idle");
      } catch {
        setStatus("error");
        setErrorMessage("The upload could not reach the server.");
      }
    },
    [form, index],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/avif": [".avif"],
      "image/gif": [".gif"],
    },
    maxSize: 8 * 1024 * 1024,
    multiple: false,
    disabled: status === "uploading",
  });

  const preview = resolveProjectImageUrl(imageUrl);

  return (
    <Field
      id={fieldId}
      label="Screenshot"
      hint="Small thumbnail on the card"
      error={validationError}
    >
      <div className="flex items-center gap-3">
        {preview ? (
          <span className="aspect-[16/10] w-32 shrink-0 overflow-hidden rounded-md border border-line-2 bg-surface-2">
            {/* Plain img on purpose: instant local preview with no
                optimizer round-trip; the public page uses next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.closest("span")?.remove();
              }}
            />
          </span>
        ) : (
          <span className="flex aspect-[16/10] w-32 shrink-0 items-center justify-center rounded-md border border-dashed border-line-2 bg-surface-2 text-ink-3">
            <ImagePlus className="h-5 w-5" />
          </span>
        )}

        <div
          {...getRootProps()}
          role="button"
          tabIndex={0}
          aria-label={`Upload a screenshot for project ${index + 1}`}
          className={cn(
            "group flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg border bg-surface px-3.5 py-3 text-left transition-colors",
            isDragActive && !isDragReject
              ? "border-accent bg-accent/10"
              : isDragReject
                ? "border-red-400 bg-red-50"
                : "border-line-2 hover:border-line-2/70 hover:bg-surface-2",
            status === "uploading" && "cursor-progress opacity-70",
          )}
        >
          <input {...getInputProps()} />
          {status === "uploading" ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink-2" />
          ) : (
            <ImagePlus className="h-4 w-4 shrink-0 text-ink-3 transition-colors group-hover:text-ink-2" />
          )}
          <span className="min-w-0">
            <span className="block text-sm font-medium text-ink">
              {status === "uploading"
                ? "Uploading…"
                : isDragActive
                  ? "Drop the screenshot here"
                  : "Drop an image or click to browse"}
            </span>
            <span className="block text-[0.6875rem] text-ink-3">
              JPG, PNG, WebP · up to 8 MB
            </span>
          </span>
        </div>
      </div>

      {preview ? (
        <button
          type="button"
          onClick={() =>
            form.setValue(`projects.${index}.imageUrl` as const, "", {
              shouldDirty: true,
            })
          }
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-ink-3 transition-colors hover:text-red-600"
        >
          <X className="h-3.5 w-3.5" />
          Remove screenshot
        </button>
      ) : null}

      {status === "error" && errorMessage ? (
        <p className="flex items-start gap-1.5 text-xs font-medium text-red-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {errorMessage}
        </p>
      ) : null}

      <Input
        id={fieldId}
        inputMode="url"
        placeholder="…or paste an image URL"
        aria-invalid={Boolean(validationError)}
        {...form.register(`projects.${index}.imageUrl` as const)}
        className="h-9"
      />
    </Field>
  );
}
