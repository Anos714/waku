import { PlatformIcon, PLATFORM_META } from "@/components/icons/platform-icons";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { clampText, displayHandle } from "@/lib/profile/format";
import { safeExternalUrl } from "@/lib/validation/profile";
import type { Profile, ResolvedTheme, SocialLink } from "@/types";

/** Social handles rendered as flat text + glyph — this is an image, not a link. */
function CardSocials({
  links,
  limit = 5,
  align = "left",
}: {
  links: SocialLink[];
  limit?: number;
  align?: "left" | "center";
}) {
  const safe = links
    .filter((link) => link.visible && safeExternalUrl(link.url))
    .slice(0, limit);

  if (safe.length === 0) return null;

  return (
    <ul
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px 18px",
        justifyContent: align === "center" ? "center" : "flex-start",
        listStyle: "none",
        padding: 0,
        margin: 0,
      }}
    >
      {safe.map((link) => (
        <li
          key={link.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            color: "var(--pt-ink-2)",
            fontSize: "16px",
            fontWeight: 500,
          }}
        >
          <PlatformIcon
            platform={link.platform}
            style={{ width: "16px", height: "16px", color: "var(--pt-accent)" }}
          />
          <span style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayHandle(link)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function QrTile({
  dataUrl,
  size,
  label,
}: {
  dataUrl: string | null;
  size: number;
  label: string;
}) {
  if (!dataUrl) return null;
  return (
    <div
      style={{
        width: size,
        height: size,
        padding: 8,
        background: "#ffffff",
        border: "1px solid var(--pt-line)",
        borderRadius: "calc(var(--pt-radius) * 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt={label}
        width={size - 16}
        height={size - 16}
        style={{ width: size - 16, height: size - 16, display: "block", imageRendering: "pixelated" }}
      />
    </div>
  );
}

function BrandMark({ url }: { url?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: "var(--pt-ink-3)",
        fontSize: "15px",
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          background: "var(--pt-accent)",
          display: "inline-block",
        }}
      />
      Waku
      {url ? <span style={{ fontWeight: 400, opacity: 0.8 }}>· {url.replace(/^https?:\/\//, "")}</span> : null}
    </div>
  );
}

export interface CardLayoutProps {
  profile: Profile;
  theme: ResolvedTheme;
  qrDataUrl: string | null;
  profileUrl: string;
}

/* ------------------------------------------------------------------ Classic */

function ClassicLayout({ profile, theme, qrDataUrl, profileUrl }: CardLayoutProps) {
  const name = clampText(profile.name.trim() || "Unnamed", 34);
  const radius =
    theme.avatarShape === "square" ? 10 : theme.avatarShape === "rounded" ? 34 : 112;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "52px 56px",
        gap: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "32px", flex: 1 }}>
        <ProfileAvatar
          name={name}
          src={profile.avatarUrl}
          size={112}
          radius={radius}
          plain
          style={{ boxShadow: "inset 0 0 0 1px var(--pt-line)" }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          {profile.role.trim() && (
            <div
              style={{
                color: "var(--pt-accent)",
                fontFamily: "var(--pt-font-heading)",
                fontSize: "15px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              {clampText(profile.role.trim(), 52)}
            </div>
          )}
          <h1
            style={{
              color: "var(--pt-ink)",
              fontFamily: "var(--pt-font-heading)",
              fontSize: "52px",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              fontWeight: 600,
              margin: 0,
            }}
          >
            {name}
          </h1>
          {profile.tagline.trim() && (
            <p
              style={{
                color: "var(--pt-ink-2)",
                fontSize: "21px",
                lineHeight: 1.45,
                margin: "14px 0 0",
                maxWidth: qrDataUrl ? "640px" : "900px",
              }}
            >
              {clampText(profile.tagline.trim(), 130)}
            </p>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "32px",
          marginTop: "auto",
          paddingTop: "34px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}>
          <CardSocials links={profile.socials} />
          <BrandMark url={profileUrl} />
        </div>
        {qrDataUrl && <QrTile dataUrl={qrDataUrl} size={132} label="Scan to view profile" />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- Banner */

function BannerLayout({ profile, theme, qrDataUrl, profileUrl }: CardLayoutProps) {
  const name = clampText(profile.name.trim() || "Unnamed", 32);
  const radius =
    theme.avatarShape === "square" ? 12 : theme.avatarShape === "rounded" ? 42 : 140;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          height: 196,
          background: `linear-gradient(150deg, color-mix(in oklab, var(--pt-accent) 34%, var(--pt-bg-2)), var(--pt-bg-2))`,
          borderBottom: "1px solid var(--pt-line)",
        }}
      />
      <div style={{ padding: "0 56px 48px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "28px", marginTop: "-70px" }}>
          <ProfileAvatar
            name={name}
            src={profile.avatarUrl}
            size={140}
            radius={radius}
            plain
            style={{
              boxShadow: "inset 0 0 0 1px var(--pt-line), 0 12px 30px -14px rgba(0,0,0,.35)",
              background: "var(--pt-surface)",
            }}
          />
          <div style={{ minWidth: 0, flex: 1, paddingBottom: 6 }}>
            {profile.role.trim() && (
              <div
                style={{
                  color: "var(--pt-accent)",
                  fontSize: "15px",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {clampText(profile.role.trim(), 52)}
              </div>
            )}
            <h1
              style={{
                color: "var(--pt-ink)",
                fontFamily: "var(--pt-font-heading)",
                fontSize: "48px",
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                fontWeight: 600,
                margin: 0,
              }}
            >
              {name}
            </h1>
          </div>
        </div>

        {profile.tagline.trim() && (
          <p
            style={{
              color: "var(--pt-ink-2)",
              fontSize: "21px",
              lineHeight: 1.45,
              margin: "22px 0 0",
              maxWidth: qrDataUrl ? "720px" : "1000px",
            }}
          >
            {clampText(profile.tagline.trim(), 130)}
          </p>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "32px",
            marginTop: "auto",
            paddingTop: "30px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", minWidth: 0 }}>
            <CardSocials links={profile.socials} />
            <BrandMark url={profileUrl} />
          </div>
          {qrDataUrl && <QrTile dataUrl={qrDataUrl} size={128} label="Scan to view profile" />}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Minimal */

function MinimalLayout({ profile, theme, qrDataUrl, profileUrl }: CardLayoutProps) {
  const name = clampText(profile.name.trim() || "Unnamed", 30);
  const radius =
    theme.avatarShape === "square" ? 8 : theme.avatarShape === "rounded" ? 22 : 60;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 56px",
        gap: 0,
      }}
    >
      <ProfileAvatar
        name={name}
        src={profile.avatarUrl}
        size={88}
        radius={radius}
        plain
        style={{ boxShadow: "inset 0 0 0 1px var(--pt-line)" }}
      />
      <h1
        style={{
          color: "var(--pt-ink)",
          fontFamily: "var(--pt-font-heading)",
          fontSize: "56px",
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          fontWeight: 600,
          margin: "26px 0 0",
        }}
      >
        {name}
      </h1>
      {profile.role.trim() && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginTop: "12px",
            color: "var(--pt-accent)",
            fontFamily: "var(--pt-font-heading)",
            fontSize: "15px",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          <span style={{ height: 1, width: 34, background: "var(--pt-line)" }} />
          {clampText(profile.role.trim(), 48)}
          <span style={{ height: 1, width: 34, background: "var(--pt-line)" }} />
        </div>
      )}
      {profile.tagline.trim() && (
        <p
          style={{
            color: "var(--pt-ink-2)",
            fontSize: "21px",
            lineHeight: 1.5,
            margin: "18px auto 0",
            maxWidth: "820px",
          }}
        >
          {clampText(profile.tagline.trim(), 130)}
        </p>
      )}
      <div style={{ marginTop: "26px" }}>
        <CardSocials links={profile.socials} align="center" limit={4} />
      </div>
      <div
        style={{
          marginTop: "auto",
          paddingTop: "30px",
          display: "flex",
          alignItems: "center",
          gap: "26px",
        }}
      >
        <BrandMark url={profileUrl} />
        {qrDataUrl && <QrTile dataUrl={qrDataUrl} size={96} label="Scan to view profile" />}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Split */

function SplitLayout({ profile, theme, qrDataUrl, profileUrl }: CardLayoutProps) {
  const name = clampText(profile.name.trim() || "Unnamed", 30);
  const radius =
    theme.avatarShape === "square" ? 10 : theme.avatarShape === "rounded" ? 32 : 104;

  return (
    <div style={{ height: "100%", display: "flex" }}>
      <div
        style={{
          width: "42%",
          background: `linear-gradient(160deg, color-mix(in oklab, var(--pt-accent) 20%, var(--pt-bg-2)), var(--pt-bg-2))`,
          borderRight: "1px solid var(--pt-line)",
          padding: "52px 44px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "26px",
        }}
      >
        <ProfileAvatar
          name={name}
          src={profile.avatarUrl}
          size={104}
          radius={radius}
          plain
          style={{ boxShadow: "inset 0 0 0 1px var(--pt-line)" }}
        />
        {qrDataUrl && <QrTile dataUrl={qrDataUrl} size={150} label="Scan to view profile" />}
        {!qrDataUrl && (
          <p
            style={{
              color: "var(--pt-ink-3)",
              fontSize: "16px",
              textAlign: "center",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {profile.location.trim() ? `Based in ${profile.location.trim()}` : profileUrl.replace(/^https?:\/\//, "")}
          </p>
        )}
      </div>
      <div
        style={{
          flex: 1,
          padding: "52px 52px 44px",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {profile.role.trim() && (
          <div
            style={{
              color: "var(--pt-accent)",
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {clampText(profile.role.trim(), 46)}
          </div>
        )}
        <h1
          style={{
            color: "var(--pt-ink)",
            fontFamily: "var(--pt-font-heading)",
            fontSize: "50px",
            lineHeight: 1.06,
            letterSpacing: "-0.025em",
            fontWeight: 600,
            margin: 0,
          }}
        >
          {name}
        </h1>
        {profile.tagline.trim() && (
          <p
            style={{
              color: "var(--pt-ink-2)",
              fontSize: "20px",
              lineHeight: 1.45,
              margin: "16px 0 0",
            }}
          >
            {clampText(profile.tagline.trim(), 120)}
          </p>
        )}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "22px" }}>
          <CardSocials links={profile.socials} limit={4} />
          <BrandMark url={profileUrl} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- Poster */

function PosterLayout({ profile, theme, qrDataUrl, profileUrl }: CardLayoutProps) {
  const name = clampText(profile.name.trim() || "Unnamed", 22);
  const radius =
    theme.avatarShape === "square" ? 8 : theme.avatarShape === "rounded" ? 20 : 56;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "44px 56px 40px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <ProfileAvatar
          name={name}
          src={profile.avatarUrl}
          size={64}
          radius={radius}
          plain
          style={{ boxShadow: "inset 0 0 0 1px var(--pt-line)" }}
        />
        {profile.role.trim() && (
          <div
            style={{
              marginLeft: "auto",
              color: "var(--pt-ink-3)",
              fontFamily: "var(--pt-font-mono)",
              fontSize: "15px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textAlign: "right",
              maxWidth: "640px",
            }}
          >
            {clampText(profile.role.trim(), 58)}
          </div>
        )}
      </div>

      <h1
        style={{
          color: "var(--pt-ink)",
          fontFamily: "var(--pt-font-heading)",
          fontSize: "96px",
          lineHeight: 1.0,
          letterSpacing: "-0.04em",
          fontWeight: 600,
          margin: "40px 0 0",
        }}
      >
        {name}
      </h1>

      {profile.tagline.trim() && (
        <p
          style={{
            color: "var(--pt-ink-2)",
            fontSize: "20px",
            lineHeight: 1.4,
            margin: "20px 0 0",
            maxWidth: qrDataUrl ? "760px" : "1000px",
          }}
        >
          {clampText(profile.tagline.trim(), 110)}
        </p>
      )}

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "22px",
        }}
      >
        <div
          style={{
            height: 6,
            width: "100%",
            background: "var(--pt-accent)",
            borderRadius: 3,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "32px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", minWidth: 0 }}>
            <CardSocials links={profile.socials} />
            <BrandMark url={profileUrl} />
          </div>
          {qrDataUrl && <QrTile dataUrl={qrDataUrl} size={118} label="Scan to view profile" />}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Spotlight */

function SpotlightLayout({ profile, theme, qrDataUrl, profileUrl }: CardLayoutProps) {
  const name = clampText(profile.name.trim() || "Unnamed", 26);
  const radius =
    theme.avatarShape === "square" ? 10 : theme.avatarShape === "rounded" ? 28 : 116;

  return (
    <div style={{ height: "100%", position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(560px 420px at 50% 6%, color-mix(in oklab, var(--pt-accent) 30%, transparent), transparent 68%)",
        }}
        aria-hidden="true"
      />
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "44px 56px",
        }}
      >
        <ProfileAvatar
          name={name}
          src={profile.avatarUrl}
          size={116}
          radius={radius}
          plain
          style={{
            boxShadow: "inset 0 0 0 1px var(--pt-line), 0 18px 40px -18px rgba(0,0,0,.4)",
          }}
        />
        <h1
          style={{
            color: "var(--pt-ink)",
            fontFamily: "var(--pt-font-heading)",
            fontSize: "58px",
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            fontWeight: 600,
            margin: "26px 0 0",
          }}
        >
          {name}
        </h1>
        {profile.role.trim() && (
          <div
            style={{
              marginTop: "14px",
              color: "var(--pt-accent)",
              fontFamily: "var(--pt-font-heading)",
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {clampText(profile.role.trim(), 48)}
          </div>
        )}
        {profile.tagline.trim() && (
          <p
            style={{
              color: "var(--pt-ink-2)",
              fontSize: "20px",
              lineHeight: 1.5,
              margin: "16px auto 0",
              maxWidth: "860px",
            }}
          >
            {clampText(profile.tagline.trim(), 120)}
          </p>
        )}
        <div style={{ marginTop: "24px" }}>
          <CardSocials links={profile.socials} align="center" limit={4} />
        </div>
        <div
          style={{
            marginTop: "auto",
            paddingTop: "26px",
            display: "flex",
            alignItems: "center",
            gap: "26px",
          }}
        >
          <BrandMark url={profileUrl} />
          {qrDataUrl && <QrTile dataUrl={qrDataUrl} size={96} label="Scan to view profile" />}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Frame */

function FrameLayout({ profile, theme, qrDataUrl, profileUrl }: CardLayoutProps) {
  const name = clampText(profile.name.trim() || "Unnamed", 30);
  const radius =
    theme.avatarShape === "square" ? 8 : theme.avatarShape === "rounded" ? 22 : 84;

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          inset: 24,
          border: "1.5px solid color-mix(in oklab, var(--pt-ink) 22%, transparent)",
          borderRadius: "calc(var(--pt-radius) * 0.8)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
      {/* Corner accents — small L-marks that give the frame an editorial feel */}
      {[
        { top: 24, left: 24, borderTop: "3px solid var(--pt-accent)", borderLeft: "3px solid var(--pt-accent)" },
        { bottom: 24, right: 24, borderBottom: "3px solid var(--pt-accent)", borderRight: "3px solid var(--pt-accent)" },
      ].map((corner, index) => (
        <span
          key={index}
          style={{
            position: "absolute",
            width: 22,
            height: 22,
            ...corner,
          }}
          aria-hidden="true"
        />
      ))}
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "52px 84px",
        }}
      >
        <ProfileAvatar
          name={name}
          src={profile.avatarUrl}
          size={84}
          radius={radius}
          plain
          style={{ boxShadow: "inset 0 0 0 1px var(--pt-line)" }}
        />
        <h1
          style={{
            color: "var(--pt-ink)",
            fontFamily: "var(--pt-font-heading)",
            fontSize: "54px",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            fontWeight: 600,
            margin: "24px 0 0",
          }}
        >
          {name}
        </h1>
        {profile.role.trim() && (
          <div
            style={{
              marginTop: "12px",
              color: "var(--pt-ink-3)",
              fontFamily: "var(--pt-font-mono)",
              fontSize: "14px",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {clampText(profile.role.trim(), 52)}
          </div>
        )}
        {profile.tagline.trim() && (
          <p
            style={{
              color: "var(--pt-ink-2)",
              fontSize: "20px",
              lineHeight: 1.5,
              margin: "18px auto 0",
              maxWidth: "760px",
            }}
          >
            {clampText(profile.tagline.trim(), 120)}
          </p>
        )}
        <div style={{ marginTop: "22px" }}>
          <CardSocials links={profile.socials} align="center" limit={4} />
        </div>
        <div
          style={{
            marginTop: "auto",
            paddingTop: "26px",
            display: "flex",
            alignItems: "center",
            gap: "26px",
          }}
        >
          <BrandMark url={profileUrl} />
          {qrDataUrl && <QrTile dataUrl={qrDataUrl} size={92} label="Scan to view profile" />}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- Duo */

function DuoLayout({ profile, theme, qrDataUrl, profileUrl }: CardLayoutProps) {
  const name = clampText(profile.name.trim() || "Unnamed", 18);
  const radius =
    theme.avatarShape === "square" ? 12 : theme.avatarShape === "rounded" ? 34 : 120;

  return (
    <div style={{ height: "100%", display: "flex" }}>
      <div
        style={{
          width: "40%",
          padding: "56px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          background: `linear-gradient(160deg, color-mix(in oklab, var(--pt-accent) 46%, var(--pt-bg-2)), color-mix(in oklab, var(--pt-accent) 20%, var(--pt-bg-2)))`,
          color: "var(--pt-accent-ink)",
        }}
      >
        <ProfileAvatar
          name={name}
          src={profile.avatarUrl}
          size={120}
          radius={radius}
          plain
          style={{ boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--pt-ink) 14%, transparent)" }}
        />
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              color: "var(--pt-accent-ink)",
              fontFamily: "var(--pt-font-heading)",
              fontSize: "40px",
              lineHeight: 1.06,
              letterSpacing: "-0.025em",
              fontWeight: 600,
              margin: 0,
            }}
          >
            {name}
          </h1>
          {profile.location.trim() && (
            <p
              style={{
                color: "color-mix(in oklab, var(--pt-accent-ink) 76%, var(--pt-ink))",
                fontSize: "16px",
                margin: "12px 0 0",
              }}
            >
              {clampText(profile.location.trim(), 34)}
            </p>
          )}
        </div>
        {qrDataUrl && <QrTile dataUrl={qrDataUrl} size={104} label="Scan to view profile" />}
      </div>
      <div
        style={{
          flex: 1,
          padding: "56px 52px 44px",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {profile.role.trim() && (
          <div
            style={{
              color: "var(--pt-accent)",
              fontFamily: "var(--pt-font-heading)",
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {clampText(profile.role.trim(), 44)}
          </div>
        )}
        {profile.tagline.trim() && (
          <p
            style={{
              color: "var(--pt-ink-2)",
              fontSize: "21px",
              lineHeight: 1.45,
              margin: "0 0 22px",
            }}
          >
            {clampText(profile.tagline.trim(), 130)}
          </p>
        )}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "22px" }}>
          <CardSocials links={profile.socials} limit={4} />
          <BrandMark url={profileUrl} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Signal */

function SignalLayout({ profile, theme, qrDataUrl, profileUrl }: CardLayoutProps) {
  const name = clampText(profile.name.trim() || "Unnamed", 40);
  const radius =
    theme.avatarShape === "square" ? 10 : theme.avatarShape === "rounded" ? 34 : 112;

  return (
    <div style={{ height: "100%", display: "flex" }}>
      <div style={{ width: 18, flexShrink: 0, background: "var(--pt-accent)" }} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          padding: "54px 62px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "32px",
          }}
        >
          <div style={{ minWidth: 0 }}>
            {profile.role.trim() && (
              <div
                style={{
                  color: "var(--pt-accent)",
                  fontFamily: "var(--pt-font-heading)",
                  fontSize: "15px",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                {clampText(profile.role.trim(), 52)}
              </div>
            )}
            <h1
              style={{
                color: "var(--pt-ink)",
                fontFamily: "var(--pt-font-heading)",
                fontSize: "60px",
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                fontWeight: 600,
                margin: 0,
                maxWidth: "720px",
              }}
            >
              {name}
            </h1>
          </div>
          <ProfileAvatar
            name={name}
            src={profile.avatarUrl}
            size={116}
            radius={radius}
            plain
            style={{ boxShadow: "inset 0 0 0 1px var(--pt-line)" }}
          />
        </div>

        {profile.tagline.trim() && (
          <p
            style={{
              color: "var(--pt-ink-2)",
              fontSize: "21px",
              lineHeight: 1.45,
              margin: "20px 0 0",
              maxWidth: qrDataUrl ? "620px" : "860px",
            }}
          >
            {clampText(profile.tagline.trim(), 130)}
          </p>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "32px",
            marginTop: "auto",
            paddingTop: "30px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", minWidth: 0 }}>
            <CardSocials links={profile.socials} />
            <BrandMark url={profileUrl} />
          </div>
          {qrDataUrl && <QrTile dataUrl={qrDataUrl} size={128} label="Scan to view profile" />}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Capsule */

function CapsuleLayout({ profile, theme, qrDataUrl, profileUrl }: CardLayoutProps) {
  const name = clampText(profile.name.trim() || "Unnamed", 30);
  const radius =
    theme.avatarShape === "square" ? 8 : theme.avatarShape === "rounded" ? 22 : 60;

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "56px 64px",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "18px",
          padding: "14px 28px 14px 14px",
          borderRadius: 999,
          border: "1px solid var(--pt-line)",
          background: "var(--pt-surface)",
        }}
      >
        <ProfileAvatar name={name} src={profile.avatarUrl} size={68} radius={radius} plain />
        <div style={{ textAlign: "left", minWidth: 0 }}>
          <h1
            style={{
              color: "var(--pt-ink)",
              fontFamily: "var(--pt-font-heading)",
              fontSize: "34px",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              fontWeight: 600,
              margin: 0,
            }}
          >
            {name}
          </h1>
          {profile.role.trim() && (
            <div
              style={{
                color: "var(--pt-accent)",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              {clampText(profile.role.trim(), 44)}
            </div>
          )}
        </div>
      </div>

      {profile.tagline.trim() && (
        <p
          style={{
            color: "var(--pt-ink-2)",
            fontSize: "21px",
            lineHeight: 1.45,
            margin: "28px 0 0",
            maxWidth: "720px",
          }}
        >
          {clampText(profile.tagline.trim(), 120)}
        </p>
      )}

      <div style={{ marginTop: 30 }}>
        <CardSocials links={profile.socials} align="center" />
      </div>

      <div style={{ position: "absolute", left: 62, bottom: 48 }}>
        <BrandMark url={profileUrl} />
      </div>
      {qrDataUrl && (
        <div style={{ position: "absolute", right: 56, bottom: 40 }}>
          <QrTile dataUrl={qrDataUrl} size={120} label="Scan to view profile" />
        </div>
      )}
    </div>
  );
}

export const CARD_LAYOUTS: {
  id: Profile["cardLayout"];
  name: string;
  description: string;
  premium?: boolean;
}[] = [
  { id: "classic", name: "Classic", description: "Avatar, statement name, QR corner" },
  { id: "banner", name: "Banner", description: "Accent band with overlapping portrait" },
  { id: "minimal", name: "Minimal", description: "Centered, typographic, quiet" },
  { id: "split", name: "Split", description: "Portrait panel beside the details" },
  { id: "poster", name: "Poster", description: "Oversized name with an accent rule" },
  { id: "spotlight", name: "Spotlight", description: "Centered under an accent halo" },
  { id: "frame", name: "Frame", description: "Thin inner border, gallery feel" },
  { id: "duo", name: "Duo", description: "Identity panel beside the content" },
  { id: "signal", name: "Signal", description: "Accent spine, editorial split", premium: true },
  { id: "capsule", name: "Capsule", description: "Rounded identity pill, centered", premium: true },
];

export function renderCardLayout(props: CardLayoutProps): React.ReactNode {
  switch (props.profile.cardLayout) {
    case "banner":
      return <BannerLayout {...props} />;
    case "minimal":
      return <MinimalLayout {...props} />;
    case "split":
      return <SplitLayout {...props} />;
    case "poster":
      return <PosterLayout {...props} />;
    case "spotlight":
      return <SpotlightLayout {...props} />;
    case "frame":
      return <FrameLayout {...props} />;
    case "duo":
      return <DuoLayout {...props} />;
    case "signal":
      return <SignalLayout {...props} />;
    case "capsule":
      return <CapsuleLayout {...props} />;
    default:
      return <ClassicLayout {...props} />;
  }
}

export { PLATFORM_META };
