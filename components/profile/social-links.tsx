import { PlatformIcon, PLATFORM_META } from "@/components/icons/platform-icons";
import { displayHandle } from "@/lib/profile/format";
import { safeExternalUrl } from "@/lib/validation/profile";
import { socialButtonClasses } from "@/lib/themes";
import type { ResolvedTheme, SocialLink } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Renders themed social links. Unsafe URL schemes are rejected upstream so
 * nothing here can ever point at javascript: or data: targets.
 */
export function SocialLinks({
  links,
  theme,
  size = "md",
  showLabels = true,
  className,
}: {
  links: SocialLink[];
  theme: ResolvedTheme;
  size?: "sm" | "md";
  showLabels?: boolean;
  className?: string;
}) {
  const safe = links
    .filter((link) => link.visible)
    .map((link) => ({ link, url: safeExternalUrl(link.url) }))
    .filter((entry): entry is { link: SocialLink; url: string } => entry.url !== null);

  if (safe.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {safe.map(({ link, url }) => {
        const platformLabel = PLATFORM_META[link.platform]?.label ?? "Website";
        return (
          <li key={link.id}>
            <a
              href={url}
              target={link.platform === "email" ? undefined : "_blank"}
              rel={link.platform === "email" ? undefined : "noopener noreferrer"}
              aria-label={`${platformLabel}: ${displayHandle(link)}`}
              className={cn(
                "group inline-flex items-center gap-2 font-medium transition-[colors,transform] duration-150 active:scale-[0.96] motion-reduce:active:scale-100",
                socialButtonClasses(theme.socialStyle),
                size === "sm" ? "h-8 px-2.5 text-xs" : "h-10 px-3 text-sm",
              )}
              style={{ borderRadius: "calc(var(--pt-radius) * 0.6)" }}
            >
              <PlatformIcon
                platform={link.platform}
                className="h-4 w-4 shrink-0"
              />
              {showLabels && (
                <span className="max-w-40 truncate">{displayHandle(link)}</span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
