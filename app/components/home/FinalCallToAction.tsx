import {Link} from 'react-router';
import cat from '~/assets/img-cat.png';
import {ArrowRightIcon, PawIcon} from '~/components/icons';

export function FinalCallToAction() {
  return (
    <section className="-mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#effce9] px-6! pb-20! pt-20! lg:px-[7vw]! lg:pb-28! lg:pt-28!">
      <div className="mx-auto grid max-w-[80rem] items-center gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="relative min-h-[24rem] overflow-hidden rounded-[2rem] bg-[#a4e8aa] lg:min-h-[32rem] lg:rounded-[2.75rem]">
          <span
            aria-hidden="true"
            className="absolute -left-16 -top-20 size-64 rounded-full border-[3rem] border-white/50"
          />
          <img
            src={cat}
            alt=""
            width="1773"
            height="1316"
            loading="lazy"
            className="pointer-events-none absolute -bottom-6 left-1/2 w-[95%] max-w-[38rem] -translate-x-1/2 rounded-none! drop-shadow-[0_24px_16px_rgba(1,51,18,.18)]"
          />
          <span className="absolute bottom-5 left-5 rounded-full bg-white px-4 py-2 font-heading text-sm font-bold text-[#00521d] shadow-sm lg:bottom-7 lg:left-7">
            Cat-approved comfort
          </span>
        </div>

        <div className="px-1 py-8 lg:pl-14">
          <span className="grid size-12 place-items-center rounded-full bg-white text-primary ring-2 ring-[#a4e8aa]">
            <PawIcon className="size-5" />
          </span>
          <h2 className="mb-0! mt-6! max-w-[11ch] font-heading text-5xl! font-semibold! leading-[0.92]! tracking-[-0.065em] text-[#004817] lg:text-7xl!">
            Their next favorite thing is waiting.
          </h2>
          <p className="mt-6 max-w-[33rem] text-lg leading-relaxed text-[#347345] lg:text-xl">
            Browse every toy, cozy corner, and everyday essential in the Pawstie
            collection.
          </p>
          <Link
            to="/collections/all"
            className="mt-8 inline-flex min-h-14 items-center gap-5 rounded-full bg-primary py-2 pl-7 pr-2 text-lg font-semibold text-primary-foreground transition-transform hover:scale-[1.02] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d]"
          >
            Shop all products
            <span className="grid size-11 place-items-center rounded-full bg-[#effce9] text-primary">
              <ArrowRightIcon className="size-5" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
