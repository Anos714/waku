import { MapPin } from "@/components/icons/ui-icons";
import { ProfileAvatar } from "./profile-avatar";
import { SocialLinks } from "./social-links";
import {
  AboutSection,
  ContactSection,
  ProjectsSection,
  SkillsSection,
  type SectionAlign,
} from "./profile-sections";
import { clampText } from "@/lib/profile/format";
import type { Profile, ResolvedTheme } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Profile page templates.
 *
 * `profile.profileDesign` selects one of these compositions. Every template
 * renders the same content under the same resolved theme — only the layout of
 * the header and the arrangement of sections change, so switching templates
 * never touches what the user typed.
 */

export interface ProfileDesignProps {
  profile: Profile;
  theme: ResolvedTheme;
  avatarSize: number;
  compact: boolean;
}

function avatarRadius(profile: Profile, avatarSize: number): number {
  return profile.theme.avatarShape === "square"
    ? 6
    : profile.theme.avatarShape === "rounded"
      ? avatarSize * 0.28
      : avatarSize / 2;
}

/** The empty-state shown when every section is toggled off. */
function NoSections({ profile }: { profile: Profile }) {
  if (
    profile.sections.about ||
    profile.sections.skills ||
    profile.sections.projects ||
    profile.sections.contact
  ) {
    return null;
  }
  return (
    <div
      className="mt-8 rounded-lg border border-dashed p-6 text-center text-sm"
      style={{ borderColor: "var(--pt-line)", color: "var(--pt-ink-3)" }}
    >
      All sections are hidden. Enable one in the editor to see it here.
    </div>
  );
}

/* --------------------------------------------------------------- Editorial */

function EditorialDesign({ profile, theme, avatarSize, compact }: ProfileDesignProps) {
  const name = profile.name.trim() || "Unnamed";
  const radius = avatarRadius(profile, avatarSize);
  const pad = compact ? "px-6 py-6" : "px-8 py-10 md:px-10";

  return (
    <div className={pad}>
      <header className="flex flex-col gap-5">
        <div className="flex items-start gap-5">
          <ProfileAvatar
            name={name}
            src={profile.avatarUrl}
            size={avatarSize}
            radius={radius}
            className="shrink-0"
            style={{ boxShadow: "inset 0 0 0 1px var(--pt-line)" }}
          />
          <div className="min-w-0 flex-1">
            {profile.role.trim() && (
              <p
                className="eyebrow mb-1.5"
                style={{
                  color: "var(--pt-accent)",
                  fontFamily: "var(--pt-font-heading)",
                }}
              >
                {clampText(profile.role.trim(), 64)}
              </p>
            )}
            <h1
              className="text-3xl font-semibold leading-[1.1] tracking-tight md:text-4xl"
              style={{ color: "var(--pt-ink)", fontFamily: "var(--pt-font-heading)" }}
            >
              {name}
            </h1>
            {profile.tagline.trim() && (
              <p
                className="mt-2 text-[0.9375rem] leading-relaxed md:text-base"
                style={{ color: "var(--pt-ink-2)" }}
              >
                {clampText(profile.tagline.trim(), 160)}
              </p>
            )}
            {profile.location.trim() && (
              <p
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs"
                style={{ color: "var(--pt-ink-3)" }}
              >
                <MapPin className="h-3.5 w-3.5" />
                {profile.location.trim()}
              </p>
            )}
          </div>
        </div>

        <SocialLinks links={profile.socials} theme={theme} />
      </header>

      <SectionsColumn profile={profile} theme={theme} align="left" />
      <NoSections profile={profile} />
    </div>
  );
}

/* --------------------------------------------------------------- Centered */

function CenteredDesign({ profile, theme, avatarSize, compact }: ProfileDesignProps) {
  const name = profile.name.trim() || "Unnamed";
  const radius = avatarRadius(profile, avatarSize);
  const pad = compact ? "px-6 py-7" : "px-8 py-12 md:px-10";

  return (
    <div className={pad}>
      <header className="flex flex-col items-center gap-4 text-center">
        <ProfileAvatar
          name={name}
          src={profile.avatarUrl}
          size={avatarSize}
          radius={radius}
          style={{ boxShadow: "inset 0 0 0 1px var(--pt-line)" }}
        />
        <div className="flex flex-col items-center gap-2">
          {profile.role.trim() && (
            <p
              className="eyebrow"
              style={{
                color: "var(--pt-accent)",
                fontFamily: "var(--pt-font-heading)",
              }}
            >
              {clampText(profile.role.trim(), 64)}
            </p>
          )}
          <h1
            className="text-3xl font-semibold leading-[1.1] tracking-tight md:text-4xl"
            style={{ color: "var(--pt-ink)", fontFamily: "var(--pt-font-heading)" }}
          >
            {name}
          </h1>
          {profile.tagline.trim() && (
            <p
              className="max-w-prose text-[0.9375rem] leading-relaxed md:text-base"
              style={{ color: "var(--pt-ink-2)" }}
            >
              {clampText(profile.tagline.trim(), 160)}
            </p>
          )}
          {profile.location.trim() && (
            <p
              className="inline-flex items-center gap-1.5 text-xs"
              style={{ color: "var(--pt-ink-3)" }}
            >
              <MapPin className="h-3.5 w-3.5" />
              {profile.location.trim()}
            </p>
          )}
        </div>
        <SocialLinks links={profile.socials} theme={theme} className="justify-center" />
      </header>

      <SectionsColumn profile={profile} theme={theme} align="center" />
      <NoSections profile={profile} />
    </div>
  );
}

