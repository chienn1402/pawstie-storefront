import {Link} from 'react-router';
import goldenRetriever from '~/assets/img-golden-retriever.png';
import dachshund from '~/assets/img-dachshund.png';
import cat from '~/assets/img-cat.png';
import {
  ArrowRightIcon,
  PawIcon,
  PlusIcon,
  StarIcon,
} from '~/components/icons';

const CTA_HREF = '/collections/all';

function ClientsStat() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="font-heading text-4xl font-extrabold text-[#1c4a25] lg:text-5xl">
          98K+
        </span>
        <span className="flex items-center">
          <span className="grid size-10 place-items-center rounded-full bg-white text-primary ring-2 ring-white">
            <PawIcon className="size-5" />
          </span>
          <span className="-ml-3 grid size-10 place-items-center rounded-full bg-[#14421e] text-white ring-2 ring-[#a6dd9d]">
            <PlusIcon className="size-4" />
          </span>
        </span>
      </div>
      <p className="mt-3 max-w-[16rem] font-medium text-[#3f7a48]">
        Happy Clients and Their Pets Who Love Our Products
      </p>
    </div>
  );
}

function RatingStat() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-heading text-4xl font-extrabold text-[#1c4a25] lg:text-5xl">
          4.6
        </span>
        <StarIcon className="size-8 text-primary" />
      </div>
      <p className="mt-3 max-w-[16rem] font-medium text-[#3f7a48]">
        Based on Reviews from Happy Pet Owners Worldwide
      </p>
    </div>
  );
}

function CtaContent() {
  return (
    <div>
      <h2 className="font-heading text-2xl! font-bold leading-tight text-white lg:text-3xl!">
        Best Products
        <br />
        for Your Pet
      </h2>
      <Link
        to={CTA_HREF}
        className="mt-5 inline-flex items-center gap-3 rounded-full bg-primary py-2 pl-6 pr-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Explore Products
        <span className="grid size-9 place-items-center rounded-full bg-white text-primary">
          <ArrowRightIcon className="size-4" />
        </span>
      </Link>
    </div>
  );
}

function HeroMobile() {
  return (
    <div className="lg:hidden">
      {/* Block 1 — Golden retriever */}
      <div>
        <h1 className="text-center font-heading text-4xl! font-extrabold leading-[0.95] tracking-tight text-[#1c4a25] sm:text-5xl!">
          Everything
          <br />
          Your Pets Love
        </h1>
        <img
          src={goldenRetriever}
          alt=""
          className="relative z-10 mx-auto -mb-8 w-4/5 max-w-sm"
        />
        <div className="flex flex-col items-center rounded-[2rem] bg-[#14421e] px-6 pb-8 pt-12 text-center">
          <CtaContent />
        </div>
      </div>

      {/* Block 2 — Dachshund */}
      <div className="mt-10">
        <img
          src={dachshund}
          alt=""
          className="relative z-10 mx-auto -mb-8 w-4/5 max-w-sm"
        />
        <div className="rounded-[2rem] bg-[#a6dd9d] px-6 pb-8 pt-12">
          <ClientsStat />
        </div>
      </div>

      {/* Block 3 — Cat */}
      <div className="mt-10">
        <img
          src={cat}
          alt=""
          className="relative z-10 mx-auto -mb-8 w-3/5 max-w-[15rem]"
        />
        <div className="rounded-[2rem] bg-[#a6dd9d] px-6 pb-8 pt-12">
          <RatingStat />
        </div>
      </div>
    </div>
  );
}

function HeroDesktop() {
  return (
    <div className="hidden lg:block">
      <h1 className="text-center font-heading text-[6.5rem]! font-extrabold leading-[0.9] tracking-tight text-[#1c4a25] xl:text-[8rem]!">
        Everything
        <br />
        Your Pets Love
      </h1>

      {/* Band + animals. Animals are anchored to the band's top edge so they
          stay put when the headline grows at the xl breakpoint. The tall top
          margin opens up the mint area the animals peek up into. */}
      <div className="relative mt-40 xl:mt-48">
        <div className="grid grid-cols-3 gap-5">
          <div className="flex min-h-[25rem] flex-col justify-end rounded-[2rem] bg-[#a6dd9d] px-8 pb-10">
            <ClientsStat />
          </div>
          <div className="flex min-h-[25rem] flex-col items-center justify-end rounded-[2rem] bg-[#14421e] px-8 pb-10 text-center">
            <CtaContent />
          </div>
          <div className="flex min-h-[25rem] flex-col items-end justify-end rounded-[2rem] bg-[#a6dd9d] px-8 pb-10 text-right">
            <RatingStat />
          </div>
        </div>

        {/* Animals peeking over the top edge of the band. Each is centered
            over its panel and capped with max-w so it doesn't overgrow (and
            cover the CTA text) on ultra-wide screens. */}
        <img
          src={dachshund}
          alt=""
          className="pointer-events-none absolute -top-28 left-[16.5%] z-10 w-[26%] max-w-[22rem] -translate-x-1/2"
        />
        <img
          src={goldenRetriever}
          alt=""
          className="pointer-events-none absolute -top-52 left-1/2 z-20 w-[36%] max-w-[30rem] -translate-x-1/2"
        />
        <img
          src={cat}
          alt=""
          className="pointer-events-none absolute -top-24 left-[83.5%] z-10 w-[24%] max-w-[20rem] -translate-x-1/2"
        />
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="bg-[#14421e] p-3 sm:p-4 lg:p-6">
      <div className="overflow-hidden rounded-[2.5rem] bg-[#e9f6e1] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <HeroMobile />
        <HeroDesktop />
      </div>
    </section>
  );
}
