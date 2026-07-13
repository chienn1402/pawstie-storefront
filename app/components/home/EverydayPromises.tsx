import logo from '~/assets/img-logo.png';

const EVERYDAY_PROMISES = [
  {
    label: 'Play-tested picks',
    copy: 'Useful favorites made for zoomies, naps, and everything between.',
  },
  {
    label: 'Comfort comes first',
    copy: 'Soft textures and thoughtful shapes for the pets who run the house.',
  },
  {
    label: 'One happy little shop',
    copy: 'Dog and cat essentials, gathered without the endless scrolling.',
  },
] as const;

export function EverydayPromises() {
  return (
    <section
      aria-labelledby="everyday-promises-heading"
      className="-mx-4 w-[calc(100%+2rem)] bg-white px-5! py-14! sm:px-6! lg:px-[7vw]! lg:py-24!"
    >
      <div className="mx-auto grid max-w-[80rem] gap-8 lg:grid-cols-[0.8fr_1.7fr] lg:gap-20">
        <div>
          <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-primary">
            The Pawstie promise
          </p>
          <h2
            id="everyday-promises-heading"
            className="mb-0! mt-3! max-w-[16ch] font-heading text-4xl! font-semibold! leading-none! tracking-[-0.06em] text-[#004817] lg:mt-4! lg:max-w-[11ch] lg:text-6xl!"
          >
            Good things for everyday mischief.
          </h2>
        </div>

        <ul className="grid gap-px overflow-hidden rounded-3xl bg-[#bfe9bb] ring-1 ring-[#bfe9bb] md:grid-cols-3 md:rounded-[2rem]">
          {EVERYDAY_PROMISES.map((promise, index) => (
            <li
              key={promise.label}
              className="mb-0! flex items-start gap-4 bg-[#effce9] p-5 sm:p-6 md:min-h-64 md:flex-col md:gap-0 md:p-7 lg:min-h-72 lg:p-8"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white ring-1 ring-[#ccefc8] md:size-12">
                <img
                  src={logo}
                  alt=""
                  width="830"
                  height="788"
                  loading="lazy"
                  className="size-5 rounded-none! md:size-6"
                />
                <span className="sr-only">Promise {index + 1}</span>
              </span>
              <div className="md:pt-12">
                <h3 className="font-heading text-xl font-semibold tracking-[-0.04em] text-[#004817] md:min-h-[2lh] md:text-2xl">
                  {promise.label}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-[#347345] md:mt-3 md:max-w-[28ch]">
                  {promise.copy}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
