import { z } from "zod";

/**
 * Validation for a visitor rating submitted from the `/rate` page.
 *
 * The name is trimmed and length-capped so the wall stays readable; the score
 * is an integer 1–5 (stars are the only input); the optional message is capped
 * too, since it renders publicly on the landing page.
 */
export const ratingSchema = z.object({
  authorName: z
    .string()
    .trim()
    .min(1, "Add a name so people know who rated.")
    .max(60, "Keep your name under 60 characters."),
  rating: z.number().int().min(1).max(5, "Choose a rating from 1 to 5 stars."),
  message: z
    .string()
    .trim()
    .max(500, "Keep your note under 500 characters.")
    .optional()
    .transform((value) => (value ? value : null)),
});

export type RatingInput = z.infer<typeof ratingSchema>;
