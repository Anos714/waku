import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProjectsSection } from "@/components/profile/profile-sections";
import { createDemoProfile } from "@/lib/profile/demo";
import type { FeaturedProject, Profile } from "@/types";

function profileWithProjects(projects: unknown[]): Profile {
  return {
    ...createDemoProfile(),
    projects: projects as FeaturedProject[],
  };
}

const BASE_PROJECT = {
  id: "p1",
  title: "Demo project",
  description: "What it is and why it matters.",
  url: "https://example.com/demo",
  tag: "Web",
};

const CLOUD_ENV = "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME";
let savedCloud: string | undefined;

beforeEach(() => {
  savedCloud = process.env[CLOUD_ENV];
});

afterEach(() => {
  if (savedCloud === undefined) delete process.env[CLOUD_ENV];
  else process.env[CLOUD_ENV] = savedCloud;
});

describe("ProjectsSection screenshots", () => {
  it("renders a readable landscape thumbnail when imageUrl is a safe URL", () => {
    const { container } = render(
      <ProjectsSection
        profile={profileWithProjects([
          { ...BASE_PROJECT, imageUrl: "https://example.com/shot.png" },
        ])}
      />,
    );
    const img = screen.getByAltText("Demo project — project screenshot");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("loading", "lazy");
    // Landscape thumb frame: big enough to read, never a full-width banner.
    const frame = container.querySelector(".project-thumb");
    expect(frame).not.toBeNull();
    expect(frame?.className).toContain("aspect-[16/10]");
    expect(container.querySelector(".aspect-video")).toBeNull();
    // Text content still renders alongside the image.
    expect(screen.getByText("Demo project")).toBeInTheDocument();
  });

  it("renders the original text-only card when imageUrl is empty", () => {
    const { container } = render(
      <ProjectsSection profile={profileWithProjects([{ ...BASE_PROJECT, imageUrl: "" }])} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Demo project")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Demo project/ }),
    ).toHaveAttribute("href", "https://example.com/demo");
  });

  it("never renders an unsafe imageUrl, but keeps the text card", () => {
    const { container } = render(
      <ProjectsSection
        profile={profileWithProjects([
          { ...BASE_PROJECT, imageUrl: "javascript:alert(1)" },
        ])}
      />,
    );
    expect(container.querySelector("img")).toBeNull();
    const imgs = Array.from(container.querySelectorAll("img")).map((img) =>
      img.getAttribute("src"),
    );
    expect(imgs).not.toContain("javascript:alert(1)");
    expect(screen.getByText("Demo project")).toBeInTheDocument();
  });

  it("renders legacy projects that predate imageUrl without crashing", () => {
    const legacy = { ...BASE_PROJECT } as Record<string, unknown>;
    delete legacy.imageUrl;
    const { container } = render(
      <ProjectsSection profile={profileWithProjects([legacy])} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Demo project")).toBeInTheDocument();
  });

  it("resolves a Cloudinary public ID from the uploader to a delivery URL", () => {
    process.env[CLOUD_ENV] = "demo-cloud";
    render(
      <ProjectsSection
        profile={profileWithProjects([
          { ...BASE_PROJECT, imageUrl: "waku/demo-shot" },
        ])}
      />,
    );
    const img = screen.getByAltText("Demo project — project screenshot");
    expect(img.getAttribute("src")).toContain("res.cloudinary.com");
    expect(img.getAttribute("src")).toContain("demo-cloud");
  });

  it("renders no image for a public ID when Cloudinary is unconfigured", () => {
    delete process.env[CLOUD_ENV];
    const { container } = render(
      <ProjectsSection
        profile={profileWithProjects([
          { ...BASE_PROJECT, imageUrl: "waku/demo-shot" },
        ])}
      />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Demo project")).toBeInTheDocument();
  });

  it("hides the screenshot when the image fails to load", () => {
    render(
      <ProjectsSection
        profile={profileWithProjects([
          { ...BASE_PROJECT, imageUrl: "https://example.com/missing.png" },
        ])}
      />,
    );
    const img = screen.getByAltText("Demo project — project screenshot");
    fireEvent.error(img);
    expect(
      screen.queryByAltText("Demo project — project screenshot"),
    ).toBeNull();
    // The text card survives the image failure.
    expect(screen.getByText("Demo project")).toBeInTheDocument();
  });
});
