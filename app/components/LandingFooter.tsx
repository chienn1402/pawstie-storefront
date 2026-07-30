import {Suspense} from 'react';
import {Await, NavLink} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {
  FALLBACK_FOOTER_MENU,
  menuLinks,
  type FooterLink,
} from '~/components/Footer';

interface LandingFooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

/**
 * The footer for paid landing pages: store policies, and nothing to browse.
 *
 * It is trimmed rather than removed, and that distinction matters — Meta and
 * TikTok both expect refund, privacy, terms and contact details to be reachable
 * from the page an ad points at, so deleting the footer outright is a way to
 * get ads rejected. What it drops is the *navigation*: no Explore column, no
 * Home/Shop/Blog/About, no second copy of the store menu. Those are the exits.
 *
 * Palette matches the leather page, which is the only landing page so far — see
 * the note in `LandingHeader`.
 */
export function LandingFooter({
  footer: footerPromise,
  header,
  publicStoreDomain,
}: LandingFooterProps) {
  const shopName = header.shop.name;
  const primaryDomainUrl = header.shop.primaryDomain?.url;

  return (
    <Suspense fallback={<LandingFooterShell shopName={shopName} links={[]} />}>
      <Await
        resolve={footerPromise}
        // The policy links failing to load must not take the page down; the
        // legal line still renders without them.
        errorElement={<LandingFooterShell shopName={shopName} links={[]} />}
      >
        {(footer) => (
          <LandingFooterShell
            shopName={shopName}
            links={menuLinks(
              footer?.menu ?? FALLBACK_FOOTER_MENU,
              primaryDomainUrl,
              publicStoreDomain,
            )}
          />
        )}
      </Await>
    </Suspense>
  );
}

function LandingFooterShell({
  shopName,
  links,
}: {
  shopName: string;
  links: FooterLink[];
}) {
  return (
    <footer className="bg-[#1c110b] px-6 py-10 lg:px-[7vw]">
      <div className="mx-auto flex max-w-[80rem] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="mb-0 order-2 text-sm text-[#9a7c60] sm:order-1">
          © {new Date().getFullYear()} {shopName}. All rights reserved.
        </p>

        {links.length > 0 ? (
          <nav aria-label="Store policies" className="order-1 sm:order-2">
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {links.map(({id, title, url}) => (
                <li key={id} className="mb-0">
                  <NavLink
                    to={url}
                    prefetch="intent"
                    className="text-sm text-[#cbae90] underline-offset-4 transition-colors hover:text-[#faf4ec] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e0a668] motion-reduce:transition-none"
                  >
                    {title}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </footer>
  );
}
