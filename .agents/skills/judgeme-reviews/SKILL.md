---
name: judgeme-reviews
description: Design of Pawstie's server-side Judge.me product reviews (reviews.server.ts caching, toProductReview sanitizing, ProductReviews UI, /api/reviews form). Use before changing anything about product reviews, ratings, or review structured data.
---

# Product reviews (Judge.me)

Reviews come from Judge.me and are read **server-side**: there's no Judge.me widget script and no CSP change. The whole feature is gated on the `PRIVATE_JUDGEME_API_TOKEN` Oxygen secret. Without it, product pages render with no review UI and `/api/reviews` returns 404.

- `app/lib/reviews.server.ts` (`context.reviews`, wired in `app/lib/context.ts`) fetches every store review in one store-wide `withCache` entry (10 min fresh, 1 day stale-while-revalidate) and filters by Shopify product id. Judge.me's raw `/reviews` endpoint only filters by its own product id, so per-product requests aren't possible without an extra lookup.
- Judge.me's raw API returns **unpublished reviews, emails, IPs and unsanitized text**. `toProductReview()` in `app/lib/reviews.ts` is the only door to the page: it keeps only `curated: "ok"` and non-hidden reviews, and shortens names to "First L.". React renders the text as text. Don't add `dangerouslySetInnerHTML` to review content, and don't cache or return raw review objects.
- The product page awaits reviews in `loadCriticalData`, because the stars sit under the title. A Judge.me failure or timeout (2.5s) resolves `null`, which only hides the section.
- `ProductReviews.tsx`: the summary under the H1 and the section after the info tabs. With zero reviews it shows only a "Have this one already?" prompt, never "0 reviews". A link ending in `#write-review` opens the form. The form posts to `/api/reviews`, which validates it, checks a honeypot field, and creates a Judge.me web review that waits in Judge.me's moderation queue.
- Review photos aren't shown yet, because their image host would need a CSP `imgSrc` entry. `productJsonLd()` still omits `aggregateRating`. Add it from real review data, never from a hardcoded number.
