"use client";

import { useWatch } from "react-hook-form";
import { useEditor } from "./editor-provider";
import { Field, FieldGroup } from "./field-helpers";
import { PhotoUploader } from "./photo-uploader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { parseListInput } from "@/lib/profile/format";

export function BasicFields() {
  const { form } = useEditor();
  const register = form.register;
  const errors = form.formState.errors;

  // Reactive reads use useWatch so they update under the React Compiler.
  const bio = useWatch({ control: form.control, name: "bio" });
  const skills = useWatch({ control: form.control, name: "skills" });
  const interests = useWatch({ control: form.control, name: "interests" });

  return (
    <FieldGroup
      title="Profile"
      description="The essentials. Everything here appears on your profile page and card."
      badge={
        <span className="shrink-0 rounded-full bg-accent/30 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-ink-2 ring-1 ring-inset ring-accent/60">
          Example data
        </span>
      }
    >
      <Field
        id="name"
        label="Full name"
        required
        error={errors.name?.message}
      >
        <Input
          id="name"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
      </Field>

      <Field id="role" label="Professional role" error={errors.role?.message}>
        <Input
          id="role"
          placeholder="Product designer"
          aria-invalid={Boolean(errors.role)}
          {...register("role")}
        />
      </Field>

      <Field
        id="tagline"
        label="Tagline"
        hint="One line under your name"
        error={errors.tagline?.message}
      >
        <Input
          id="tagline"
          placeholder="Designing calm interfaces for loud products."
          aria-invalid={Boolean(errors.tagline)}
          {...register("tagline")}
        />
      </Field>

      <Field
        id="bio"
        label="Short bio"
        hint={`${bio?.length ?? 0} / 600`}
        error={errors.bio?.message}
      >
        <Textarea
          id="bio"
          rows={4}
          aria-invalid={Boolean(errors.bio)}
          {...register("bio")}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="location" label="Location" hint="Optional" error={errors.location?.message}>
          <Input
            id="location"
            placeholder="Berlin, Germany"
            aria-invalid={Boolean(errors.location)}
            {...register("location")}
          />
        </Field>

        <Field
          id="websiteUrl"
          label="Website"
          hint="Optional"
          error={errors.websiteUrl?.message}
        >
          <Input
            id="websiteUrl"
            inputMode="url"
            placeholder="https://yourwebsite.com"
            aria-invalid={Boolean(errors.websiteUrl)}
            {...register("websiteUrl")}
          />
        </Field>
      </div>

      <PhotoUploader />

      <Alert variant="info">
        <AlertTitle>This is editable example data</AlertTitle>
        <AlertDescription>
          The editor starts from a fictional demo profile so you can see every
          option in context. Replace any field with your own — the draft is
          saved in this browser only.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="skills"
          label="Skills"
          hint="Comma separated"
          error={errors.skills?.message}
        >
          <Input
            id="skills"
            placeholder="TypeScript, Design systems"
            defaultValue={skills?.join(", ")}
            onBlur={(event) =>
              form.setValue("skills", parseListInput(event.target.value), {
                shouldDirty: true,
              })
            }
          />
        </Field>

        <Field
          id="interests"
          label="Interests"
          hint="Comma separated"
          error={errors.interests?.message}
        >
          <Input
            id="interests"
            placeholder="Typography, Cycling"
            defaultValue={interests?.join(", ")}
            onBlur={(event) =>
              form.setValue("interests", parseListInput(event.target.value), {
                shouldDirty: true,
              })
            }
          />
        </Field>
      </div>
    </FieldGroup>
  );
}
