"use client";

import { useCallback, useState } from "react";
import { useWatch } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { ImagePlus, Loader2, X, AlertTriangle } from "@/components/icons/ui-icons";
import { useEditor } from "./editor-provider";
import { Field } from "./field-helpers";
import { Input } from "@/components/ui/input";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { cn } from "@/lib/utils";
import { isValidAvatarUrl, isCloudinaryPublicId } from "@/lib/profile/format";

type Status = "idle" | "uploading" | "error";

/**
 * Drag-and-drop profile photo uploader. Files go to the /api/upload route,
 * which stores them on Cloudinary and returns a compressed WebP URL. A manual
 * URL field stays available for hosted images.
 */
export function PhotoUploader() {
  const { form } = useEditor();
  const avatarUrl = useWatch({ control: form.control, name: "avatarUrl" });
  const name = useWatch({ control: form.control, name: "name" });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;

      setStatus("uploading");
      setErrorMessage(null);

      try {
        const payload = new FormData();
        payload.append("file", file);

        const response = await fetch("/api/upload", { method: "POST", body: payload });
        const body = (await response.json()) as
          | { ok: true; publicId: string; url: string }
          | { ok: false; message: string; hint?: string };

        if (!response.ok || !body.ok) {
          setStatus("error");
          setErrorMessage(!body.ok ? body.message : "The upload failed.");
          return;
        }

        // Store the public ID — delivery URLs (AVIF/WebP) are derived from it.
        form.setValue("avatarUrl", body.publicId, { shouldDirty: true });
        setStatus("idle");
      } catch {
        setStatus("error");
        setErrorMessage("The upload could not reach the server.");
      }
    },
    [form],
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

  const hasPhoto = isValidAvatarUrl(avatarUrl) || isCloudinaryPublicId(avatarUrl);

  return (
    <Field
      id="avatarUrl"
      label="Profile photo"
      hint={hasPhoto ? "Uploaded. Delivered as AVIF/WebP from Cloudinary" : "Optional. A monogram is used when empty"}
      error={form.formState.errors.avatarUrl?.message}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {hasPhoto ? (
            <span className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-line-2">
              <ProfileAvatar name={name || "You"} src={avatarUrl} size={64} radius={9999} plain />
            </span>
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-line-2 bg-surface-2 text-ink-3">
              <ImagePlus className="h-5 w-5" />
            </span>
          )}

          <div
            {...getRootProps()}
            role="button"
            tabIndex={0}
            aria-label="Upload a profile photo"
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
                    ? "Drop the photo here"
                    : "Drop a photo or click to browse"}
              </span>
              <span className="block text-[0.6875rem] text-ink-3">
                JPG, PNG, WebP · up to 8 MB · converted to WebP
              </span>
            </span>
          </div>
        </div>

        {hasPhoto ? (
          <button
            type="button"
            onClick={() => form.setValue("avatarUrl", "", { shouldDirty: true })}
            className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-ink-3 transition-colors hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
            Remove photo
          </button>
        ) : null}

        {status === "error" && errorMessage ? (
          <p className="flex items-start gap-1.5 text-xs font-medium text-red-600">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {errorMessage}
          </p>
        ) : null}

        <div className="flex items-center gap-2">
          <Input
            id="avatarUrl"
            inputMode="url"
            placeholder="…or paste an image URL"
            aria-invalid={Boolean(form.formState.errors.avatarUrl)}
            {...form.register("avatarUrl")}
            className="h-9"
          />
        </div>
      </div>
    </Field>
  );
}
