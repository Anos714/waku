import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { EditorProvider, useEditor } from "@/components/editor/editor-provider";
import { BasicFields } from "@/components/editor/basic-fields";
import { createDemoProfile } from "@/lib/profile/demo";

function ResetProbe() {
  const { resetToDemo } = useEditor();
  return (
    <button type="button" onClick={resetToDemo}>
      do reset
    </button>
  );
}

function Harness() {
  return (
    <EditorProvider>
      <BasicFields />
      <ResetProbe />
    </EditorProvider>
  );
}

/**
 * Regression: "Reset everything" used to snap the preview back instantly while
 * the Skills/Interests boxes kept stale text until a full page reload. Those
 * boxes were uncontrolled `defaultValue` inputs that `form.reset()` never
 * touches; they are now form-aware without clobbering in-progress typing.
 */
describe("BasicFields reset sync", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("resets the skills and interests boxes instantly with everything else", () => {
    render(<Harness />);
    const demoSkills = createDemoProfile().skills.join(", ");
    const demoInterests = createDemoProfile().interests.join(", ");
    const skillsBox = screen.getByLabelText("Skills") as HTMLInputElement;
    const interestsBox = screen.getByLabelText("Interests") as HTMLInputElement;

    expect(skillsBox.value).toBe(demoSkills);

    // Diverge from the demo, committing on blur like a real user.
    fireEvent.change(skillsBox, { target: { value: "Zed, Alpha" } });
    fireEvent.blur(skillsBox);
    fireEvent.change(interestsBox, { target: { value: "Chess" } });
    fireEvent.blur(interestsBox);
    expect(skillsBox.value).toBe("Zed, Alpha");
    expect(interestsBox.value).toBe("Chess");

    // Reset everything: boxes must re-seed from the form immediately (the
    // inputs remount, so re-query — the old nodes are detached).
    fireEvent.click(screen.getByRole("button", { name: "do reset" }));
    expect((screen.getByLabelText("Skills") as HTMLInputElement).value).toBe(
      demoSkills,
    );
    expect(
      (screen.getByLabelText("Interests") as HTMLInputElement).value,
    ).toBe(demoInterests);
  });

  it("keeps in-progress typing while committing on blur", () => {
    render(<Harness />);
    const skillsBox = screen.getByLabelText("Skills") as HTMLInputElement;

    fireEvent.change(skillsBox, { target: { value: "Zed, Alph" } });
    // Typing alone commits nothing and survives re-renders.
    expect(skillsBox.value).toBe("Zed, Alph");
    fireEvent.blur(skillsBox);
    expect(skillsBox.value).toBe("Zed, Alph");
  });
});
