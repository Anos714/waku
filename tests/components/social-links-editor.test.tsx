import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditorProvider } from "@/components/editor/editor-provider";
import { SocialLinksEditor } from "@/components/editor/social-links-editor";

/**
 * The editor renders one row per `useFieldArray` entry but reads the live
 * values out of `useWatch`. React-Hook-Form updates the field array one
 * render before the watched value, so the very first render after an append
 * has a `fields` entry with no matching watched object — the row must fall
 * back to the field object instead of throwing.
 */
function Harness() {
  return (
    <EditorProvider>
      <SocialLinksEditor />
    </EditorProvider>
  );
}

describe("SocialLinksEditor", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("survives the render where fields outruns the watched value", () => {
    render(<Harness />);

    // The demo profile ships github/linkedin/portfolio/email, so X is free.
    fireEvent.click(screen.getByRole("button", { name: "Add X link" }));

    // The appended row renders without crashing and is usable immediately.
    expect(
      screen.getByRole("button", { name: "Remove X link" }),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Label/)).toHaveLength(5);
  });

  it("keeps adding and removing links in sync", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Add X link" }));
    fireEvent.click(screen.getByRole("button", { name: "Add YouTube link" }));
    expect(screen.getAllByRole("button", { name: /Remove .* link/ })).toHaveLength(6);

    fireEvent.click(screen.getByRole("button", { name: "Remove X link" }));
    expect(screen.getAllByRole("button", { name: /Remove .* link/ })).toHaveLength(5);
  });

  it("counts only visible links with a URL in the badge", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Add X link" }));
    // The appended link starts visible with a baseUrl, so the badge reflects it.
    expect(screen.getByText("5 shown")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hide X" }));
    expect(screen.getByText("4 shown")).toBeInTheDocument();
  });
});
