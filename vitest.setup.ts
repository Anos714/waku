import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// RTL's auto-cleanup hooks into the framework's afterEach; with vitest globals
// off we wire it up here so each test starts from an empty document.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement URL.createObjectURL (used by the card export path);
// a no-op keeps any component that touches it from throwing in tests.
if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = () => "blob:mock";
}
if (typeof URL.revokeObjectURL !== "function") {
  URL.revokeObjectURL = () => {};
}
