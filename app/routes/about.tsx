import {Link} from 'react-router';
import type {Route} from './+types/about';
import ctaPets from '~/assets/cta-pets.jpg';
import logo from '~/assets/img-logo.png';
import {ArrowRightIcon} from '~/components/icons';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Pawstie | Our Story'},
    {
      name: 'description',
      content:
        'The little shop behind the toys, cozy corners, and everyday essentials — meet the people (and pets) who make Pawstie.',
    },
  ];
};

const VALUES = [
  {
    label: 'Chosen, not stocked',
    copy: 'Every item earns its place through real play, real naps, and the occasional destructive review from a very determined terrier.',
  },
  {
    label: 'Made to be lived with',
    copy: 'Soft where it counts, sturdy where it matters — pieces that hold up to daily life and still look good in your home.',
  },
  {
    label: 'One friendly shelf',
    copy: 'Dogs and cats, all in one place. No endless tabs, no filler — just the good stuff, gathered for you.',
  },
] as const;

export default function About() {
  return (
    <div className="pb-20 lg:pb-28">
      {/* Intro — mirrors the policies/blog header treatment */}
      <section className="px-6 pt-10 pb-8 lg:px-[7vw] lg:pt-14">
        <div className="mx-auto max-w-[80rem]">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-primary">
            Our story
          </p>
          <h1 className="mb-0 mt-3 max-w-[18ch] font-heading text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-[#004817] sm:text-6xl">
            A little shop for very good animals.
          </h1>
          <p className="mt-5 max-w-[38rem] text-lg leading-relaxed text-[#347345]">
            Pawstie started with a simple frustration: shopping for our pets
            meant wading through a hundred lookalike products to find the few
            worth buying. So we built the shelf we wished existed — smaller,
            warmer, and picked with actual paws in mind.
          </p>
        </div>
      </section>

      {/* Story band — full-bleed light green, photo + narrative */}
      <section
        aria-labelledby="about-story-heading"
        className="-mx-4 w-[calc(100%+2rem)] overflow-hidden bg-[#effce9] px-6 py-16 lg:px-[7vw] lg:py-24"
      >
        <div className="mx-auto grid max-w-[80rem] items-center gap-12 lg:grid-cols-[minmax(18rem,26rem)_1fr] lg:gap-20">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#a4e8aa] lg:rounded-[2.75rem]">
            <img
              src={ctaPets}
              alt="A tabby cat and a cream-coloured dog resting together in a meadow of daisies."
              width="1000"
              height="1250"
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] size-full rounded-none! object-cover"
            />
            <span className="absolute bottom-5 left-5 rounded-full bg-white px-5 py-3 font-heading text-base font-semibold text-[#00521d] shadow-sm lg:bottom-6 lg:left-6 lg:text-lg">
              Est. for zoomies
            </span>
          </div>

          <div className="min-w-0">
            <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-[#347345]">
              Why we&rsquo;re here
            </p>
            <h2
              id="about-story-heading"
              className="mb-0 mt-3 max-w-[16ch] font-heading text-4xl font-semibold leading-[0.95] tracking-[-0.05em] text-[#004817] lg:mt-4 lg:text-5xl"
            >
              Fewer choices. Better ones.
            </h2>
            <div className="mt-6 max-w-[34rem] space-y-5 text-lg leading-relaxed text-[#347345]">
              <p>
                We&rsquo;re a small crew of pet people who happen to be picky.
                Before
                anything lands on Pawstie, it spends time with our own dogs and
                cats — chewed, chased, curled up in, and quietly judged.
              </p>
              <p>
                The ones that survive are the ones you&rsquo;ll find here. No
                overwhelming catalog, no filler brands, no gimmicks that look
                clever and last a week. Just everyday essentials made for the
                animals who genuinely run the house.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values — reuses the promise-card grid vocabulary */}
      <section
        aria-labelledby="about-values-heading"
        className="px-6 pt-16 lg:px-[7vw] lg:pt-24"
      >
        <div className="mx-auto grid max-w-[80rem] gap-8 lg:grid-cols-[0.8fr_1.7fr] lg:gap-20">
          <div>
            <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-primary">
              What we stand for
            </p>
            <h2
              id="about-values-heading"
              className="mb-0 mt-3 max-w-[14ch] font-heading text-4xl font-semibold leading-none tracking-[-0.06em] text-[#004817] lg:mt-4 lg:text-6xl"
            >
              A few things we won&rsquo;t budge on.
            </h2>
          </div>

          <ul className="grid list-none gap-px overflow-hidden rounded-3xl bg-[#bfe9bb] pl-0 ring-1 ring-[#bfe9bb] md:grid-cols-3 md:rounded-[2rem]">
            {VALUES.map((value, index) => (
              <li
                key={value.label}
                className="mb-0 flex items-start gap-4 bg-[#effce9] p-5 sm:p-6 md:min-h-64 md:flex-col md:gap-0 md:p-7 lg:min-h-72 lg:p-8"
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
                  <span className="sr-only">Value {index + 1}</span>
                </span>
                <div className="md:pt-12">
                  <h3 className="font-heading text-xl font-semibold tracking-[-0.04em] text-[#004817] md:min-h-[2lh] md:text-2xl">
                    {value.label}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-[#347345] md:mt-3 md:max-w-[28ch]">
                    {value.copy}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contact CTA — links out to the existing contact-information policy */}
      <section
        aria-labelledby="about-contact-heading"
        className="px-6 pt-16 lg:px-[7vw] lg:pt-24"
      >
        <div className="mx-auto max-w-[80rem]">
          <div className="overflow-hidden rounded-[2rem] bg-[#004817] px-7 py-12 lg:rounded-[2.75rem] lg:px-16 lg:py-16">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-16">
              <div className="min-w-0">
                <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-[#a4e8aa]">
                  Say hello
                </p>
                <h2
                  id="about-contact-heading"
                  className="mb-0 mt-3 max-w-[20ch] font-heading text-3xl font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl"
                >
                  Questions, or just want to send a photo of your pet?
                </h2>
                <p className="mt-5 max-w-[38rem] text-lg leading-relaxed text-[#cdeecb]">
                  We answer every message ourselves. Reach us any time — our
                  full contact details live with the rest of the fine print.
                </p>
              </div>

              <Link
                to="/policies/contact-information"
                prefetch="intent"
                className="group inline-flex min-h-16 shrink-0 items-center justify-between gap-5 rounded-full bg-primary py-2 pl-8 pr-2 font-heading text-lg font-semibold text-white! shadow-[0_12px_28px_-10px_rgba(169,83,14,0.5)] transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#8f440b] hover:no-underline! hover:shadow-[0_20px_38px_-12px_rgba(169,83,14,0.65)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a4e8aa] motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:text-xl"
              >
                Contact us
                <span className="relative grid size-12 place-items-center overflow-hidden rounded-full bg-white text-primary">
                  <ArrowRightIcon className="size-5 transition-transform duration-300 motion-safe:group-hover:translate-x-[220%]" />
                  <ArrowRightIcon className="absolute size-5 -translate-x-[220%] transition-transform duration-300 motion-safe:group-hover:translate-x-0" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
