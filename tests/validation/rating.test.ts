import { describe, expect, it } from "vitest";
import { ratingSchema } from "@/lib/validation/rating";

describe("ratingSchema", () => {
  it("accepts a rating with only a name and score", () => {
    const result = ratingSchema.safeParse({ authorName: "Ada", rating: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.authorName).toBe("Ada");
      expect(result.data.rating).toBe(5);
      expect(result.data.message).toBeNull();
    }
  });

  it("trims whitespace and drops a blank message to null", () => {
    const result = ratingSchema.safeParse({
      authorName: "  Grace  ",
      rating: 4,
      message: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.authorName).toBe("Grace");
      expect(result.data.message).toBeNull();
    }
  });

  it("keeps a written message", () => {
    const result = ratingSchema.safeParse({
      authorName: "Ada",
      rating: 5,
      message: "Genuinely lovely to use.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe("Genuinely lovely to use.");
    }
  });

  it("rejects a rating below 1 star", () => {
    const result = ratingSchema.safeParse({ authorName: "Ada", rating: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a rating above 5 stars", () => {
    const result = ratingSchema.safeParse({ authorName: "Ada", rating: 6 });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer star count", () => {
    const result = ratingSchema.safeParse({ authorName: "Ada", rating: 3.5 });
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = ratingSchema.safeParse({ authorName: "   ", rating: 4 });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 60 characters", () => {
    const result = ratingSchema.safeParse({
      authorName: "A".repeat(61),
      rating: 4,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a message longer than 500 characters", () => {
    const result = ratingSchema.safeParse({
      authorName: "Ada",
      rating: 4,
      message: "A".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
