import type { CardLayoutId } from "@/types";

/**
 * Card entitlements.
 *
 * The eight original layouts stay free for everyone — the anonymous editor is
 * unchanged. Two newer layouts are "premium": they exist as an additive perk and
 * unlock for signed-in users. There is no payment anywhere; access is a
 * free unlock, not a paywall.
 */

/** Layouts that require a signed-in account. */
export const PREMIUM_CARD_LAYOUTS: readonly CardLayoutId[] = ["signal", "capsule"];

export interface CardEntitlements {
  signedIn: boolean;
}

export function isPremiumLayout(id: CardLayoutId): boolean {
  return PREMIUM_CARD_LAYOUTS.includes(id);
}

/** Free layouts are always usable; premium ones need a session. */
export function isLayoutUnlocked(
  id: CardLayoutId,
  entitlements: CardEntitlements,
): boolean {
  if (!isPremiumLayout(id)) return true;
  return entitlements.signedIn;
}

/** How many premium layouts a viewer cannot use yet (for the unlock hint). */
export function lockedLayoutCount(entitlements: CardEntitlements): number {
  if (entitlements.signedIn) return 0;
  return PREMIUM_CARD_LAYOUTS.length;
}