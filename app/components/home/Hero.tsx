import {Link} from 'react-router';
import goldenRetriever from '~/assets/img-golden-retriever.png';
import dachshund from '~/assets/img-dachshund.png';
import cat from '~/assets/img-cat.png';
import {ArrowRightIcon, PawIcon, PlusIcon, StarIcon} from '~/components/icons';

const CTA_HREF = '/shop';
const HERO_IMAGE_PRIORITY = {fetchpriority: 'high'} as const;

function ClientsStat() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-4">
        <strong className="font-heading text-5xl font-semibold tracking-[-0.06em] text-[#064a1c] lg:text-6xl">
          98K+
        </strong>
        <span className="flex items-center" aria-hidden="true">
          <span className="grid size-11 place-items-center rounded-full bg-white text-primary ring-2 ring-[#a4e8aa]">
            <PawIcon className="size-5" />
          </span>
          <span className="-ml-2 grid size-12 place-items-center rounded-full bg-[#00521d] text-white ring-2 ring-[#a4e8aa]">
            <PlusIcon className="size-5" />
          </span>
        </span>
      </div>
      <p className="mt-5 max-w-[19rem] text-lg leading-[1.3] text-[#347345] lg:text-xl">
        Happy Clients and Their Pets Who Love Our Products
      </p>
    </div>
  );
}

function RatingStat() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-3">
        <strong className="font-heading text-5xl font-semibold tracking-[-0.06em] text-[#064a1c] lg:text-6xl">
          4.6
        </strong>
        <StarIcon className="size-11 text-primary" />
      </div>
      <p className="mt-5 max-w-[22rem] text-lg leading-[1.3] text-[#347345] lg:text-xl">
        Based on Reviews from Happy Pet Owners Worldwide
      </p>
    </div>
  );
}

function CtaContent() {
  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="m-0! font-heading text-3xl! font-normal! leading-[1.05] text-white lg:text-[2.15rem]!">
        Best Products
        <br />
        for Your Pet
      </h2>
      <Link
        to={CTA_HREF}
        className="group mt-7 inline-flex min-h-14 items-center gap-5 rounded-full bg-primary py-2 pl-7 pr-2 text-lg font-semibold text-white! shadow-[0_12px_28px_-10px_rgba(169,83,14,0.5)] transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#8f440b] hover:no-underline! hover:shadow-[0_20px_38px_-12px_rgba(169,83,14,0.65)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        Explore Products
        <span className="relative grid size-11 place-items-center overflow-hidden rounded-full bg-white text-primary">
          <ArrowRightIcon className="size-5 transition-transform duration-300 motion-safe:group-hover:translate-x-[220%]" />
          <ArrowRightIcon className="absolute size-5 -translate-x-[220%] transition-transform duration-300 motion-safe:group-hover:translate-x-0" />
        </span>
      </Link>
    </div>
  );
}

function HeroMobile() {
  return (
    <div className="lg:hidden">
      <div className="relative min-h-[max(100svh,48rem)] overflow-hidden">
        <h1 className="absolute inset-x-4 top-48 z-10 m-0! text-center font-heading text-[clamp(2.75rem,14vw,5.25rem)]! font-normal! leading-none! tracking-[-0.07em] text-[#004817]">
          Everything
          <br />
          Your Pets Love
        </h1>
        <img
          src={goldenRetriever}
          alt=""
          width="1531"
          height="1399"
          {...HERO_IMAGE_PRIORITY}
          className="pointer-events-none absolute left-1/2 top-[calc(100%-15rem)] z-30 w-[112%] max-w-[39rem] -translate-x-1/2 -translate-y-[75.4%] rounded-none! drop-shadow-[0_22px_18px_rgba(1,51,18,.2)]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[calc(100%-15rem)] z-40 h-1 w-[56%] max-w-[19.5rem] -translate-x-1/2 -translate-y-[2px] bg-[#00521d]"
        />
        <div className="absolute inset-x-0 bottom-0 z-20 h-60 bg-[#00521d] px-6">
          <div className="grid h-full place-items-center">
            <CtaContent />
          </div>
        </div>
      </div>

      <div className="relative h-[33rem] overflow-hidden bg-[#effce9]">
        <img
          src={dachshund}
          alt=""
          width="1823"
          height="942"
          loading="lazy"
          className="pointer-events-none absolute left-1/2 top-[calc(100%-15rem)] z-20 w-[94%] max-w-[34rem] -translate-x-1/2 -translate-y-[87%] rounded-none! drop-shadow-[0_18px_12px_rgba(1,51,18,.18)]"
        />
        <div className="absolute inset-x-0 bottom-0 grid h-60 place-items-center bg-[#a4e8aa] px-8">
          <ClientsStat />
        </div>
      </div>

      <div className="relative h-[33rem] overflow-hidden bg-[#effce9]">
        <img
          src={cat}
          alt=""
          width="1773"
          height="1316"
          loading="lazy"
          className="pointer-events-none absolute left-1/2 top-[calc(100%-15rem)] z-20 w-[90%] max-w-[32rem] -translate-x-1/2 -translate-y-[83.4%] rounded-none! drop-shadow-[0_18px_12px_rgba(1,51,18,.18)]"
        />
        <div className="absolute inset-x-0 bottom-0 grid h-60 place-items-center bg-[#a4e8aa] px-8">
          <RatingStat />
        </div>
      </div>
    </div>
  );
}

