import type { Metadata } from "next";
import { EditorShell } from "@/components/editor/editor-shell";

export const metadata: Metadata = {
  title: "Editor: Build your profile",
  description:
    "Edit your profile, generate an AI bio, theme the page, and export a shareable identity card.",
};

export default function CreatePage() {
  return <EditorShell />;
}
