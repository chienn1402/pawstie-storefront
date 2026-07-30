import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {ArrowRightIcon} from '~/components/icons';
import {AIRTAG_CHOOSER_ID} from '~/components/airtag/anchors';

/**
 * Neck ranges straight from the product's own sizing guide, so the landing page
 * and the PDP can't disagree about what fits. Kept as data rather than prose
 * because a range is the one thing a buyer scans for and a sentence buries.
 */
const SIZES: ReadonlyArray<{
  size: string;
  neckCm: string;
  neckIn: string;
  width: string;
}> = [
  {size: 'Small', neckCm: '26.5 – 36 cm', neckIn: '10.4" – 14.1"', width: '2.5 cm'},
  {size: 'Medium', neckCm: '31 – 45 cm', neckIn: '12.2" – 17.7"', width: '3.0 cm'},
  {size: 'Large', neckCm: '41.5 – 55 cm', neckIn: '16.3" – 21.7"', width: '3.0 cm'},
];

const COLOURS = ['Black', 'Orange', 'Army green'] as const;

/**
 * Where the page asks for the decision. The CTA hands off to the PDP rather
 * than selecting a variant here: nine variants across two option axes is
 * exactly the logic `ProductForm` already owns, and a second copy of it on a
 * landing page would drift the first time either changed.
 */
export function AirtagChooser({
  handle,
  colourImage,
  colourImageAlt,
}: {
  handle: string;
  colourImage?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  colourImageAlt: string;
}) {
  return (
    <section
      id={AIRTAG_CHOOSER_ID}
      aria-labelledby="airtag-chooser-heading"
      // Cream, because the spotlight above it is sand — two adjacent sections
      // in the same tone read as one undifferentiated block.
      className="-mx-4 w-[calc(100%+2rem)] scroll-mt-20 bg-[#faf4ec] px-6 py-20 lg:px-[7vw] lg:py-28"
    >
      <div className="mx-auto max-w-[80rem]">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {colourImage ? (
            <div className="mx-auto w-full min-w-0 max-w-[26rem] lg:mx-0 lg:max-w-none">
              <div className="overflow-hidden rounded-[1.75rem] bg-[#e6d6c0] lg:rounded-[2.25rem]">
                <Image
                  alt={colourImageAlt}
                  aspectRatio="1/1"
                  data={colourImage}
                  loading="lazy"
                  sizes="(min-width: 64em) 40vw, min(100vw - 3rem, 26rem)"
                  className="size-full rounded-none! object-cover"
                />
              </div>
            </div>
          ) : null}

          <div className="min-w-0">
            <p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-primary">
              Colours and sizes
            </p>
            <h2
              id="airtag-chooser-heading"
              className="mb-0 mt-4 max-w-[14ch] font-heading text-4xl font-semibold leading-[0.94] tracking-[-0.05em] text-[#2e1c12] sm:text-5xl"
            >
              Three colours. Three sizes.
            </h2>

            <ul className="mt-7 flex flex-wrap gap-2.5">
              {COLOURS.map((colour) => (
                <li
                  key={colour}
                  className="mb-0 rounded-full bg-white px-4 py-2 font-heading text-sm font-semibold text-[#5b4636] ring-1 ring-[#e0cbae]"
                >
                  {colour}
                </li>
              ))}
            </ul>

            <p className="mt-7 max-w-[34rem] leading-relaxed text-[#6b5340]">
              Measure around the base of the neck and leave two fingers of slack
              under the tape. Between two sizes, take the larger — the leather
              gives as it breaks in, the hardware doesn&rsquo;t.
            </p>

            {/* Wide content scrolls inside its own container so the page body
                never scrolls sideways on a phone. */}
            <div className="mt-7 overflow-x-auto">
              <table className="w-full min-w-[22rem] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Neck range and strap width by collar size
                </caption>
                <thead>
                  <tr className="border-b border-[#d9c3a4]">
                    <th scope="col" className="py-3 pr-4 font-heading font-bold text-[#2e1c12]">
                      Size
                    </th>
                    <th scope="col" className="py-3 pr-4 font-heading font-bold text-[#2e1c12]">
                      Neck
                    </th>
                    <th scope="col" className="py-3 font-heading font-bold text-[#2e1c12]">
                      Strap width
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SIZES.map(({size, neckCm, neckIn, width}) => (
                    <tr key={size} className="border-b border-[#e0cbae]">
                      <th
                        scope="row"
                        className="py-3.5 pr-4 font-heading font-semibold text-[#2e1c12]"
                      >
                        {size}
                      </th>
                      <td className="py-3.5 pr-4 text-[#6b5340]">
                        {neckCm}
                        <span className="block text-[#8a705a]">{neckIn}</span>
                      </td>
                      <td className="py-3.5 text-[#6b5340]">{width}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Link
              to={`/products/${handle}`}
              prefetch="intent"
              className="group mt-9 inline-flex min-h-14 items-center gap-4 rounded-full bg-[#2e1c12] py-2 pl-7 pr-2 font-heading text-base font-semibold text-white no-underline! transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#43291a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              Choose yours
              <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-white">
                <ArrowRightIcon className="size-5 transition-transform duration-300 motion-safe:group-hover:translate-x-[220%]" />
                <ArrowRightIcon className="absolute size-5 -translate-x-[220%] transition-transform duration-300 motion-safe:group-hover:translate-x-0" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
