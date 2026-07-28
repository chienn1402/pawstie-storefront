/**
 * Shopify's `description` is the product body with markup stripped, so it
 * arrives as hundreds of characters of spec sheet complete with the newlines
 * from the original layout. Google renders roughly the first 155 and treats a
 * raw wall of text as a weak summary, so trim to something that reads like a
 * sentence rather than letting the whole body through.
 *
 * Cuts on a word boundary and trims trailing punctuation so the ellipsis never
 * lands mid-word or after a stray comma.
 */
export function metaDescription(
  value: string | null | undefined,
  maxLength = 155,
) {
  const collapsed = value?.replace(/\s+/g, ' ').trim() ?? '';

  if (collapsed.length <= maxLength) return collapsed;

  // Reserve one character for the ellipsis so the result fits maxLength.
  const clipped = collapsed.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(' ');
  const head = lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped;

  return `${head.replace(/[\s.,;:!?-]+$/, '')}…`;
}
