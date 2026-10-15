import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { EditorProvider, useEditor } from "@/components/editor/editor-provider";
import { ResumeImporter } from "@/components/editor/resume-importer";

function Probe() {
  const { profile } = useEditor();
  return (
    <div>
      <span data-testid="probe-name">{profile.name}</span>
      <span data-testid="probe-projects">{profile.projects.length}</span>
      <span data-testid="probe-skills">{profile.skills.join(",")}</span>
    </div>
  );
}

function Harness() {
  return (
    <EditorProvider>
      <ResumeImporter />
      <Probe />
    </EditorProvider>
  );
}

const PATCH = {
  name: "Grace Hopper",
  role: "Computer Scientist",
  bio: "Built the first compiler.",
  location: "Arlington",
  websiteUrl: "",
  skills: ["COBOL", "Compilers"],
  interests: [],
  projects: [
    { title: "COBOL", description: "A language.", url: "", tag: "Lang" },
  ],
};

describe("ResumeImporter", () => {
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    window.localStorage.clear();
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, patch: PATCH, warnings: [], model: "test" }),
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  async function uploadAndAnalyze() {
    render(<Harness />);
    const input = screen.getByLabelText(/PDF resume/) as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [new File(["resume-bytes"], "resume.pdf", { type: "application/pdf" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));
    await screen.findByText("Review the draft");
  }

  it("reviews the extraction and applies only checked groups", async () => {
    await uploadAndAnalyze();

    // Uncheck projects — everything else stays selected.
    fireEvent.click(screen.getByRole("switch", { name: /Apply Projects/ }));
    fireEvent.click(screen.getByRole("button", { name: "Apply selected" }));

    await screen.findByText("Applied to your draft");

    // Basics + skills applied…
    expect(screen.getByTestId("probe-name").textContent).toBe("Grace Hopper");
    expect(screen.getByTestId("probe-skills").textContent).toBe("COBOL,Compilers");
    // …but the demo projects are untouched (4, not 1).
    expect(screen.getByTestId("probe-projects").textContent).toBe("4");
  });

  it("shows extraction warnings on the review screen", async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        patch: PATCH,
        warnings: ["Kept the 6 most substantial projects of 9."],
        model: "test",
      }),
    });
    await uploadAndAnalyze();

    expect(
      screen.getByText("Kept the 6 most substantial projects of 9."),
    ).toBeInTheDocument();
  });

  it("surfaces a server error without touching the draft", async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({
        ok: false,
        code: "ALL_MODELS_UNAVAILABLE",
        message: "Every AI model is busy right now.",
      }),
    });
    render(<Harness />);
    const input = screen.getByLabelText(/PDF resume/) as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [new File(["resume-bytes"], "resume.pdf", { type: "application/pdf" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    await screen.findByText("Every AI model is busy right now.");
    // Demo draft untouched.
    expect(screen.getByTestId("probe-name").textContent).toBe("Rahul Sain");
  });
});
