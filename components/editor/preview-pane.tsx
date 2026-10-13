"use client";

import { useRef } from "react";
import { ProfileView } from "@/components/profile/profile-view";
import { CardStudio } from "@/components/cards/card-studio";
import { PreviewDownloadMenu } from "@/components/cards/download-card-button";
import { SharePanel } from "./share-panel";
import { useEditor } from "./editor-provider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { LayoutGrid, Frame, Share2 } from "@/components/icons/ui-icons";

/**
 * The live preview column. Hosts the themed profile, the identity card studio
 * and the share panel under tabs.
 */
export function PreviewPane() {
  const { profile } = useEditor();
  const profileSurfaceRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-full flex-col">
      <Tabs defaultValue="profile" className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <TabsList>
            <TabsTrigger value="profile">
              <LayoutGrid className="h-3.5 w-3.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="card">
              <Frame className="h-3.5 w-3.5" />
              Card
            </TabsTrigger>
            <TabsTrigger value="share">
              <Share2 className="h-3.5 w-3.5" />
              Share
            </TabsTrigger>
          </TabsList>
          <span className="hidden text-[0.6875rem] font-medium text-ink-3 sm:block">
            Live
          </span>
        </div>

        <div className="scroll-slim flex-1 overflow-y-auto">
          <TabsContent value="profile" className="mt-0 p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3">
                  Profile page
                </p>
                <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-ink-3">
                  Exactly what your public page renders.
                </p>
              </div>
              <PreviewDownloadMenu
                profile={profile}
                surfaceRef={profileSurfaceRef}
                align="end"
              />
            </div>
            <div
              ref={profileSurfaceRef}
              key={profile.theme.theme}
              className="overflow-hidden rounded-xl border border-line-2 bg-surface shadow-card"
            >
              <ProfileView profile={profile} compact avatarSize={72} />
            </div>
            <p className="mt-3 text-[0.6875rem] leading-relaxed text-ink-3">
              Resize the window to see it adapt.
            </p>
          </TabsContent>

          <TabsContent value="card" className="mt-0 p-5 sm:p-6">
            <CardStudio />
          </TabsContent>

          <TabsContent value="share" className="mt-0 p-5 sm:p-6">
            <SharePanel />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
