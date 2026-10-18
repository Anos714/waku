import { describe, expect, it } from "vitest";
import { CARD_LAYOUTS } from "@/components/cards/card-layouts";
import {
  isLayoutUnlocked,
  isPremiumLayout,
  lockedLayoutCount,
  PREMIUM_CARD_LAYOUTS,
} from "@/lib/cards/premium";
import type { CardLayoutId } from "@/types";

const ORIGINAL_LAYOUTS: CardLayoutId[] = [
  "classic",
  "banner",
  "minimal",
  "split",
  "poster",
  "spotlight",
  "frame",
  "duo",
];

describe("card entitlements", () => {
  it("keeps the original layouts free for anonymous users", () => {
    for (const id of ORIGINAL_LAYOUTS) {
      expect(isPremiumLayout(id)).toBe(false);
      expect(isLayoutUnlocked(id, { signedIn: false })).toBe(true);
    }
  });

  it("locks premium layouts when signed out and unlocks them when signed in", () => {
    for (const id of PREMIUM_CARD_LAYOUTS) {
      expect(isPremiumLayout(id)).toBe(true);
      expect(isLayoutUnlocked(id, { signedIn: false })).toBe(false);
      expect(isLayoutUnlocked(id, { signedIn: true })).toBe(true);
    }
  });

  it("counts locked layouts for the unlock hint", () => {
    expect(lockedLayoutCount({ signedIn: false })).toBe(PREMIUM_CARD_LAYOUTS.length);
    expect(lockedLayoutCount({ signedIn: true })).toBe(0);
  });

  it("keeps the studio's premium flags in sync with the entitlement list", () => {
    const flagged = CARD_LAYOUTS.filter((layout) => layout.premium)
      .map((layout) => layout.id)
      .sort();
    expect(flagged).toEqual([...PREMIUM_CARD_LAYOUTS].sort());
  });
});