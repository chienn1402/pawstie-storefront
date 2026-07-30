import {useMatches} from 'react-router';

/**
 * Route opt-out from the store's full header and footer.
 *
 * Paid landing pages under `/lp/*` are bought a click at a time, and the store
 * nav is a row of exits away from the thing the click was for — the shop's
 * header and footer between them offer fifteen, with Home, Shop, Blog and About
 * each appearing twice. A route sets `handle = LANDING_CHROME` and `PageLayout`
 * swaps in a logo-only header and a policy-only footer instead.
 *
 * Keyed off a route handle rather than a `/lp/` path test so the decision lives
 * in the route that made it, and so a landing page that ever needs the full
 * chrome back can simply not export it.
 */
export const LANDING_CHROME = {chrome: 'minimal'} as const;

export function useMinimalChrome() {
  const matches = useMatches();

  return matches.some(
    (match) =>
      (match.handle as {chrome?: string} | undefined)?.chrome === 'minimal',
  );
}
