import {ChevronDownIcon} from '~/components/icons';
import {cn} from '~/lib/utils';

export type Faq = {question: string; answer: React.ReactNode};

/** Shared link styling for answers that need one. */
export const FAQ_LINK =
  'font-semibold text-[#2e1c12] underline decoration-[#c9a87c] decoration-2 underline-offset-4 transition-colors hover:decoration-[#2e1c12] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary';

/**
 * The objection block. Native `<details>` on purpose — it works before
 * hydration, which matters when the visitor is inside the TikTok or Instagram
 * browser on a slow connection, and collapsed answers cost a scroller nothing.
 *
 * Callers are expected to include the answers that *lose* a sale honestly
 * — what isn't in the box, where the delivery terms actually live — because the
 * alternative is winning it and refunding it.
 */
export function LandingFaq({
  id,
  eyebrow = 'Before you buy',
  heading = 'The honest answers.',
  faqs,
  tone = 'cream',
}: {
  id?: string;
  eyebrow?: string;
  heading?: string;
  faqs: readonly Faq[];
  tone?: 'cream' | 'sand';
}) {
  const headingId = `${id ?? 'landing'}-faq-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        '-mx-4 w-[calc(100%+2rem)] px-6 py-20 lg:px-[7vw] lg:py-28',
        tone === 'cream' ? 'bg-[#faf4ec]' : 'bg-[#f0e3d1]',
      )}
    >
      <div className="mx-auto grid max-w-[80rem] gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
        <div className="min-w-0">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h2
            id={headingId}
            className="mb-0 mt-4 max-w-[12ch] font-heading text-4xl font-semibold leading-[0.92] tracking-[-0.055em] text-[#2e1c12] sm:text-5xl"
          >
            {heading}
          </h2>
        </div>

        <div className="min-w-0 border-t border-[#e0cbae]">
          {faqs.map(({question, answer}) => (
            <details
              key={question}
              className="group border-b border-[#e0cbae] [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-heading text-lg font-semibold leading-snug tracking-[-0.02em] text-[#2e1c12] transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary sm:text-xl">
                {question}
                <ChevronDownIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-[#b58150] transition-transform duration-200 group-open:-rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="mb-0 max-w-[44rem] pb-7 leading-relaxed text-[#6b5340]">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
