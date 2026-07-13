import {Link} from 'react-router';
import dachshund from '~/assets/img-dachshund.png';
import {ArrowRightIcon} from '~/components/icons';

const ROUTINES = [
  {label: 'Walk', query: 'walk'},
  {label: 'Play', query: 'toy'},
  {label: 'Snooze', query: 'bed'},
  {label: 'Treat', query: 'treat'},
] as const;

export function ShopByRoutine() {
  return (
    <section
      aria-labelledby="shop-routine-heading"
      className="-mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#a4e8aa] px-4! py-4! lg:px-6! lg:py-6!"
    >
      <div className="relative mx-auto min-h-[52rem] max-w-[92rem] overflow-hidden rounded-[2.25rem] bg-[#00521d] px-6 py-14 sm:min-h-[49rem] lg:min-h-[43rem] lg:rounded-[3rem] lg:px-[6vw] lg:py-20">
        <div className="relative z-20 max-w-2xl">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-[#a4e8aa]">
            Shop their routine
          </p>
          <h2
            id="shop-routine-heading"
            className="mb-0! mt-4! max-w-[12ch] font-heading text-5xl! font-semibold! leading-[0.9]! tracking-[-0.065em] text-white sm:text-6xl! lg:text-7xl!"
          >
            Built around their favorite words.
          </h2>
        </div>

        <nav
          aria-label="Shop by pet routine"
          className="relative z-30 mt-10 grid max-w-[39rem] grid-cols-2 gap-3 sm:grid-cols-4 lg:mt-14"
        >
          {ROUTINES.map((routine) => (
            <Link
              key={routine.label}
              to={`/search?q=${routine.query}`}
              className="group flex min-h-24 flex-col justify-between rounded-3xl border border-white/20 bg-white/10 p-4 font-heading text-lg font-semibold text-white transition-[background-color,transform] hover:-translate-y-1 hover:bg-white hover:text-[#00521d] hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <span>{routine.label}</span>
              <ArrowRightIcon className="size-5 self-end transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </nav>

        <p className="relative z-30 mt-8 max-w-[31rem] text-lg leading-relaxed text-[#d9f7d5]">
          Find the useful little things that make walks easier, playtime longer,
          and the best nap spot even better.
        </p>

        <span
          aria-hidden="true"
          className="absolute -bottom-24 -right-20 size-[26rem] rounded-full bg-primary sm:size-[32rem] lg:-bottom-44 lg:-right-20 lg:size-[43rem]"
        />
        <img
          src={dachshund}
          alt=""
          width="1823"
          height="942"
          loading="lazy"
          className="pointer-events-none absolute -bottom-2 -right-24 z-10 w-[34rem] max-w-none rounded-none! drop-shadow-[0_24px_18px_rgba(0,30,10,.28)] sm:-right-16 sm:w-[39rem] lg:-bottom-6 lg:right-[2vw] lg:w-[min(53vw,52rem)]"
        />
      </div>
    </section>
  );
}
