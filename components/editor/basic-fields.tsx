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
  // Text boxes are controlled from these watched values (rather than relying
  // on react-hook-form's imperative DOM writes on reset/apply) so the
  // displayed text can never drift from the form state.
  const watched = {
    name: useWatch({ control: form.control, name: "name" }),
    role: useWatch({ control: form.control, name: "role" }),
    tagline: useWatch({ control: form.control, name: "tagline" }),
    bio: useWatch({ control: form.control, name: "bio" }),
    location: useWatch({ control: form.control, name: "location" }),
    websiteUrl: useWatch({ control: form.control, name: "websiteUrl" }),
  };

  function bindText(
    name: "name" | "role" | "tagline" | "bio" | "location" | "websiteUrl",
  ) {
    return {
      value: watched[name] ?? "",
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) =>
        form.setValue(name, event.target.value, {
          shouldDirty: true,
          shouldValidate: true,
        }),
    };
  }

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
          {...bindText("name")}
        />
      </Field>

      <Field id="role" label="Professional role" error={errors.role?.message}>
        <Input
          id="role"
          placeholder="Product designer"
          aria-invalid={Boolean(errors.role)}
          {...register("role")}
          {...bindText("role")}
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
          {...bindText("tagline")}
        />
      </Field>

      <Field
        id="bio"
        label="Short bio"
        hint={`${watched.bio?.length ?? 0} / 600`}
        error={errors.bio?.message}
      >
        <Textarea
          id="bio"
          rows={4}
          aria-invalid={Boolean(errors.bio)}
          {...register("bio")}
          {...bindText("bio")}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="location" label="Location" hint="Optional" error={errors.location?.message}>
          <Input
            id="location"
            placeholder="Berlin, Germany"
            aria-invalid={Boolean(errors.location)}
            {...register("location")}
            {...bindText("location")}
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
            {...bindText("websiteUrl")}
          />
        </Field>
      </div>

      <PhotoUploader />

      <Alert variant="info">
        <AlertTitle>This is editable example data</AlertTitle>
        <AlertDescription>
          The editor starts from a demo profile so you can see every option in
          context. Replace any field with your own. The draft is saved in this
          browser only.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommaListField
          id="skills"
          label="Skills"
          hint="Comma separated"
          name="skills"
          placeholder="TypeScript, Design systems"
          error={errors.skills?.message}
        />

        <CommaListField
          id="interests"
          label="Interests"
          hint="Comma separated"
          name="interests"
          placeholder="Typography, Cycling"
          error={errors.interests?.message}
        />
      </div>
    </FieldGroup>
  );
}

/**
 * A comma-separated text box for a string-array field.
 *
 * The form holds an array but the user types text, committed on every
 * keystroke so the live preview follows along. The box itself stays
 * uncontrolled (typed commas and spaces are never normalized away mid-type)
 * and re-seeds from the form only when `formRevision` bumps — reset to demo
 * or resume-apply — so external rewrites can never leave stale text behind.
 */
function CommaListField({
  id,
  label,
  hint,
  name,
  placeholder,
  error,
}: {
  id: string;
  label: string;
  hint?: string;
  name: "skills" | "interests";
  placeholder?: string;
  error?: string;
}) {
  const { form, formRevision } = useEditor();
  const values = useWatch({ control: form.control, name }) ?? [];
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <Input
        key={`${name}-${formRevision}`}
        id={id}
        placeholder={placeholder}
        defaultValue={values.join(", ")}
        onChange={(event) =>
          form.setValue(name, parseListInput(event.target.value), {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      />
    </Field>
  );
}
