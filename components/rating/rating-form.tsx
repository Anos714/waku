"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Check, Loader2, Star } from "@/components/icons/ui-icons";
import { cn } from "@/lib/utils";
import type { Rating } from "@/lib/db";

type Status = "idle" | "submitting" | "done" | "error";

const STAR_LABELS = ["", "Not for me", "Fair", "Good", "Great", "Perfect"];

/**
 * The rating form. Stars are the primary input — the whole interaction is
 * "how many stars, and who are you" — with an optional public note.
 *
 * Submissions go to `/api/ratings`, which is anonymous: a hashed IP + user
 * agent fingerprint is the only identity, and it means revising your rating
 * replaces the old one rather than stacking a duplicate.
 */
export function RatingForm({ average, count }: { average: number; count: number }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<Rating | null>(null);

  const display = hover || rating;
  const canSend = name.trim().length > 0 && rating > 0 && status !== "submitting";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;

    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: name.trim(),
          rating,
          message: message.trim() || undefined,
        }),
      });

      const body = (await response.json()) as { ok: boolean; message?: string; rating?: Rating };

      if (!response.ok || !body.ok) {
        setStatus("error");
        setError(
          body.message ??
            (response.status === 503
              ? "This server is not collecting ratings yet."
              : "Could not save your rating. Try again in a moment."),
        );
        return;
      }

      setStatus("done");
      setJustAdded(body.rating ?? null);
      setMessage("");
    } catch {
      setStatus("error");
      setError("Could not reach the server. Check your connection and try again.");
    }
  }

  if (status === "done" && justAdded) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 shadow-card-sm">
        <div className="flex flex-col items-center text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-ink animate-pop"
            aria-hidden="true"
          >
            <Check className="h-6 w-6" />
          </span>
          <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink">
            Thanks, {justAdded.authorName.split(" ")[0]}.
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-2">
            Your {justAdded.rating}-star rating is live. It now appears below, and
            it helps the next person decide whether Waku is worth their time.
          </p>
          <div className="mt-5 flex gap-1" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-5 w-5 transition-colors",
                  i < justAdded.rating ? "text-accent-2" : "text-line-2",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setJustAdded(null);
              setRating(0);
              setName("");
            }}
            className="mt-7 text-sm font-medium text-ink underline decoration-line-2 underline-offset-4 transition-colors hover:decoration-accent-2"
          >
            Rate again
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-surface p-6 shadow-card-sm sm:p-8"
    >
      <div className="flex flex-col gap-6">
        {/* Stars */}
        <div className="flex flex-col gap-2.5">
          <Label asChild>
            <span>Your rating <span className="text-ink-3">(required)</span></span>
          </Label>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }, (_, index) => {
              const value = index + 1;
              const active = display >= value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHover(value)}
                  onMouseLeave={() => setHover(0)}
                  onFocus={() => setHover(value)}
                  onBlur={() => setHover(0)}
                  aria-pressed={rating === value}
                  aria-label={`${value} star${value > 1 ? "s" : ""} — ${STAR_LABELS[value]}`}
                  className="rounded-lg p-1 text-line-2 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors duration-150",
                      active ? "text-accent-2" : "text-line-2",
                    )}
                  />
                </button>
              );
            })}
            {display > 0 ? (
              <span className="ml-2 text-sm font-medium text-ink">{STAR_LABELS[display]}</span>
            ) : null}
          </div>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="rating-name">Your name <span className="text-ink-3">(required)</span></Label>
          <Input
            id="rating-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Rahul Sain"
            autoComplete="name"
            maxLength={60}
            required
          />
        </div>

        {/* Message */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="rating-message">A note <span className="text-ink-3">(optional)</span></Label>
          <Textarea
            id="rating-message"
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="What worked, what didn't — other visitors read this."
            rows={3}
            maxLength={500}
          />
          <span className="flex justify-end font-mono text-[0.6875rem] text-ink-3">
            {message.length}/500
          </span>
        </div>

        {status === "error" && error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/5 px-3.5 py-2.5 text-sm leading-relaxed text-red-600">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={!canSend}
          className="group w-fit"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Posting…
            </>
          ) : (
            <>
              Post your rating
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </Button>

        <p className="text-xs leading-relaxed text-ink-3">
          {count > 0
            ? `Join ${count} ${count === 1 ? "person who has" : "people who have"} rated Waku — currently ${average.toFixed(1)} out of 5.`
            : "Be the first to rate Waku."}
        </p>
      </div>
    </form>
  );
}
