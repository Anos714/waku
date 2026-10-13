import { afterEach, describe, expect, it } from "vitest";
import {
  ACCENT_PRESETS,
  DEFAULT_THEME_SETTINGS,
  THEME_PRESETS,
  avatarShapeClass,
  backgroundClass,
  resolveTheme,
  socialButtonClasses,
  themeStyle,
} from "@/lib/themes";
import type { ThemeSettings } from "@/types";

const base: ThemeSettings = { ...DEFAULT_THEME_SETTINGS };

describe("resolveTheme", () => {
  afterEach(() => {
    // resolveTheme memoises by settings; each test that wants a pristine
    // result should vary its inputs.
  });

  it("emits the preset tokens plus the accent and font tokens", () => {
    const resolved = resolveTheme(base);
    expect(resolved.tokens["--pt-bg"]).toBe(
      THEME_PRESETS.editorial.tokens["--pt-bg"],
    );
    // The user accent overrides the preset accent.
    expect(resolved.tokens["--pt-accent"]).toBe(base.accent);
    expect(resolved.tokens["--pt-font-heading"]).toBeDefined();
    expect(resolved.tokens["--pt-font-body"]).toBeDefined();
    expect(resolved.tokens["--pt-font-mono"]).toBeDefined();
  });

  it("applies a custom accent over the preset's accent", () => {
    const resolved = resolveTheme({ ...base, accent: "#ff0000" });
    expect(resolved.accent).toBe("#ff0000");
    expect(resolved.tokens["--pt-accent"]).toBe("#ff0000");
  });

  it("reports the preset's darkness", () => {
    expect(resolveTheme({ ...base, theme: "noir" }).isDark).toBe(true);
    expect(resolveTheme({ ...base, theme: "paper" }).isDark).toBe(false);
  });

  it("swaps the font stack with the pairing", () => {
    const terminal = resolveTheme({ ...base, fontPairing: "terminal" });
    expect(terminal.fonts.heading).toContain("--font-geist-mono");
    expect(terminal.tokens["--pt-font-heading"]).toBe(terminal.fonts.heading);
  });

  it("falls back to the editorial preset for an unknown theme", () => {
    const resolved = resolveTheme({
      ...base,
      theme: "does-not-exist" as ThemeSettings["theme"],
    });
    expect(resolved.theme).toBe("editorial");
  });

  it("returns a cached object for identical settings", () => {
    const a = resolveTheme({ ...base, accent: "#123456" });
    const b = resolveTheme({ ...base, accent: "#123456" });
    expect(a).toBe(b);
  });

  it("resolves independently for different accents", () => {
    const a = resolveTheme({ ...base, accent: "#111111" });
    const b = resolveTheme({ ...base, accent: "#222222" });
    expect(a).not.toBe(b);
    expect(a.accent).toBe("#111111");
    expect(b.accent).toBe("#222222");
  });
});

describe("themeStyle", () => {
  it("spreads the token map as CSS custom properties", () => {
    const style = themeStyle(resolveTheme(base)) as Record<string, string>;
    expect(style["--pt-accent"]).toBe(base.accent);
  });
});

describe("avatarShapeClass", () => {
  it("maps each shape to a radius class", () => {
    expect(avatarShapeClass("circle")).toBe("rounded-full");
    expect(avatarShapeClass("rounded")).toBe("rounded-xl");
    expect(avatarShapeClass("square")).toBe("rounded-none");
  });
});

describe("backgroundClass", () => {
  it("resolves `subtle` per lightness", () => {
    expect(backgroundClass("subtle", false)).toBe("pt-subtle-light");
    expect(backgroundClass("subtle", true)).toBe("pt-subtle-dark");
  });

  it("maps decorative backgrounds to their class", () => {
    expect(backgroundClass("grid", true)).toBe("pt-grid");
    expect(backgroundClass("dots", false)).toBe("pt-dots");
  });

  it("renders nothing for plain", () => {
    expect(backgroundClass("plain", false)).toBe("");
  });
});

describe("socialButtonClasses", () => {
  it("maps each social style", () => {
    expect(socialButtonClasses("outline")).toBe("pt-social-outline");
    expect(socialButtonClasses("solid")).toBe("pt-social-solid");
  });
});

describe("presets", () => {
  it("every accent preset is a 6-digit hex", () => {
    for (const preset of ACCENT_PRESETS) {
      expect(preset.value).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("the default accent is one of the presets", () => {
    expect(ACCENT_PRESETS.some((p) => p.value === DEFAULT_THEME_SETTINGS.accent))
      .toBe(true);
  });
});
