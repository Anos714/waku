"use client";

import { useWatch } from "react-hook-form";
import { Check } from "@/components/icons/ui-icons";
import { useEditor } from "./editor-provider";
import { Field, FieldGroup } from "./field-helpers";
import { Input } from "@/components/ui/input";
import {
  ACCENT_PRESETS,
  FONT_PAIRINGS,
  THEME_PRESETS,
} from "@/lib/themes";
import { PROFILE_DESIGNS } from "@/components/profile/profile-designs";
import type {
  AvatarShape,
  BackgroundStyle,
  FontPairingId,
  ProfileDesignId,
  SocialButtonStyle,
  ThemeId,
} from "@/types";
import { cn } from "@/lib/utils";

function OptionTiles<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
  renderSwatch,
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
  renderSwatch?: (value: T) => React.ReactNode;
}) {
  const cols =
    columns === 4 ? "sm:grid-cols-4" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <div className={cn("grid grid-cols-1 gap-2", cols)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex items-center gap-2.5 rounded-lg border bg-surface px-3 py-2.5 text-left transition-[colors,transform] duration-150 active:scale-[0.98]",
              selected
                ? "border-ink ring-1 ring-ink/15"
                : "border-line-2 hover:border-line-2/70 hover:bg-surface-2",
            )}
          >
            {renderSwatch ? <span className="shrink-0">{renderSwatch(option.value)}</span> : null}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink">{option.label}</span>
              {option.hint ? (
                <span className="block text-[0.6875rem] text-ink-3">{option.hint}</span>
              ) : null}
            </span>
            {selected ? (
              <Check key={option.value} className="h-3.5 w-3.5 shrink-0 animate-pop text-ink" aria-hidden="true" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function Swatch({ colors, shape = "rounded" }: { colors: string[]; shape?: "rounded" | "full" }) {
  return (
    <span
      className="flex h-7 w-7 shrink-0 overflow-hidden ring-1 ring-inset ring-black/10"
      style={{ borderRadius: shape === "full" ? "9999px" : 6 }}
      aria-hidden="true"
    >
      {colors.map((color) => (
        <span key={color} className="h-full flex-1" style={{ background: color }} />
      ))}
    </span>
  );
}

const THEME_SWATCHES: Record<ThemeId, string[]> = {
  mono: ["#ffffff", "#0a0a0a"],
  terminal: ["#0d0f0d", "#8fdc6f"],
  editorial: ["#f4f0e8", "#b8460e"],
  aurora: ["#0e1014", "#7dd3c0"],
  noir: ["#000000", "#ffffff"],
  sunrise: ["#fff8f2", "#f2622e"],
  forest: ["#0d1612", "#86efac"],
  ocean: ["#0a1424", "#60a5fa"],
  neon: ["#130b1f", "#e879f9"],
  paper: ["#f6f6f3", "#4f46e5"],
};

/** Preview glyph uses the pairing's own heading stack so the swatch feels real. */
const FONT_SWATCH_FAMILY: Partial<Record<FontPairingId, string>> = {
  editorial: "var(--font-instrument-serif)",
  terminal: "var(--font-geist-mono)",
  playfair: "var(--font-playfair-display)",
  grotesque: "var(--font-space-grotesk)",
  lora: "var(--font-lora)",
  jetbrains: "var(--font-jetbrains-mono)",
};

const ACCENT_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function ThemeCustomizer() {
  const { form } = useEditor();
  // useWatch (not form.watch): the value is backed by React state, so it stays
  // reactive under the React Compiler, which would otherwise cache the
  // form.watch() result and leave the selected swatch/tile stuck.
  const theme = useWatch({ control: form.control, name: "theme" });
  const profileDesign = useWatch({ control: form.control, name: "profileDesign" });

  function update(patch: Partial<typeof theme>) {
    form.setValue("theme", { ...theme, ...patch }, { shouldDirty: true });
  }

  return (
    <FieldGroup
      title="Design"
      description="The preview updates instantly. Your content stays exactly as it was."
    >
      <Field id="profile-design" label="Profile design" hint="Page layout template">
        <OptionTiles<ProfileDesignId>
          columns={2}
          value={profileDesign}
          onChange={(value) =>
            form.setValue("profileDesign", value, { shouldDirty: true })
          }
          options={PROFILE_DESIGNS.map((design) => ({
            value: design.id,
            label: design.name,
            hint: design.description,
          }))}
          renderSwatch={(value) => <DesignGlyph value={value} />}
        />
      </Field>

      <Field id="theme-preset" label="Theme">
        <OptionTiles<ThemeId>
          columns={2}
          value={theme.theme}
          onChange={(value) => {
            const preset = THEME_PRESETS[value];
            update({ theme: value, accent: preset.tokens["--pt-accent"] });
          }}
          options={(Object.keys(THEME_PRESETS) as ThemeId[]).map((id) => ({
            value: id,
            label: THEME_PRESETS[id].name,
            hint: THEME_PRESETS[id].description,
          }))}
          renderSwatch={(value) => <Swatch colors={THEME_SWATCHES[value]} />}
        />
      </Field>

      <Field id="theme-accent" label="Accent color" hint="Applied to every theme">
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((preset) => {
            const selected =
              preset.value.toLowerCase() === theme.accent.toLowerCase();
            return (
              <button
                key={preset.value}
                type="button"
                aria-pressed={selected}
                aria-label={`${preset.label} accent`}
                title={preset.label}
                onClick={() => update({ accent: preset.value })}
                className={cn(
                  "h-8 w-8 rounded-full ring-1 ring-inset ring-black/15 transition-transform duration-150 hover:scale-110 active:scale-95",
                  selected && "ring-2 ring-ink ring-offset-2 ring-offset-surface",
                )}
                style={{ background: preset.value }}
              />
            );
          })}
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          {/* Native color picker — the eye-dropper/panel makes any accent
              reachable, not just the presets above. Its value must always be a
              complete hex, so an in-progress hex string is mirrored from the
              palette default until it becomes valid again. */}
          <input
            type="color"
            value={ACCENT_PATTERN.test(theme.accent) ? theme.accent : "#c6f24e"}
            onChange={(event) => update({ accent: event.target.value })}
            aria-label="Pick a custom accent color"
            className="h-8 w-9 shrink-0 cursor-pointer rounded-md border border-line-2 bg-surface p-1"
          />
          <Input
            id="theme-accent"
            className="h-8 w-32 font-mono text-xs"
            value={theme.accent}
            spellCheck={false}
            autoCapitalize="none"
            onChange={(event) => update({ accent: event.target.value })}
            aria-label="Custom accent hex color"
          />
          <span
            className="h-8 w-8 shrink-0 rounded-md ring-1 ring-inset ring-black/10"
            style={{ background: ACCENT_PATTERN.test(theme.accent) ? theme.accent : "var(--color-line-2)" }}
            aria-hidden="true"
          />
        </div>
        {!ACCENT_PATTERN.test(theme.accent) ? (
          <p className="text-xs font-medium text-red-600">
            Use a 6-digit hex color, like <code className="font-mono">#c6f24e</code>.
          </p>
        ) : null}
      </Field>

      <Field id="theme-font" label="Font pairing">
        <OptionTiles<FontPairingId>
          columns={2}
          value={theme.fontPairing}
          onChange={(value) => update({ fontPairing: value })}
          options={FONT_PAIRINGS.map((pairing) => ({
            value: pairing.id,
            label: pairing.name,
            hint: pairing.hint,
          }))}
          renderSwatch={(value) => (
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center bg-surface-2 text-sm font-semibold text-ink-2"
              style={{ borderRadius: 6, fontFamily: FONT_SWATCH_FAMILY[value] }}
              aria-hidden="true"
            >
              Aa
            </span>
          )}
        />
      </Field>

      <Field id="theme-avatar" label="Avatar shape">
        <OptionTiles<AvatarShape>
          columns={3}
          value={theme.avatarShape}
          onChange={(value) => update({ avatarShape: value })}
          options={[
            { value: "circle", label: "Circle" },
            { value: "rounded", label: "Rounded" },
            { value: "square", label: "Square" },
          ]}
          renderSwatch={(value) => (
            <span
              className="h-7 w-7 shrink-0 bg-ink"
              style={{
                borderRadius: value === "circle" ? "9999px" : value === "rounded" ? 7 : 0,
              }}
              aria-hidden="true"
            />
          )}
        />
      </Field>

      <Field id="theme-background" label="Background style">
        <OptionTiles<BackgroundStyle>
          columns={2}
          value={theme.background}
          onChange={(value) => update({ background: value })}
          options={[
            { value: "plain", label: "Plain", hint: "No treatment" },
            { value: "subtle", label: "Subtle glow" },
            { value: "grid", label: "Grid", hint: "Fine lines" },
            { value: "glow", label: "Aurora glow", hint: "Soft color wash" },
            { value: "dots", label: "Dots", hint: "Even dot field" },
            { value: "stripes", label: "Stripes", hint: "Diagonal hairlines" },
            { value: "mesh", label: "Mesh", hint: "Blended color blobs" },
            { value: "rings", label: "Rings", hint: "Concentric circles" },
          ]}
        />
      </Field>

      <Field id="theme-social" label="Social button style">
        <OptionTiles<SocialButtonStyle>
          columns={3}
          value={theme.socialStyle}
          onChange={(value) => update({ socialStyle: value })}
          options={[
            { value: "minimal", label: "Minimal" },
            { value: "outline", label: "Outline" },
            { value: "solid", label: "Solid" },
            { value: "soft", label: "Soft" },
            { value: "elevated", label: "Elevated" },
            { value: "underline", label: "Underline" },
          ]}
        />
      </Field>
    </FieldGroup>
  );
}

/** A tiny schematic of each profile page template, drawn with divs. */
function DesignGlyph({ value }: { value: ProfileDesignId }) {
  const bar = "rounded-[1px]";
  if (value === "centered") {
    return (
      <span className="flex h-7 w-7 shrink-0 flex-col items-center gap-[3px] rounded bg-surface-2 p-1.5" aria-hidden="true">
        <span className={`h-2.5 w-2.5 rounded-full bg-ink ${bar}`} />
        <span className={`h-[3px] w-3.5 bg-ink/55 ${bar}`} />
        <span className={`h-[3px] w-2.5 bg-ink/30 ${bar}`} />
      </span>
    );
  }
  if (value === "sidebar") {
    return (
      <span className="flex h-7 w-7 shrink-0 gap-[3px] rounded bg-surface-2 p-1.5" aria-hidden="true">
        <span className="flex w-2.5 flex-col items-center gap-[3px]">
          <span className={`h-2 w-2 rounded-full bg-ink ${bar}`} />
          <span className={`h-[3px] w-full bg-ink/55 ${bar}`} />
        </span>
        <span className="flex flex-1 flex-col gap-[3px] pt-[3px]">
          <span className={`h-[3px] w-full bg-ink/45 ${bar}`} />
          <span className={`h-[3px] w-full bg-ink/30 ${bar}`} />
        </span>
      </span>
    );
  }
  if (value === "hero") {
    return (
      <span className="flex h-7 w-7 shrink-0 flex-col gap-[3px] rounded bg-surface-2 p-1" aria-hidden="true">
        <span className={`h-2.5 w-full rounded-sm bg-accent/45 ${bar}`} />
        <span className="flex flex-1 flex-col gap-[3px] px-1">
          <span className={`h-[3px] w-full bg-ink/45 ${bar}`} />
          <span className={`h-[3px] w-2/3 bg-ink/30 ${bar}`} />
        </span>
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 flex-col gap-[3px] rounded bg-surface-2 p-1.5" aria-hidden="true">
      <span className="flex items-center gap-[3px]">
        <span className={`h-2.5 w-2.5 rounded-full bg-ink ${bar}`} />
        <span className="flex flex-1 flex-col gap-[2px]">
          <span className={`h-[3px] w-full bg-ink/55 ${bar}`} />
          <span className={`h-[3px] w-2/3 bg-ink/30 ${bar}`} />
        </span>
      </span>
      <span className={`mt-auto h-[3px] w-full bg-ink/35 ${bar}`} />
    </span>
  );
}
