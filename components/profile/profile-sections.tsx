import { ArrowUpRight } from "@/components/icons/ui-icons";
import { SocialLinks } from "./social-links";
import { ProjectScreenshot } from "./project-screenshot";
import { clampText, displayHandle, prettyUrl } from "@/lib/profile/format";
import { resolveProjectImageUrl } from "@/lib/profile/project-image";
import { safeExternalUrl } from "@/lib/validation/profile";
import type { Profile, ResolvedTheme } from "@/types";

export type SectionAlign = "left" | "center";

function SectionShell({
  title,
  align = "left",
  children,
}: {
  title: string;
  align?: SectionAlign;
  children: React.ReactNode;
}) {
  if (align === "center") {
    return (
      <section className="pt-8">
        <div className="flex items-center justify-center gap-3">
          <div
            className="h-px w-10"
            style={{ background: "var(--pt-line)" }}
            aria-hidden="true"
          />
          <h2
            className="eyebrow"
            style={{
              color: "var(--pt-ink-3)",
              letterSpacing: "0.18em",
              fontFamily: "var(--pt-font-heading)",
            }}
          >
            {title}
          </h2>
          <div
            className="h-px w-10"
            style={{ background: "var(--pt-line)" }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-4">{children}</div>
      </section>
    );
  }

  return (
    <section className="pt-8">
      <div className="flex items-center gap-3">
        <h2
          className="eyebrow"
          style={{
            color: "var(--pt-ink-3)",
            letterSpacing: "0.18em",
            // Section titles are headings — they follow the pairing's heading
            // stack so the Editorial serif (or Terminal mono) reaches them too,
            // not just the name.
            fontFamily: "var(--pt-font-heading)",
          }}
        >
          {title}
        </h2>
        <div
          className="h-px flex-1"
          style={{ background: "var(--pt-line)" }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AboutSection({
  profile,
  align,
}: {
  profile: Profile;
  align?: SectionAlign;
}) {
  if (!profile.bio.trim() && profile.interests.length === 0) return null;

  return (
    <SectionShell title="About" align={align}>
      {profile.bio.trim() && (
        <p
          className="text-[1.0625rem] leading-relaxed"
          style={{ color: "var(--pt-ink)", fontFamily: "var(--pt-font-body)" }}
        >
          {profile.bio}
        </p>
      )}
      {profile.interests.length > 0 && (
        <p
          className="mt-4 text-sm leading-relaxed"
          style={{ color: "var(--pt-ink-2)" }}
        >
          <span style={{ color: "var(--pt-ink-3)" }}>Interested in </span>
          {profile.interests.join(" · ")}
        </p>
      )}
    </SectionShell>
  );
}

export function SkillsSection({
  profile,
  align,
}: {
  profile: Profile;
  align?: SectionAlign;
}) {
  const skills = profile.skills.filter((skill) => skill.trim());
  if (skills.length === 0) return null;

  return (
    <SectionShell title="Skills" align={align}>
      <ul className="flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <li
            key={skill}
            className="inline-flex items-center px-2.5 py-1 text-[0.8125rem] font-medium"
            style={{
              borderRadius: "calc(var(--pt-radius) * 0.5)",
              background: "var(--pt-bg-2)",
              color: "var(--pt-ink)",
              border: "1px solid var(--pt-line)",
            }}
          >
            {skill.trim()}
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

export function ProjectsSection({
  profile,
  align,
}: {
  profile: Profile;
  align?: SectionAlign;
}) {
  const projects = profile.projects.filter((project) => project.title.trim());
  if (projects.length === 0) return null;

  return (
    <SectionShell title="Featured work" align={align}>
      <ul className="flex flex-col gap-2.5">
        {projects.map((project) => {
          const url = safeExternalUrl(project.url);
          const title = clampText(project.title.trim(), 80);
          // Accepts a pasted https URL or a Cloudinary public ID from the
          // editor's uploader. Old profiles (and empty inputs) carry no image
          // — they render the original text-only card below, pixel-identical
          // to before.
          const screenshot = resolveProjectImageUrl(project.imageUrl);
          const shellStyle: React.CSSProperties = {
            borderRadius: "var(--pt-radius)",
            background: "var(--pt-surface)",
            border: "1px solid var(--pt-line)",
          };
          if (screenshot) {
            return (
              <li key={project.id}>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-4 p-4 transition-colors hover:border-[var(--pt-accent)]"
                    style={shellStyle}
                  >
                    <ProjectScreenshot src={screenshot} title={title} />
                    <ProjectBody project={{ ...project, title }} />
                    <ArrowUpRight
                      className="mt-0.5 h-4 w-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-100"
                      style={{ color: "var(--pt-accent)" }}
                    />
                  </a>
                ) : (
                  <div className="flex items-start gap-4 p-4" style={shellStyle}>
                    <ProjectScreenshot src={screenshot} title={title} />
                    <ProjectBody project={{ ...project, title }} />
                  </div>
                )}
              </li>
            );
          }
          return (
            <li key={project.id}>
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-3.5 transition-colors hover:border-[var(--pt-accent)]"
                  style={shellStyle}
                >
                  <ProjectBody project={{ ...project, title }} />
                  <ArrowUpRight
                    className="mt-0.5 h-4 w-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-100"
                    style={{ color: "var(--pt-accent)" }}
                  />
                </a>
              ) : (
                <div className="flex items-start gap-3 p-3.5" style={shellStyle}>
                  <ProjectBody project={{ ...project, title }} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </SectionShell>
  );
}

function ProjectBody({
  project,
}: {
  project: { title: string; description: string; tag: string };
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-baseline gap-2">
        <h3
          className="font-semibold tracking-tight"
          style={{ color: "var(--pt-ink)", fontFamily: "var(--pt-font-heading)" }}
        >
          {project.title}
        </h3>
        {project.tag.trim() && (
          <span
            className="text-[0.6875rem] font-semibold uppercase tracking-wider"
            style={{ color: "var(--pt-accent)" }}
          >
            {project.tag.trim()}
          </span>
        )}
      </div>
      {project.description.trim() && (
        <p
          className="mt-1 text-sm leading-relaxed"
          style={{ color: "var(--pt-ink-2)" }}
        >
          {project.description}
        </p>
      )}
    </div>
  );
}

export function ContactSection({
  profile,
  theme,
  align,
}: {
  profile: Profile;
  theme: ResolvedTheme;
  align?: SectionAlign;
}) {
  const website = safeExternalUrl(profile.websiteUrl);
  const emailSocial = profile.socials.find(
    (link) => link.visible && link.platform === "email" && safeExternalUrl(link.url),
  );

  const rows: { label: string; value: string; href?: string }[] = [];
  if (website) {
    rows.push({ label: "Website", value: prettyUrl(website), href: website });
  }
  if (emailSocial) {
    const mail = safeExternalUrl(emailSocial.url);
    if (mail) {
      rows.push({ label: "Email", value: displayHandle(emailSocial), href: mail });
    }
  }
  if (profile.location.trim()) {
    rows.push({ label: "Based in", value: profile.location.trim() });
  }

  if (rows.length === 0) return null;

  return (
    <SectionShell title="Contact" align={align}>
      <ul className="flex flex-col">
        {rows.map((row, index) => (
          <li
            key={row.label}
            className="flex items-baseline justify-between gap-4 py-2.5"
            style={{
              borderTop: index === 0 ? "none" : "1px solid var(--pt-line)",
            }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--pt-ink-3)" }}
            >
              {row.label}
            </span>
            {row.href ? (
              <a
                href={row.href}
                target={row.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={row.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                className="block max-w-full truncate text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--pt-ink)" }}
              >
                {row.value}
              </a>
            ) : (
              <span
                className="block max-w-full truncate text-sm font-medium"
                style={{ color: "var(--pt-ink)" }}
              >
                {row.value}
              </span>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-5">
        <SocialLinks
          links={profile.socials}
          theme={theme}
          showLabels={false}
          size="sm"
        />
      </div>
    </SectionShell>
  );
}
