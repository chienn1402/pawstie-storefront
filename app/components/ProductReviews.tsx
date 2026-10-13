import {useEffect, useId, useRef, useState} from 'react';
import {useFetcher} from 'react-router';
import {StarIcon} from '~/components/icons';
import type {
  ProductReview,
  ProductReviews as ProductReviewsData,
  ReviewActionResult,
  ReviewSummary,
} from '~/lib/reviews';
import {REVIEW_LIMITS} from '~/lib/reviews';
import {cn} from '~/lib/utils';

/** Reviews shown before "Show all". Enough to read as a pattern, not a wall. */
const INITIAL_VISIBLE = 4;

/** The fragment a review-request link can point at to open the form. */
const WRITE_HASH = '#write-review';

function plural(count: number) {
  return `${count} ${count === 1 ? 'review' : 'reviews'}`;
}

/**
 * Five stars filled to `rating`, fractions included (4.6 fills 92%). The
 * orange row is clipped over a pale one, so it's one shape and not five
 * half-star cases. Decorative: callers carry the accessible text.
 */
export function ReviewStars({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  const percent = Math.max(0, Math.min(100, (rating / 5) * 100));
  const row = (tone: string) => (
    <span className={cn('flex gap-0.5', tone)}>
      {[0, 1, 2, 3, 4].map((index) => (
        <StarIcon key={index} className="size-[1em] shrink-0" />
      ))}
    </span>
  );

  return (
    <span
      aria-hidden="true"
      className={cn('relative inline-flex leading-none', className)}
    >
      {row('text-[#cfe9c8]')}
      <span
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{width: `${percent}%`}}
      >
        {row('text-[#df7a00]')}
      </span>
    </span>
  );
}

/** Stars + "4.8 · 12 reviews" under the product title, linking to the list. */
export function ReviewSummaryLink({summary}: {summary: ReviewSummary}) {
  if (!summary.count) return null;

  return (
    <a
      href="#reviews"
      className="mt-3 inline-flex items-center gap-2 rounded-full text-sm font-semibold text-[#347345] no-underline transition-colors hover:text-[#004817] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d]"
    >
      <ReviewStars rating={summary.average} className="text-base" />
      <span>
        <span className="font-heading font-extrabold text-[#004817]">
          {summary.average.toFixed(1)}
        </span>
        <span aria-hidden="true"> · </span>
        <span className="underline underline-offset-4">
          {plural(summary.count)}
        </span>
        <span className="sr-only">, rated {summary.average} out of 5</span>
      </span>
    </a>
  );
}