/* --------------------------------------------------------------- Sidebar */

function SidebarDesign({ profile, theme, avatarSize, compact }: ProfileDesignProps) {
  const name = profile.name.trim() || "Unnamed";
  const radius = avatarRadius(profile, avatarSize);
  const pad = compact ? "p-6" : "p-8 md:p-10";

  return (
    <div className={pad}>
      <div className="grid gap-8 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <aside className="flex flex-col items-start gap-4 border-b pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-8"
          style={{ borderColor: "var(--pt-line)" }}
        >
          <ProfileAvatar
            name={name}
            src={profile.avatarUrl}
            size={avatarSize}
            radius={radius}
            className="shrink-0"
            style={{ boxShadow: "inset 0 0 0 1px var(--pt-line)" }}
          />
          <div className="min-w-0">
            {profile.role.trim() && (
              <p
                className="eyebrow mb-1.5"
                style={{
                  color: "var(--pt-accent)",
                  fontFamily: "var(--pt-font-heading)",
                }}
              >
                {clampText(profile.role.trim(), 40)}
              </p>
            )}
            <h1
              className="text-2xl font-semibold leading-[1.12] tracking-tight md:text-3xl"
              style={{ color: "var(--pt-ink)", fontFamily: "var(--pt-font-heading)" }}
            >
              {name}
            </h1>
          </div>
          <SocialLinks
            links={profile.socials}
            theme={theme}
            className="flex-col flex-nowrap items-start gap-2.5"
          />
        </aside>

        <div className="min-w-0">
          {profile.tagline.trim() && (
            <p
              className="text-[0.9375rem] leading-relaxed md:text-base"
              style={{ color: "var(--pt-ink-2)" }}
            >
              {clampText(profile.tagline.trim(), 160)}
            </p>
          )}
          <SectionsColumn profile={profile} theme={theme} align="left" />
          <NoSections profile={profile} />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Hero */

function HeroDesign({ profile, theme, avatarSize, compact }: ProfileDesignProps) {
  const name = profile.name.trim() || "Unnamed";
  const radius = avatarRadius(profile, avatarSize * 1.35);
  const pad = compact ? "p-6" : "p-8 md:p-10";

  return (
    <div>
      <div
        className="px-6 py-12 text-center md:px-10"
        style={{
          background: `linear-gradient(155deg, color-mix(in oklab, var(--pt-accent) 34%, var(--pt-bg-2)), var(--pt-bg-2))`,
        }}
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4">
          <ProfileAvatar
            name={name}
            src={profile.avatarUrl}
            size={Math.round(avatarSize * 1.35)}
            radius={radius}
            style={{
              boxShadow: "inset 0 0 0 1px var(--pt-line), 0 18px 40px -20px rgba(0,0,0,.4)",
            }}
          />
          {profile.role.trim() && (
            <p
              className="eyebrow"
              style={{
                color: "var(--pt-accent)",
                fontFamily: "var(--pt-font-heading)",
              }}
            >
              {clampText(profile.role.trim(), 64)}
            </p>
          )}
          <h1
            className="text-4xl font-semibold leading-[1.06] tracking-tight md:text-5xl"
            style={{ color: "var(--pt-ink)", fontFamily: "var(--pt-font-heading)" }}
          >
            {name}
          </h1>
          {profile.tagline.trim() && (
            <p
              className="max-w-prose text-[0.9375rem] leading-relaxed md:text-lg"
              style={{ color: "var(--pt-ink-2)" }}
            >
              {clampText(profile.tagline.trim(), 160)}
            </p>
          )}
          {profile.location.trim() && (
            <p
              className="inline-flex items-center gap-1.5 text-xs"
              style={{ color: "var(--pt-ink-3)" }}
            >
              <MapPin className="h-3.5 w-3.5" />
              {profile.location.trim()}
            </p>
          )}
        </div>
      </div>

      <div className={cn(pad, "pt-7")}>
        <SocialLinks
          links={profile.socials}
          theme={theme}
          className="justify-center"
        />
        <SectionsColumn profile={profile} theme={theme} align="center" />
        <NoSections profile={profile} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Shared */

/**
 * Renders the enabled sections in document order. Each template decides the
 * alignment; hidden sections and empty ones render nothing on their own.
 */
function SectionsColumn({
  profile,
  theme,
  align,
}: {
  profile: Profile;
  theme: ResolvedTheme;
  align: SectionAlign;
}) {
  return (
    <>
      {profile.sections.about && <AboutSection profile={profile} align={align} />}
      {profile.sections.skills && <SkillsSection profile={profile} align={align} />}
      {profile.sections.projects && <ProjectsSection profile={profile} align={align} />}
      {profile.sections.contact && (
        <ContactSection profile={profile} theme={theme} align={align} />
      )}
    </>
  );
}

export const PROFILE_DESIGNS: {
  id: Profile["profileDesign"];
  name: string;
  description: string;
}[] = [
  { id: "editorial", name: "Editorial", description: "Avatar beside a statement name" },
  { id: "centered", name: "Centered", description: "Centered header, centered sections" },
  { id: "sidebar", name: "Sidebar", description: "Identity rail beside the content" },
  { id: "hero", name: "Hero", description: "Accent band with a large headline" },
];

export function renderProfileDesign(props: ProfileDesignProps): React.ReactNode {
  switch (props.profile.profileDesign) {
    case "centered":
      return <CenteredDesign {...props} />;
    case "sidebar":
      return <SidebarDesign {...props} />;
    case "hero":
      return <HeroDesign {...props} />;
    default:
      return <EditorialDesign {...props} />;
  }
}