function HeroDesktop() {
  return (
    <div className="relative hidden h-[100svh] min-h-[56rem] overflow-hidden [--hero-panel-height:clamp(15rem,25vh,20rem)] lg:block">
      <h1 className="absolute inset-x-0 top-[clamp(6.5rem,15vh,9.5rem)] z-10 m-0! text-center font-heading text-[clamp(6.7rem,min(8.25vw,12.5vh),9.6rem)]! font-normal! leading-none! tracking-[-0.07em] text-[#004817]">
        Everything
        <br />
        Your Pets Love
      </h1>

      <div className="absolute bottom-0 left-0 z-10 h-[var(--hero-panel-height)] w-[30.5%] bg-[#a4e8aa] px-10 pb-10">
        <div className="flex h-full items-end justify-center">
          <ClientsStat />
        </div>
      </div>
      <div className="absolute bottom-0 left-[30.5%] right-[30.5%] z-20 h-[var(--hero-panel-height)] bg-[#00521d] px-8 pb-8">
        <div className="flex h-full items-end justify-center">
          <CtaContent />
        </div>
      </div>
      <div className="absolute bottom-0 right-0 z-10 h-[var(--hero-panel-height)] w-[30.5%] bg-[#a4e8aa] px-10 pb-10">
        <div className="flex h-full items-end justify-center">
          <RatingStat />
        </div>
      </div>

      <img
        src={dachshund}
        alt=""
        width="1823"
        height="942"
        className="pointer-events-none absolute left-[15.25%] top-[calc(100%-var(--hero-panel-height))] z-30 w-[min(29vw,42vh)] max-w-none -translate-x-1/2 -translate-y-[87%] rounded-none! drop-shadow-[0_18px_12px_rgba(1,51,18,.18)]"
      />
      <img
        src={goldenRetriever}
        alt=""
        width="1531"
        height="1399"
        {...HERO_IMAGE_PRIORITY}
        className="pointer-events-none absolute left-1/2 top-[calc(100%-var(--hero-panel-height))] z-40 w-[min(40vw,54vh)] max-w-[48rem] -translate-x-1/2 -translate-y-[75.4%] rounded-none! drop-shadow-[0_22px_18px_rgba(1,51,18,.2)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[calc(100%-var(--hero-panel-height))] z-50 h-1 w-[min(20vw,27vh)] -translate-x-1/2 -translate-y-[2px] bg-[#00521d]"
      />
      <img
        src={cat}
        alt=""
        width="1773"
        height="1316"
        className="pointer-events-none absolute left-[84.75%] top-[calc(100%-var(--hero-panel-height))] z-30 w-[min(27vw,40vh)] max-w-none -translate-x-1/2 -translate-y-[83.4%] rounded-none! drop-shadow-[0_18px_12px_rgba(1,51,18,.18)]"
      />
    </div>
  );
}

export function Hero() {
  return (
    <section className="isolate -mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#effce9] p-0!">
      <HeroMobile />
      <HeroDesktop />
    </section>
  );
}
