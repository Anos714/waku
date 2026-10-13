import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export const alt = "Waku — Your identity, beautifully put together.";

const pub = (file: string) => path.join(process.cwd(), "public", file);

const fonts = [
  {
    name: "Geist",
    data: fs.readFileSync(pub("fonts/Geist-Regular.woff")),
    weight: 400 as const,
    style: "normal" as const,
  },
  {
    name: "Geist",
    data: fs.readFileSync(pub("fonts/Geist-SemiBold.woff")),
    weight: 600 as const,
    style: "normal" as const,
  },
];

const asDataUrl = (file: string) =>
  `data:image/png;base64,${fs.readFileSync(pub(file)).toString("base64")}`;

const mascot = asDataUrl("brand/waku-mascot.png");
const mark = asDataUrl("brand/waku-mark-192.png");

const INK = "#1a1a16";
const INK_2 = "#4c4a43";
const INK_3 = "#7d7a70";
const BG = "#f5f3ee";
const SUBTLE = "#ece8e0";
const LINE = "#e0dbd1";
const ACCENT = "#c6f24e";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          background: BG,
          fontFamily: "Geist",
          color: INK,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 700,
            paddingTop: 56,
            paddingBottom: 56,
            paddingLeft: 64,
            paddingRight: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src={mark} width={46} height={46} alt="Waku" style={{ borderRadius: 13 }} />
            <div
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: 600,
                letterSpacing: "-0.5px",
                marginLeft: 14,
              }}
            >
              Waku
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 17,
                color: INK_3,
                marginLeft: 16,
                letterSpacing: "2.4px",
              }}
            >
              IDENTITY STUDIO
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 78,
                  fontWeight: 600,
                  lineHeight: 1.03,
                  letterSpacing: "-3px",
                }}
              >
                Your identity,
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 78,
                  fontWeight: 600,
                  lineHeight: 1.03,
                  letterSpacing: "-3px",
                }}
              >
                beautifully
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginTop: 8,
                  alignSelf: "flex-start",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 78,
                    fontWeight: 600,
                    lineHeight: 1.03,
                    letterSpacing: "-3px",
                    background: ACCENT,
                    color: INK,
                    paddingTop: 4,
                    paddingBottom: 12,
                    paddingLeft: 16,
                    paddingRight: 16,
                    borderRadius: 14,
                  }}
                >
                  put together.
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 30,
                fontSize: 25,
                lineHeight: 1.4,
                color: INK_2,
              }}
            >
              <div style={{ display: "flex" }}>
                Profile page, identity card and QR code.
              </div>
              <div style={{ display: "flex" }}>
                AI-written, themed live, exported as PNG.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                background: INK,
                color: BG,
                fontSize: 23,
                fontWeight: 600,
                paddingTop: 13,
                paddingBottom: 13,
                paddingLeft: 28,
                paddingRight: 28,
                borderRadius: 999,
              }}
            >
              waku.local
            </div>
            <div style={{ display: "flex", fontSize: 21, color: INK_3, marginLeft: 16 }}>
              AI bio · 4 themes · 4 card layouts
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: SUBTLE,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 460,
              height: 460,
              borderRadius: "50%",
              border: `2px solid ${LINE}`,
            }}
          />
          <img src={mascot} width={390} height={390} alt="" style={{ position: "relative" }} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    },
  );
}
