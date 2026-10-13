import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileView } from "@/components/profile/profile-view";
import { createDemoProfile } from "@/lib/profile/demo";
import type { Profile } from "@/types";

describe("ProfileView", () => {
  it("renders the demo profile's identity", () => {
    render(<ProfileView profile={createDemoProfile()} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Rahul Sain" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Software Developer — Full Stack Developer")).toBeInTheDocument();
    // The location appears in the header and again as the contact row
    // "Based in".
    expect(screen.getAllByText("Alwar, Rajasthan, India")).toHaveLength(2);
  });

  it("renders visible social links with safe absolute hrefs", () => {
    render(<ProfileView profile={createDemoProfile()} />);
    // Social links render twice: the header row and the contact section.
    const github = screen.getAllByRole("link", { name: "GitHub: github.com/Anos714" });
    expect(github).toHaveLength(2);
    for (const link of github) {
      expect(link).toHaveAttribute("href", "https://github.com/Anos714");
      // Non-mailto links open safely in a new tab.
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveAttribute("target", "_blank");
    }

    const email = screen.getAllByRole("link", { name: "Email: sainrahul374@gmail.com" });
    for (const link of email) {
      // mailto stays same-tab.
      expect(link).toHaveAttribute("href", "mailto:sainrahul374@gmail.com");
      expect(link).not.toHaveAttribute("target");
    }
  });

  it("applies the resolved theme as CSS custom properties", () => {
    const { container } = render(<ProfileView profile={createDemoProfile()} />);
    const shell = container.firstElementChild as HTMLElement;
    // The Editorial preset's paper background reaches the DOM.
    expect(shell.style.getPropertyValue("--pt-bg")).toBe("#f4f0e8");
    expect(shell.style.backgroundColor).toBe("var(--pt-bg)");
  });

  it("switches tokens when the theme changes", () => {
    const dark = createDemoProfile();
    dark.theme = { ...dark.theme, theme: "noir", accent: "#ff00ff" };
    const { container } = render(<ProfileView profile={dark} />);
    const shell = container.firstElementChild as HTMLElement;
    expect(shell.style.getPropertyValue("--pt-bg")).toBe("#000000");
    expect(shell.style.getPropertyValue("--pt-accent")).toBe("#ff00ff");
  });

  it("hides links marked invisible", () => {
    const profile: Profile = {
      ...createDemoProfile(),
      socials: [
        ...createDemoProfile().socials,
        { id: "hidden", platform: "youtube", label: "Unlisted channel", url: "https://www.youtube.com/@never", visible: false },
      ],
    };
    render(<ProfileView profile={profile} />);
    // An invisible link never reaches the DOM under any name.
    expect(screen.queryAllByRole("link", { name: /Unlisted channel/i })).toHaveLength(0);
    expect(screen.queryAllByRole("link", { name: /never/i })).toHaveLength(0);
  });

  it("never emits an unsafe href anywhere in the tree", () => {
    const profile: Profile = {
      ...createDemoProfile(),
      socials: [
        { id: "x", platform: "github", label: "Bad", url: "javascript:alert(1)", visible: true },
        { id: "y", platform: "github", label: "Ok", url: "https://github.com/ok", visible: true },
      ],
      projects: [
        { id: "p", title: "Bad project", description: "", url: "javascript:alert(2)", tag: "" },
      ],
      websiteUrl: "javascript:alert(3)",
    };
    render(<ProfileView profile={profile} />);
    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).not.toContain("javascript:alert(1)");
    expect(hrefs).not.toContain("javascript:alert(2)");
    expect(hrefs).not.toContain("javascript:alert(3)");
    // The one safe link survives.
    expect(hrefs).toContain("https://github.com/ok");
  });

  it("renders the enabled sections", () => {
    render(<ProfileView profile={createDemoProfile()} />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "About",
      "Skills",
      "Featured work",
      "Contact",
    ]);
  });

  it("shows the empty state when every section is toggled off", () => {
    const profile: Profile = {
      ...createDemoProfile(),
      sections: { about: false, skills: false, projects: false, contact: false },
    };
    render(<ProfileView profile={profile} />);
    expect(
      screen.getByText("All sections are hidden. Enable one in the editor to see it here."),
    ).toBeInTheDocument();
  });

  it("renders under every profile design without throwing", () => {
    const designs = ["editorial", "centered", "sidebar", "hero"] as const;
    for (const profileDesign of designs) {
      const profile = { ...createDemoProfile(), profileDesign };
      const { unmount } = render(<ProfileView profile={profile} />);
      expect(
        screen.getByRole("heading", { level: 1, name: "Rahul Sain" }),
      ).toBeInTheDocument();
      unmount();
    }
  });

});