export function ProductReviews({
  productId,
  productTitle,
  data,
}: {
  productId: number;
  productTitle: string;
  data: ProductReviewsData;
}) {
  const {summary, reviews} = data;
  const [formOpen, setFormOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const formRegionRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const formRegionId = useId();

  // A link ending in #write-review (e.g. one the shop sends to a buyer) opens
  // the form directly. Client-only: the server never sees the hash.
  useEffect(() => {
    if (window.location.hash !== WRITE_HASH) return;
    setFormOpen(true);
    requestAnimationFrame(() =>
      formRegionRef.current?.scrollIntoView({block: 'start'}),
    );
  }, []);

  const visible = showAll ? reviews : reviews.slice(0, INITIAL_VISIBLE);
  const toggle = (
    <button
      type="button"
      aria-expanded={formOpen}
      aria-controls={formRegionId}
      onClick={() => setFormOpen((open) => !open)}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#00521d] px-5 py-3 font-heading text-sm font-extrabold text-white transition-colors hover:bg-[#004817] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d] motion-reduce:transition-none"
    >
      {formOpen ? 'Close' : 'Write a review'}
    </button>
  );

  const formRegion = (
    <div
      id={formRegionId}
      ref={formRegionRef}
      hidden={!formOpen}
      className="scroll-mt-28"
    >
      {formOpen ? (
        <ReviewForm productId={productId} productTitle={productTitle} />
      ) : null}
    </div>
  );

  // No reviews yet: no "0 reviews" box and no empty stars, which would cost
  // more trust than they add. Just a quiet way in for the first buyers.
  if (!summary.count) {
    return (
      <section
        id="reviews"
        aria-labelledby={headingId}
        className="mt-10 scroll-mt-28 rounded-[2rem] border border-[#d6f3d0] px-6 py-6 sm:px-8 lg:mt-12"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id={headingId}
              className="mb-0 font-heading text-lg font-extrabold tracking-[-0.02em] text-[#004817]"
            >
              Have this one already?
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-[#347345]">
              Tell other pet parents how it’s going.
            </p>
          </div>
          {toggle}
        </div>
        {formRegion}
      </section>
    );
  }

  return (
    <section
      id="reviews"
      aria-labelledby={headingId}
      className="mt-12 scroll-mt-28 px-0 py-0 lg:mt-16"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id={headingId}
            className="mb-0 font-heading text-3xl font-semibold tracking-[-0.04em] text-[#004817] sm:text-4xl"
          >
            Reviews
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-heading text-4xl font-extrabold tracking-[-0.04em] text-[#004817]">
              {summary.average.toFixed(1)}
            </span>
            <span className="flex flex-col gap-1">
              <ReviewStars rating={summary.average} className="text-lg" />
              <span className="text-sm text-[#347345]">
                Based on {plural(summary.count)}
                <span className="sr-only">
                  , rated {summary.average} out of 5
                </span>
              </span>
            </span>
          </div>
        </div>
        {toggle}
      </div>

      {formRegion}

      <ul className="mt-8 grid gap-4 lg:grid-cols-2">
        {visible.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </ul>

      {reviews.length > INITIAL_VISIBLE ? (
        <button
          type="button"
          onClick={() => setShowAll((all) => !all)}
          className="mt-6 rounded-full font-heading text-sm font-extrabold text-[#00521d] underline underline-offset-4 transition-colors hover:text-[#00752d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d]"
        >
          {showAll ? 'Show fewer reviews' : `Show all ${plural(reviews.length)}`}
        </button>
      ) : null}
    </section>
  );
}

function ReviewCard({review}: {review: ProductReview}) {
  return (
    <li className="mb-0 flex flex-col rounded-[1.75rem] bg-[#effce9] p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <ReviewStars rating={review.rating} className="text-base" />
        <time
          dateTime={review.createdAt}
          className="text-xs font-semibold text-[#5c7060]"
        >
          {review.dateLabel}
        </time>
      </div>
      <span className="sr-only">Rated {review.rating} out of 5.</span>
      {review.title ? (
        <h3 className="mb-0 mt-4 font-heading text-lg font-extrabold leading-snug tracking-[-0.02em] text-[#004817]">
          {review.title}
        </h3>
      ) : null}
      <p
        className={cn(
          'whitespace-pre-line text-base leading-relaxed text-[#347345]',
          review.title ? 'mt-2' : 'mt-4',
        )}
      >
        {review.body}
      </p>
      <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-5 text-sm">
        <span className="font-heading font-extrabold text-[#004817]">
          {review.author}
        </span>
        {review.verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-heading text-[0.6875rem] font-bold uppercase leading-none tracking-[0.11em] text-[#00521d] ring-1 ring-[#ccefc8]">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-[#00752d]"
            />
            Verified buyer
          </span>
        ) : null}
      </p>
    </li>
  );
}

const FIELD =
  'm-0 block w-full rounded-2xl border border-[#cfe9c8] bg-white px-4 py-3 font-sans text-base text-[#004817] placeholder:text-[#8aa38f] focus-visible:border-[#00521d] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#00521d] aria-invalid:border-[#b42318]';
const LABEL = 'font-heading text-sm font-extrabold text-[#004817]';
const ERROR = 'mt-1.5 text-sm font-semibold text-[#b42318]';

function ReviewForm({
  productId,
  productTitle,
}: {
  productId: number;
  productTitle: string;
}) {
  const fetcher = useFetcher<ReviewActionResult>();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const id = useId();
  const result = fetcher.data;
  const errors = result && !result.ok ? result.errors ?? {} : {};
  const submitting = fetcher.state !== 'idle';

  // After a rejected submit, move focus to the first field that needs fixing,
  // so a keyboard or screen-reader user lands on the problem, not the button.
  useEffect(() => {
    if (!result || result.ok || !result.errors) return;
    const first = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"], fieldset[data-invalid] input',
    );
    first?.focus();
  }, [result]);

  if (result?.ok) {
    return (
      <div
        role="status"
        className="mt-6 rounded-[1.75rem] bg-[#effce9] p-6 text-[#004817]"
      >
        <p className="font-heading text-lg font-extrabold">
          Thank you! Your review is in.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-[#347345]">
          We read every review before it goes live, so it may take a little
          while to appear here.
        </p>
      </div>
    );
  }

  const shown = hover || rating;
  const describedBy = (field: string) =>
    errors[field as keyof typeof errors] ? `${id}-${field}-error` : undefined;

  return (
    <fetcher.Form
      ref={formRef}
      method="post"
      action="/api/reviews"
      noValidate
      className="mt-6 grid max-w-none gap-5 rounded-[1.75rem] bg-[#effce9] p-6 sm:grid-cols-2 sm:p-8"
    >
      <input type="hidden" name="productId" value={productId} />

      <fieldset
        className="m-0 block border-0 p-0 sm:col-span-2"
        aria-describedby={describedBy('rating')}
        data-invalid={errors.rating ? '' : undefined}
      >
        <legend className={cn(LABEL, 'mb-2 p-0')}>
          Your rating for {productTitle}
        </legend>
        <div
          className="flex gap-1 text-3xl"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              onMouseEnter={() => setHover(value)}
              className="cursor-pointer rounded-md has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#00521d]"
            >
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              <StarIcon
                className={cn(
                  'size-[1em] transition-colors motion-reduce:transition-none',
                  value <= shown ? 'text-[#df7a00]' : 'text-[#cfe9c8]',
                )}
              />
              <span className="sr-only">
                {value} {value === 1 ? 'star' : 'stars'}
              </span>
            </label>
          ))}
        </div>
        {errors.rating ? (
          <p id={`${id}-rating-error`} className={ERROR}>
            {errors.rating}
          </p>
        ) : null}
      </fieldset>

      <div>
        <label htmlFor={`${id}-name`} className={LABEL}>
          Name
        </label>
        <input
          id={`${id}-name`}
          name="name"
          autoComplete="name"
          maxLength={REVIEW_LIMITS.name}
          aria-invalid={Boolean(errors.name) || undefined}
          aria-describedby={describedBy('name')}
          className={cn(FIELD, 'mt-2')}
        />
        <p className="mt-1.5 text-xs text-[#5c7060]">
          Shown as first name and last initial.
        </p>
        {errors.name ? (
          <p id={`${id}-name-error`} className={ERROR}>
            {errors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${id}-email`} className={LABEL}>
          Email
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={REVIEW_LIMITS.email}
          aria-invalid={Boolean(errors.email) || undefined}
          aria-describedby={describedBy('email')}
          className={cn(FIELD, 'mt-2')}
        />
        <p className="mt-1.5 text-xs text-[#5c7060]">
          Never shown. Used to confirm you bought it.
        </p>
        {errors.email ? (
          <p id={`${id}-email-error`} className={ERROR}>
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={`${id}-title`} className={LABEL}>
          Title <span className="font-semibold text-[#5c7060]">(optional)</span>
        </label>
        <input
          id={`${id}-title`}
          name="title"
          maxLength={REVIEW_LIMITS.title}
          aria-invalid={Boolean(errors.title) || undefined}
          aria-describedby={describedBy('title')}
          className={cn(FIELD, 'mt-2')}
        />
        {errors.title ? (
          <p id={`${id}-title-error`} className={ERROR}>
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={`${id}-body`} className={LABEL}>
          Your review
        </label>
        <textarea
          id={`${id}-body`}
          name="body"
          rows={5}
          maxLength={REVIEW_LIMITS.body}
          aria-invalid={Boolean(errors.body) || undefined}
          aria-describedby={describedBy('body')}
          placeholder="How does it fit, feel and hold up?"
          className={cn(FIELD, 'mt-2 resize-y')}
        />
        {errors.body ? (
          <p id={`${id}-body-error`} className={ERROR}>
            {errors.body}
          </p>
        ) : null}
      </div>

      {/* Honeypot: off-screen and out of the tab order, so only bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input
          id={`${id}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3.5 font-heading text-sm font-extrabold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d] disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none"
        >
          {submitting ? 'Sending…' : 'Submit review'}
        </button>
        {result && !result.ok && result.error ? (
          <p role="alert" className="m-0 text-sm font-semibold text-[#b42318]">
            {result.error}
          </p>
        ) : null}
      </div>
    </fetcher.Form>
  );
}
