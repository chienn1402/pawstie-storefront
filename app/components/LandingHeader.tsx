import type {HeaderQuery} from 'storefrontapi.generated';
import logo from '~/assets/img-logo.png';

/**
 * The header for paid landing pages: the brand mark and nothing else.
 *
 * The wordmark is deliberately **not** a link. On a page bought by the click,
 * a logo that goes to the homepage is just the most-clicked exit on the screen;
 * here it does the one job a logo has to do, which is tell the visitor whose
 * shop they landed in. Cart access is unaffected — `CartFab` still floats in
 * once there is a line in the cart, and checkout runs from there.
 *
 * Colours are the leather page's, which is the only landing page so far. Give
 * this a tone prop when a second one arrives on a different palette rather than
 * guessing at the parameterisation now.
 */
export function LandingHeader({shopName}: {shopName: HeaderQuery['shop']['name']}) {
  return (
    <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-center px-6 pt-6 lg:justify-start lg:px-[7vw] lg:pt-8">
      <p className="mb-0 flex items-center gap-2">
        <img
          src={logo}
          alt=""
          width="765"
          height="816"
          className="h-8 w-auto shrink-0 scale-80 rounded-none! lg:h-9"
        />
        <span className="font-heading text-xl font-normal tracking-[-0.04em] text-[#faf4ec] lg:text-2xl">
          {shopName}
        </span>
      </p>
    </header>
  );
}
