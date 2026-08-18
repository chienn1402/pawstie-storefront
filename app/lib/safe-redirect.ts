/**
 * Constrains a caller-supplied redirect target to this origin.
 *
 * The market switcher posts the page it was used on so the shopper lands back
 * where they were. That value arrives in a form field, which makes it attacker
 * controlled, so it is treated as a path and never as a URL.
 *
 * Kept free of imports so `scripts/market-detection.test.mjs` can load it
 * through Node's native type stripping and test the real function.
 */
export function safeRedirect(
  value: unknown,
  fallback = '/',
): string {
  if (typeof value !== 'string') return fallback;

  const target = value.trim();
  if (!target.startsWith('/')) return fallback;

  // `//evil.com` and `/\evil.com` are both protocol-relative to a browser, so
  // they leave the origin despite the leading slash.
  if (target.startsWith('//') || target.startsWith('/\\')) return fallback;

  // A newline or other control character can split the Location header.
  // Those characters are the point of the check, hence the disable.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(target)) return fallback;

  return target;
}
