import {Suspense} from 'react';
import {Await, Link, NavLink} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import logo from '~/assets/img-logo.png';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

type FooterLink = {id: string; title: string; url: string};

/** Structural shape shared by the Storefront header/footer menus and the fallback below. */
type MenuLike =
  | {items: Array<{id: string; title: string; url?: string | null}>}
  | null
  | undefined;

const linkClass =
  'text-sm font-medium text-[#c3edc0] underline-offset-4 transition-colors duration-300 ease-out hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a4e8aa] motion-reduce:transition-none';

export function Footer({
  footer: footerPromise,
  header,
  publicStoreDomain,
}: FooterProps) {
  const shopName = header.shop.name;
  const primaryDomainUrl = header.shop.primaryDomain?.url;

  return (
    <Suspense>
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer className="bg-[#003e15] px-6 pb-8 pt-14 text-white lg:px-[7vw] lg:pb-10 lg:pt-20">
            <div className="mx-auto max-w-[80rem]">
              <div className="grid grid-cols-2 gap-x-6 gap-y-12 pb-12 lg:grid-cols-[1.4fr_0.8fr_0.8fr] lg:gap-16 lg:pb-16">
                <div className="col-span-2 lg:col-span-1">
                  <Link
                    to="/"
                    prefetch="intent"
                    className="inline-flex items-center gap-2 rounded-full transition-transform duration-300 ease-out hover:no-underline motion-safe:hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a4e8aa] motion-reduce:transition-none"
                    aria-label={`${shopName} home`}
                  >
                    <img
                      src={logo}
                      alt=""
                      width="164"
                      height="179"
                      className="h-10 w-auto shrink-0 -rotate-20 scale-80 rounded-none!"
                    />
                    <span className="font-heading text-2xl font-normal tracking-[-0.04em] text-white">
                      {shopName}
                    </span>
                  </Link>
                  <p className="mt-6 max-w-[13ch] font-heading text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-balance text-[#d9f7d5] lg:text-5xl">
                    Happier days start with a wag.
                  </p>
                </div>

                <FooterMenu
                  heading="Explore"
                  links={exploreLinks(
                    header.menu,
                    primaryDomainUrl,
                    publicStoreDomain,
                  )}
                />
                <FooterMenu
                  heading="Support"
                  links={menuLinks(
                    footer?.menu ?? FALLBACK_FOOTER_MENU,
                    primaryDomainUrl,
                    publicStoreDomain,
                  )}
                />
              </div>

              <div className="flex flex-col gap-2 border-t border-white/15 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[#a4e8aa]">
                  © {new Date().getFullYear()} {shopName}. All rights reserved.
                </p>
                <p className="text-[#a4e8aa]">
                  Made for pets. Chosen by their people.
                </p>
              </div>
            </div>
          </footer>
        )}
      </Await>
    </Suspense>
  );
}

function FooterMenu({
  heading,
  links,
}: {
  heading: string;
  links: FooterLink[];
}) {
  if (!links.length) return null;

  return (
    <nav aria-label={heading}>
      <h2 className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-[#a4e8aa]">
        {heading}
      </h2>
      <ul className="mt-5 flex flex-col gap-3.5">
        {links.map(({id, title, url}) => (
          <li key={id}>
            {url.startsWith('/') ? (
              <NavLink className={linkClass} end prefetch="intent" to={url}>
                {title}
              </NavLink>
            ) : (
              <a
                className={linkClass}
                href={url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {title}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Shopify menu items keep their absolute URLs; strip the domain off our own. */
function menuLinks(
  menu: MenuLike,
  primaryDomainUrl: string | undefined,
  publicStoreDomain: string,
): FooterLink[] {
  return (menu?.items ?? []).flatMap((item) => {
    if (!item.url) return [];
    const isInternal =
      item.url.includes('myshopify.com') ||
      item.url.includes(publicStoreDomain) ||
      (!!primaryDomainUrl && item.url.includes(primaryDomainUrl));
    const url = isInternal ? new URL(item.url).pathname : item.url;
    return [{id: item.id, title: item.title, url}];
  });
}

/** The store nav, minus its own Home entry — we always lead with ours. */
function exploreLinks(
  menu: MenuLike,
  primaryDomainUrl: string | undefined,
  publicStoreDomain: string,
): FooterLink[] {
  const items = menuLinks(menu, primaryDomainUrl, publicStoreDomain).filter(
    ({title, url}) => url !== '/' && title.trim().toLowerCase() !== 'home',
  );

  return [
    {id: 'footer-home', title: 'Home', url: '/'},
    ...items,
  ];
}

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633060920',
      resourceId: 'gid://shopify/ShopPolicy/23358046264',
      tags: [],
      title: 'Privacy Policy',
      type: 'SHOP_POLICY',
      url: '/policies/privacy-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633093688',
      resourceId: 'gid://shopify/ShopPolicy/23358013496',
      tags: [],
      title: 'Refund Policy',
      type: 'SHOP_POLICY',
      url: '/policies/refund-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633126456',
      resourceId: 'gid://shopify/ShopPolicy/23358111800',
      tags: [],
      title: 'Shipping Policy',
      type: 'SHOP_POLICY',
      url: '/policies/shipping-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: 'gid://shopify/ShopPolicy/23358079032',
      tags: [],
      title: 'Terms of Service',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service',
      items: [],
    },
  ],
};
