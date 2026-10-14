"use client";

import { useFieldArray, useWatch, type Control } from "react-hook-form";
import { ArrowDown, ArrowUp, Trash2 } from "@/components/icons/ui-icons";
import { useEditor } from "./editor-provider";
import { Field, FieldGroup } from "./field-helpers";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { createId } from "@/lib/utils";
import { safeExternalUrl } from "@/lib/validation/profile";
import type { Profile } from "@/types";

const SECTION_LABELS: { key: keyof Profile["sections"]; title: string; hint: string }[] = [
  { key: "about", title: "About me", hint: "Bio and interests" },
  { key: "skills", title: "Skills", hint: "Your skill chips" },
  { key: "projects", title: "Featured projects", hint: "Selected work" },
  { key: "contact", title: "Contact information", hint: "Website, email, location" },
];

export function FeaturedEditor() {
  const { form } = useEditor();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control as Control<Profile>,
    name: "projects",
  });

  const sections = useWatch({ control: form.control, name: "sections" });
  const projects = useWatch({ control: form.control, name: "projects" });

  return (
    <FieldGroup
      title="Sections & work"
      description="Choose what appears on your profile, then edit the content."
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SECTION_LABELS.map(({ key, title, hint }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3.5 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{title}</p>
              <p className="text-[0.6875rem] text-ink-3">{hint}</p>
            </div>
            <Switch
              checked={sections[key]}
              onCheckedChange={(checked) =>
                form.setValue(`sections.${key}`, checked, { shouldDirty: true })
              }
              aria-label={`Show ${title} section`}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h3 className="text-sm font-semibold text-ink">Featured projects</h3>
          <p className="text-[0.6875rem] text-ink-3">
            {sections.projects
              ? "Shown when the Featured projects section is on."
              : "Hidden — enable the section above to show these."}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={fields.length >= 6}
          onClick={() =>
            append({
              id: createId("project"),
              title: "",
              description: "",
              url: "",
              tag: "",
              imageUrl: "",
            })
          }
        >
          Add project
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-2 bg-surface-2/60 p-6 text-center">
          <p className="text-sm font-medium text-ink-2">No projects yet</p>
          <p className="mt-1 text-xs text-ink-3">
            Add up to six pieces of work you want people to see first.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {fields.map((field, index) => {
            const error = form.formState.errors.projects?.[index];
            return (
              <li key={field.id} className="rounded-lg border border-line bg-surface p-3">
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-ink-3">
                    Project {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="quiet"
                    size="icon-sm"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                    aria-label={`Move project ${index + 1} up`}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="quiet"
                    size="icon-sm"
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                    aria-label={`Move project ${index + 1} down`}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="quiet"
                    size="icon-sm"
                    onClick={() => remove(index)}
                    aria-label={`Remove project ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5">
                  <div className="grid grid-cols-3 gap-2.5">
                    <Field
                      id={`projects.${index}.title`}
                      label="Title"
                      className="col-span-2"
                      error={error?.title?.message}
                    >
                      <Input
                        id={`projects.${index}.title`}
                        placeholder="Project name"
                        aria-invalid={Boolean(error?.title)}
                        {...form.register(`projects.${index}.title` as const)}
                      />
                    </Field>
                    <Field id={`projects.${index}.tag`} label="Tag" error={error?.tag?.message}>
                      <Input
                        id={`projects.${index}.tag`}
                        placeholder="Design"
                        aria-invalid={Boolean(error?.tag)}
                        {...form.register(`projects.${index}.tag` as const)}
                      />
                    </Field>
                  </div>

                  <Field
                    id={`projects.${index}.description`}
                    label="Description"
                    error={error?.description?.message}
                  >
                    <Textarea
                      id={`projects.${index}.description`}
                      rows={2}
                      placeholder="What it is and why it matters."
                      aria-invalid={Boolean(error?.description)}
                      {...form.register(`projects.${index}.description` as const)}
                    />
                  </Field>

                  <Field
                    id={`projects.${index}.url`}
                    label="URL"
                    error={error?.url?.message}
                  >
                    <Input
                      id={`projects.${index}.url`}
                      inputMode="url"
                      placeholder="https://projecturl.com"
                      aria-invalid={Boolean(error?.url)}
                      {...form.register(`projects.${index}.url` as const)}
                    />
                  </Field>

                  <Field
                    id={`projects.${index}.imageUrl`}
                    label="Screenshot URL"
                    hint="Optional — shows a preview image on the project card."
                    error={error?.imageUrl?.message}
                  >
                    <Input
                      id={`projects.${index}.imageUrl`}
                      inputMode="url"
                      placeholder="https://…/screenshot.png"
                      aria-invalid={Boolean(error?.imageUrl)}
                      {...form.register(`projects.${index}.imageUrl` as const)}
                    />
                  </Field>
                  {(() => {
                    const preview = safeExternalUrl(
                      projects?.[index]?.imageUrl ?? "",
                    );
                    if (!preview) return null;
                    return (
                      <div className="overflow-hidden rounded-md border border-line">
                        {/* Plain img on purpose: instant local preview with no
                            optimizer round-trip; the public page uses next/image. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          className="aspect-video w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.closest("div")?.remove();
                          }}
                        />
                      </div>
                    );
                  })()}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </FieldGroup>
  );
}
