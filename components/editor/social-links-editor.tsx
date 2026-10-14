"use client";

import { useFieldArray, useWatch, type Control } from "react-hook-form";
import { ArrowDown, ArrowUp, Eye, EyeOff, Trash2 } from "@/components/icons/ui-icons";
import { useEditor } from "./editor-provider";
import { Field, FieldGroup } from "./field-helpers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PlatformIcon, PLATFORM_META } from "@/components/icons/platform-icons";
import { SOCIAL_PLATFORMS } from "@/lib/profile/platforms";
import { createId, cn } from "@/lib/utils";
import type { Profile, SocialLink, SocialPlatform } from "@/types";

function platformOptions(existing: SocialLink[]) {
  return SOCIAL_PLATFORMS.map((platform) => {
    const inUse = existing.some((link) => link.platform === platform);
    return { platform, inUse };
  });
}

export function SocialLinksEditor() {
  const { form } = useEditor();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control as Control<Profile>,
    name: "socials",
  });

  const socials = useWatch({ control: form.control, name: "socials" });

  const visibleCount = socials.filter((link) => link.visible && link.url.trim()).length;

  function addPlatform(platform: SocialPlatform) {
    append({
      id: createId("social"),
      platform,
      label: "",
      url: platform === "email" ? "mailto:" : PLATFORM_META[platform].baseUrl,
      visible: true,
    });
  }

  return (
    <FieldGroup
      title="Social links"
      description="Add the platforms you want shown. Reorder, hide, or remove any link."
      badge={
        <span className="shrink-0 text-[0.6875rem] font-medium text-ink-3">
          {visibleCount} shown
        </span>
      }
    >
      <div className="flex flex-wrap gap-1.5">
        {platformOptions(socials).map(({ platform, inUse }) => (
          <button
            key={platform}
            type="button"
            onClick={() => addPlatform(platform)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md border border-line-2 bg-surface px-2.5 text-xs font-medium text-ink-2 transition-colors",
              "hover:border-ink/30 hover:text-ink",
              inUse && "opacity-60",
            )}
            aria-label={`Add ${PLATFORM_META[platform].label} link`}
          >
            <PlatformIcon platform={platform} className="h-3.5 w-3.5" />
            {PLATFORM_META[platform].label}
          </button>
        ))}
      </div>

      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-2 bg-surface-2/60 p-6 text-center">
          <p className="text-sm font-medium text-ink-2">No links yet</p>
          <p className="mt-1 text-xs text-ink-3">
            Pick a platform above to add your first link.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {fields.map((field, index) => {
            const error = form.formState.errors.socials?.[index];
            // useFieldArray's `fields` can run one render ahead of `useWatch`
            // after an append — the watched array is briefly shorter than the
            // rendered rows — so fall back to the field object, which already
            // carries every SocialLink value, instead of crashing.
            const link = socials[index] ?? field;

            return (
              <li
                key={field.id}
                className="rounded-lg border border-line bg-surface p-3"
              >
                <div className="flex items-center gap-2">
                  <PlatformIcon
                    platform={link.platform}
                    className="h-4 w-4 shrink-0 text-ink-2"
                  />
                  <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-ink-3">
                    {PLATFORM_META[link.platform].label}
                  </span>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="quiet"
                          size="icon-sm"
                          disabled={index === 0}
                          onClick={() => move(index, index - 1)}
                          aria-label={`Move ${PLATFORM_META[link.platform].label} up`}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Move up</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="quiet"
                          size="icon-sm"
                          disabled={index === fields.length - 1}
                          onClick={() => move(index, index + 1)}
                          aria-label={`Move ${PLATFORM_META[link.platform].label} down`}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Move down</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="quiet"
                          size="icon-sm"
                          onClick={() =>
                            form.setValue(
                              `socials.${index}.visible`,
                              !link.visible,
                              { shouldDirty: true },
                            )
                          }
                          aria-label={
                            link.visible
                              ? `Hide ${PLATFORM_META[link.platform].label}`
                              : `Show ${PLATFORM_META[link.platform].label}`
                          }
                        >
                          {link.visible ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-ink-3" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{link.visible ? "Hide" : "Show"}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="quiet"
                          size="icon-sm"
                          onClick={() => remove(index)}
                          aria-label={`Remove ${PLATFORM_META[link.platform].label} link`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remove</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5">
                  <Field
                    id={`socials.${index}.label`}
                    label="Label"
                    error={error?.label?.message}
                  >
                    <Input
                      id={`socials.${index}.label`}
                      placeholder={PLATFORM_META[link.platform].placeholder}
                      aria-invalid={Boolean(error?.label)}
                      {...form.register(`socials.${index}.label` as const)}
                    />
                  </Field>
                  <Field
                    id={`socials.${index}.url`}
                    label="URL"
                    error={error?.url?.message}
                  >
                    <Input
                      id={`socials.${index}.url`}
                      inputMode="url"
                      autoCapitalize="none"
                      spellCheck={false}
                      aria-invalid={Boolean(error?.url)}
                      {...form.register(`socials.${index}.url` as const)}
                    />
                  </Field>
                </div>

                <label className="mt-3 flex items-center gap-2.5">
                  <Switch
                    checked={link.visible}
                    onCheckedChange={(checked) =>
                      form.setValue(`socials.${index}.visible`, checked, {
                        shouldDirty: true,
                      })
                    }
                    aria-label={`Show ${PLATFORM_META[link.platform].label} on profile`}
                  />
                  <span className="text-xs text-ink-2">
                    {link.visible ? "Visible on profile" : "Hidden"}
                  </span>
                </label>

                {!link.visible ? (
                  <p className="mt-2 text-[0.6875rem] text-ink-3">
                    Hidden links stay in your draft but never render.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[0.6875rem] leading-relaxed text-ink-3">
        Up to 12 links. Only <code className="font-mono">http(s)</code> and{" "}
        <code className="font-mono">mailto</code> URLs are ever rendered.
      </p>
    </FieldGroup>
  );
}
