import {Link} from 'react-router';
import {ChevronDownIcon} from '~/components/icons';
import {LEATHER_NAMEPLATE_HANDLE} from '~/lib/leather';

const LINK =
  'font-semibold text-[#2e1c12] underline decoration-[#c9a87c] decoration-2 underline-offset-4 transition-colors hover:decoration-[#2e1c12] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary';

/**
 * Answers the questions a cold visitor actually asks before paying $40 for a
 * collar. Two of these exist purely to lose a sale honestly rather than win it
 * and refund it: the AirTag isn't in the box, and delivery terms live in the
 * store policies because this page has no business inventing a delivery date.
 *
 * Native <details> on purpose — it works before hydration, which matters when
 * the visitor is inside the TikTok or Instagram browser on a slow connection.
 */
const FAQS: ReadonlyArray<{question: string; answer: React.ReactNode}> = [
  {
    question: 'Is this actually real leather?',
    answer:
      'Yes — 100% first-layer genuine leather, the top grain of the hide, not bonded offcuts or coated synthetic. It scuffs and softens as it is worn. That is the material behaving correctly, not wearing out.',
  },
  {
    question: 'Does the AirTag collar include an AirTag?',
    answer:
      'No. The pocket is moulded and riveted to hold an Apple AirTag flush against the strap, but the tracker is bought separately.',
  },
  {
    question: 'Can I put my dog’s name and number on the collar?',
    answer: (
      <>
        Yes, on the{' '}
        <Link
          to={`/products/${LEATHER_NAMEPLATE_HANDLE}`}
          prefetch="intent"
          className={LINK}
        >
          Heritage Nameplate collar
        </Link>
        . The name and phone number are laser-etched into a brass plate riveted
        flat onto the leather — no jingling tag to lose. Engraving is included;
        you add the details when you add it to the cart.
      </>
    ),
  },
  {
    question: 'Which size do I order?',
    answer:
      'Measure around the base of the neck, leaving two fingers of slack under the tape. Each product page carries its own chart — collars are sized by neck range, leashes by length. Between two sizes, size up.',
  },
  {
    question: 'How do I look after it?',
    answer:
      'Wipe it with a damp cloth when it gets muddy, and work in a little leather conditioner every few months. That is the whole routine.',
  },
  {
    question: 'What about delivery and returns?',
    answer: (
      <>
        Delivery times, returns and refunds are all set out in our{' '}
        <Link to="/policies" prefetch="intent" className={LINK}>
          store policies
        </Link>
        . Checkout is handled by Shopify, so card details never touch this site.
      </>
    ),
  },
];

export function LeatherFaq() {
  return (
    <section
      aria-labelledby="leather-faq-heading"
      className="-mx-4 w-[calc(100%+2rem)] bg-[#faf4ec] px-6 py-20 lg:px-[7vw] lg:py-28"
    >
      <div className="mx-auto grid max-w-[80rem] gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
        <div className="min-w-0">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-primary">
            Before you buy
          </p>
          <h2
            id="leather-faq-heading"
            className="mb-0 mt-4 max-w-[12ch] font-heading text-4xl font-semibold leading-[0.92] tracking-[-0.055em] text-[#2e1c12] sm:text-5xl"
          >
            The honest answers.
          </h2>
        </div>

        <div className="min-w-0 border-t border-[#e0cbae]">
          {FAQS.map(({question, answer}) => (
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
