import { backgroundClass, resolveTheme } from "@/lib/themes";
import { renderProfileDesign } from "./profile-designs";
import type { Profile } from "@/types";
import { cn } from "@/lib/utils";

/**
 * The themed profile renderer. Used by the live editor preview and the public
 * profile page so both always look identical for the same data.
 *
 * This shell owns the runtime theme tokens and decorative background; the
 * inner composition comes from the selected profile design template
 * (`profile.profileDesign`) so content and layout stay independent.
 */
export function ProfileView({
  profile,
  className,
  avatarSize = 84,
  compact = false,
}: {
  profile: Profile;
  className?: string;
  avatarSize?: number;
  compact?: boolean;
}) {
  const resolved = resolveTheme(profile.theme);

  return (
    <div
      className={cn("pt-vars", backgroundClass(resolved.background, resolved.isDark), className)}
      style={{
        ...resolved.tokens,
        // Long-hand on purpose: the `background` shorthand would reset
        // background-image and silently delete the .pt-grid/.pt-glow wash
        // applied via backgroundClass above.
        backgroundColor: "var(--pt-bg)",
        color: "var(--pt-ink)",
        fontFamily: "var(--pt-font-body)",
      }}
    >
      {renderProfileDesign({ profile, theme: resolved, avatarSize, compact })}
    </div>
  );
}
