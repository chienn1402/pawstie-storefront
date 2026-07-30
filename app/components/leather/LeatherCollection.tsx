import {Link} from 'react-router';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import {ProductCard} from '~/components/ProductCard';
import {LEATHER_COLLECTION_ID} from '~/components/leather/anchors';

/**
 * The page's destination — every CTA above scrolls here. Deliberately reuses
 * the shop's `ProductCard` rather than a landing-page copy of it: the card
 * already carries quick-add, the personalization badge, sold-out state and the
 * shared view transition into the PDP, and a second implementation of all that
 * would drift the moment either one changed.
 */
export function LeatherCollection({
  products,
}: {
  products: readonly RecommendedProductFragment[];
}) {
  return (
    <section
      aria-labelledby="leather-collection-heading"
      className="-mx-4 w-[calc(100%+2rem)] scroll-mt-20 bg-[#faf4ec] px-6 py-20 lg:px-[7vw] lg:py-28"
      id={LEATHER_COLLECTION_ID}
    >
      <div className="mx-auto max-w-[80rem]">
        <div className="max-w-[46rem]">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-primary">
            The range
          </p>
          <h2
            id="leather-collection-heading"
            className="mb-0 mt-4 max-w-[14ch] font-heading text-4xl font-semibold leading-[0.92] tracking-[-0.055em] text-[#2e1c12] sm:text-5xl lg:text-6xl"
          >
            Every leather piece we make.
          </h2>
          <p className="mt-6 max-w-[32rem] text-lg leading-relaxed text-[#6b5340]">
            Pick a colour and a size on the product page — sizing charts are on
            each one.
          </p>
        </div>

        {products.length > 0 ? (
          // Flex rather than the shop's grid: the leather range is a handful of
          // products, and on a four-up grid an odd count strands the last card
          // alone against a column of empty page. Wrapping with `justify-center`
          // centres whatever the final row happens to hold, at any count. The
          // basis values mirror the column gaps exactly (2 cols share one gap,
          // 4 cols share three).
          <ul className="mt-12 flex flex-wrap justify-center gap-x-4 gap-y-10 sm:gap-x-6 lg:mt-16 lg:gap-x-8">
            {products.map((product, index) => (
              // `grid` so the card fills the item on both axes — the card's
              // action row uses `mt-auto` and needs the full row height to push
              // against, the same way a grid cell gave it one.
              <li
                key={product.id}
                className="mb-0 grid min-w-0 basis-[calc(50%-0.5rem)] sm:basis-[calc(50%-0.75rem)] lg:basis-[calc(25%-1.5rem)]"
              >
                <ProductCard
                  product={product}
                  loading={index < 4 ? 'eager' : 'lazy'}
                />
              </li>
            ))}
          </ul>
        ) : (
          // A paid click must never land on a dead page. If the search fails or
          // returns nothing, send the visitor somewhere that still sells.
          <div className="mt-12 rounded-[1.75rem] bg-[#f0e3d1] px-6 py-14 text-center">
            <h3 className="mb-0 font-heading text-2xl font-semibold text-[#2e1c12]">
              The leather range is restocking
            </h3>
            <p className="mt-3 text-[#6b5340]">
              Everything else is still on the shelf in the meantime.
            </p>
            <Link
              to="/shop"
              prefetch="intent"
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-[#2e1c12] px-7 font-heading text-sm font-semibold text-white! transition-colors hover:bg-[#43291a] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary"
            >
              Browse the shop
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
