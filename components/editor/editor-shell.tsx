"use client";

import { useState } from "react";
import { EditorProvider } from "./editor-provider";
import { EditorHeader } from "./editor-header";
import { DraftClaimer } from "./draft-claimer";
import { BasicFields } from "./basic-fields";
import { ResumeImporter } from "./resume-importer";
import { GithubImporter } from "./github-importer";
import { SocialLinksEditor } from "./social-links-editor";
import { FeaturedEditor } from "./featured-editor";
import { AiBioGenerator } from "./ai-bio-generator";
import { ThemeCustomizer } from "./theme-customizer";
import { PreviewPane } from "./preview-pane";
import { cn } from "@/lib/utils";

type MobileView = "edit" | "preview";

/**
 * The /create experience: controls on the left, a live preview on the right.
 * Below the large breakpoint the panes stack behind a switch so editing and
 * previewing both stay comfortable on a small screen.
 */
export function EditorShell() {
  const [mobileView, setMobileView] = useState<MobileView>("edit");

  return (
    <EditorProvider>
      <DraftClaimer />
      <div className="flex min-h-dvh flex-col">
        <EditorHeader />

        <div className="flex items-center justify-between gap-3 border-b border-line bg-bg-subtle/60 px-4 py-2 lg:hidden">
          <p className="text-[0.6875rem] font-medium text-ink-3">
            {mobileView === "edit" ? "Editing" : "Preview"}
          </p>
          <div
            role="tablist"
            aria-label="Editor view"
            className="inline-flex items-center gap-1 rounded-lg bg-surface-2 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mobileView === "edit"}
              onClick={() => setMobileView("edit")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                mobileView === "edit"
                  ? "bg-surface text-ink shadow-card-sm"
                  : "text-ink-3",
              )}
            >
              Edit
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileView === "preview"}
              onClick={() => setMobileView("preview")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                mobileView === "preview"
                  ? "bg-surface text-ink shadow-card-sm"
                  : "text-ink-3",
              )}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="lg:grid lg:flex-1 lg:grid-cols-[minmax(0,470px)_minmax(0,1fr)]">
          <div
            className={cn(
              "scroll-slim min-h-0 overflow-y-auto border-line bg-bg-subtle/40 lg:border-r",
              mobileView === "edit" ? "block" : "hidden",
              "lg:block",
            )}
            aria-hidden={mobileView !== "edit"}
          >
            <ResumeImporter />
            <GithubImporter />
            <BasicFields />
            <AiBioGenerator />
            <SocialLinksEditor />
            <FeaturedEditor />
            <ThemeCustomizer />
            <div className="px-5 py-8">
              <p className="text-[0.6875rem] leading-relaxed text-ink-3">
                Drafts are stored in this browser only. Nothing is published
                until you deploy Waku with a data source.
              </p>
            </div>
          </div>

          <div
            className={cn(
              "min-h-0 bg-bg-subtle/40",
              mobileView === "preview" ? "block" : "hidden",
              "lg:sticky lg:top-14 lg:block lg:h-[calc(100dvh-3.5rem)]",
            )}
            aria-hidden={mobileView !== "preview"}
          >
            <PreviewPane />
          </div>
        </div>
      </div>
    </EditorProvider>
  );
}
