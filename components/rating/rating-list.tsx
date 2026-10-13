import { Star } from "@/components/icons/ui-icons";
import type { Rating } from "@/lib/db";

/**
 * The wall of approved ratings. Each card carries its own star row so a glance
 * across the grid reads as many opinions, not one average.
 *
 * Renders an honest empty state rather than a blank box: a fresh instance has
 * no ratings yet, and saying so plainly is better than pretending otherwise.
 */
export function RatingList({ ratings }: { ratings: Rating[] }) {
  if (ratings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-2 bg-bg-subtle/40 p-10 text-center">
        <div className="mx-auto flex w-fit gap-1" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className="h-6 w-6 text-line-2" />
          ))}
        </div>
        <h3 className="mt-5 text-base font-semibold tracking-tight text-ink">
          No ratings yet
        </h3>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-2">
          Be the first to leave one — it takes two seconds and it helps the next
          visitor decide.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {ratings.map((rating) => (
        <li key={rating.id}>
          <RatingCard rating={rating} />
        </li>
      ))}
    </ul>
  );
}

function RatingCard({ rating }: { rating: Rating }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-card-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-0.5" aria-label={`${rating.rating} out of 5 stars`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cnStar(i < rating.rating)}
            />
          ))}
        </div>
        <time
          dateTime={rating.createdAt.toISOString()}
          className="font-mono text-[0.6875rem] text-ink-3"
        >
          {formatDate(rating.createdAt)}
        </time>
      </div>

      {rating.message ? (
        <p className="mt-4 text-sm leading-relaxed text-ink-2">“{rating.message}”</p>
      ) : (
        <p className="mt-4 text-sm italic leading-relaxed text-ink-3">No note left.</p>
      )}

      <p className="mt-auto pt-5 text-sm font-medium text-ink">— {rating.authorName}</p>
    </article>
  );
}

function cnStar(filled: boolean) {
  return filled ? "h-4 w-4 text-accent-2" : "h-4 w-4 text-line-2";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
