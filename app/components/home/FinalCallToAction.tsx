import {Link} from 'react-router';
import ctaPets from '~/assets/cta-pets.jpg';
import {ArrowRightIcon} from '~/components/icons';

export function FinalCallToAction() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="-mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#effce9] px-6! pb-20! pt-20! lg:px-[7vw]! lg:pb-28! lg:pt-28!"
    >
      <div className="mx-auto grid max-w-[80rem] items-center gap-12 lg:grid-cols-[minmax(18rem,27rem)_1fr] lg:gap-20">
        {/* The light counterpart of the deep-green stage in Shop By Routine:
            same photo panel and corner badge, no frame around it. */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[#a4e8aa] lg:rounded-[2.75rem]">
          <img
            src={ctaPets}
            alt="A tabby cat and a cream-coloured dog sitting together in a meadow of daisies."
            width="1000"
            height="1250"
            loading="lazy"
            decoding="async"
            className="aspect-[4/5] size-full rounded-none! object-cover"
          />
          <span className="absolute bottom-5 left-5 rounded-full bg-white px-5 py-3 font-heading text-base font-semibold text-[#00521d] shadow-sm lg:bottom-6 lg:left-6 lg:text-lg">
            Even the cat approves
          </span>
        </div>

        <div className="min-w-0">
          <p className="font-heading text-sm! font-bold uppercase tracking-[0.16em] text-[#347345]">
            The whole collection
          </p>
          <h2
            id="final-cta-heading"
            className="mb-0! mt-4! max-w-[13ch] font-heading text-5xl! font-semibold! leading-[0.9]! tracking-[-0.065em] text-[#004817] sm:text-6xl! lg:text-7xl!"
          >
            Their next favorite thing is waiting.
          </h2>
          <p className="mt-8! max-w-[31rem] text-lg! leading-relaxed! text-[#347345]">
            Browse every toy, cozy corner, and everyday essential in the Pawstie
            collection.
          </p>
          <Link
            to="/collections/all"
            className="group mt-10 inline-flex min-h-16 items-center gap-5 rounded-full bg-primary py-2 pl-8 pr-2 font-heading text-lg font-semibold text-white! shadow-[0_12px_28px_-10px_rgba(169,83,14,0.5)] transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#8f440b] hover:no-underline! hover:shadow-[0_20px_38px_-12px_rgba(169,83,14,0.65)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00521d] motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:text-xl"
          >
            Shop all products
            <span className="relative grid size-12 place-items-center overflow-hidden rounded-full bg-white text-primary">
              <ArrowRightIcon className="size-5 transition-transform duration-300 motion-safe:group-hover:translate-x-[220%]" />
              <ArrowRightIcon className="absolute size-5 -translate-x-[220%] transition-transform duration-300 motion-safe:group-hover:translate-x-0" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
