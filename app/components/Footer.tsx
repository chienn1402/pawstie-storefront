import {Suspense} from 'react';
import {Await, Link, NavLink} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {ArrowRightIcon, PawIcon} from '~/components/icons';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function Footer({
  footer: footerPromise,
  header,
  publicStoreDomain,
}: FooterProps) {
  return (
    <Suspense>
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer className="bg-[#003e15] px-6 pb-8 pt-14 text-white lg:px-[7vw] lg:pb-10 lg:pt-20">
            <div className="mx-auto max-w-[80rem]">
              <div className="grid gap-12 border-b border-white/20 pb-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:pb-20">
                <div>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-3 rounded-full text-white hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    aria-label={`${header.shop.name} home`}
                  >
                    <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
                      <PawIcon className="size-6" />
                    </span>
                    <span className="font-heading text-3xl font-semibold tracking-[-0.04em]">
                      {header.shop.name}
                    </span>
                  </Link>
                  <p className="mt-7 max-w-[16ch] font-heading text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#d9f7d5] lg:text-6xl">
                    Happier days start with a wag.
                  </p>
                </div>

                <Link
                  to="/collections/all"
                  className="group inline-flex min-h-14 w-fit items-center gap-5 rounded-full bg-white py-2 pl-7 pr-2 text-lg font-semibold text-[#00521d] transition-transform hover:scale-[1.02] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:justify-self-end"
                >
                  Shop all products
                  <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
                    <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </div>

              <div className="flex flex-col gap-8 pt-8 sm:flex-row sm:items-end sm:justify-between">
                {footer?.menu && header.shop.primaryDomain?.url ? (
                  <FooterMenu
                    menu={footer.menu}
                    primaryDomainUrl={header.shop.primaryDomain.url}
                    publicStoreDomain={publicStoreDomain}
                  />
                ) : null}
                <p className="text-sm text-[#a4e8aa]">
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
  menu,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  menu: FooterQuery['menu'];
  primaryDomainUrl: FooterProps['header']['shop']['primaryDomain']['url'];
  publicStoreDomain: string;
}) {
  return (
    <nav
      className="flex flex-wrap gap-x-6 gap-y-3 text-sm"
      aria-label="Policies"
    >
      {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
        if (!item.url) return null;
        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        const isExternal = !url.startsWith('/');
        return isExternal ? (
          <a
            className="text-white/80 transition-colors hover:text-white"
            href={url}
            key={item.id}
            rel="noopener noreferrer"
            target="_blank"
          >
            {item.title}
          </a>
        ) : (
          <NavLink
            className="text-white/80 transition-colors hover:text-white"
            end
            key={item.id}
            prefetch="intent"
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
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
