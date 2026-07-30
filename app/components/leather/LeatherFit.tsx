/**
 * Sizing is the objection that kills cold traffic on collars — nobody knows
 * their dog's neck measurement standing in a TikTok feed. This block teaches
 * the method and stops there: the ranges differ per product (the AirTag collar
 * is sized by neck circumference, the nameplate collar by strap length), so
 * quoting one chart here would be wrong for half the range. Exact numbers stay
 * on each product page, which is also where they can't go stale.
 */
const STEPS: ReadonlyArray<{step: string; title: string; copy: string}> = [
  {
    step: 'Step one',
    title: 'Measure the neck',
    copy: 'Soft tape around the base of the neck — below the jaw, above the shoulders.',
  },
  {
    step: 'Step two',
    title: 'Leave two fingers',
    copy: 'Slide two fingers flat under the tape. Shop with that number.',
  },
  {
    step: 'Step three',
    title: 'Check the chart',
    copy: 'Every product page lists its own range. Between sizes, take the larger.',
  },
];

export function LeatherFit() {
  return (
    <section
      aria-labelledby="leather-fit-heading"
      className="-mx-4 w-[calc(100%+2rem)] bg-[#2e1c12] px-6 py-20 lg:px-[7vw] lg:py-28"
    >
      <div className="mx-auto max-w-[80rem]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-20">
          <div className="min-w-0">
            <p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-[#e0a668]">
              Getting the fit right
            </p>
            <h2
              id="leather-fit-heading"
              className="mb-0 mt-4 max-w-[13ch] font-heading text-4xl font-semibold leading-[0.92] tracking-[-0.055em] text-[#faf4ec] sm:text-5xl"
            >
              Two fingers, one tape measure.
            </h2>
            <p className="mt-6 max-w-[30rem] text-lg leading-relaxed text-[#cbae90]">
              Sixty seconds now saves an exchange later.
            </p>
          </div>

          <ol className="grid min-w-0 gap-px overflow-hidden rounded-[1.5rem] bg-[#4a3325]">
            {STEPS.map(({step, title, copy}) => (
              <li
                key={step}
                className="mb-0 grid gap-1.5 bg-[#3a2519] p-7 sm:grid-cols-[8rem_1fr] sm:gap-6 sm:p-8"
              >
                <p className="mb-0 font-heading text-sm font-bold uppercase tracking-[0.14em] text-[#b58150]">
                  {step}
                </p>
                <div className="min-w-0">
                  <h3 className="mb-0 font-heading text-xl font-semibold leading-tight tracking-[-0.03em] text-[#faf4ec]">
                    {title}
                  </h3>
                  <p className="mb-0 mt-2.5 leading-relaxed text-[#cbae90]">
                    {copy}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
