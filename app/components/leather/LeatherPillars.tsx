/**
 * The "why leather" block. Every claim is lifted from the product descriptions
 * themselves — first-layer hide, alloy hardware rated for pull force, bevelled
 * interior edges — so nothing here can outrun what the PDP goes on to say.
 */
const PILLARS: ReadonlyArray<{
  number: string;
  title: string;
  copy: string;
}> = [
  {
    number: '01',
    title: 'It breaks in, not down',
    copy: 'The top grain of the hide — the strong part. Softens to fit in a few weeks and holds its shape for years. Nylon frays at the buckle.',
  },
  {
    number: '02',
    title: 'Hardware built for the pull',
    copy: 'Solid alloy buckles and reinforced rings, rated for pull force. No thin welded loop to straighten out mid-walk.',
  },
  {
    number: '03',
    title: 'Edges that don’t chafe',
    copy: 'Bevelled and smoothed instead of cut square, so the strap lies flat. The difference between a collar they forget and one they scratch at.',
  },
];

export function LeatherPillars() {
  return (
    <section
      aria-labelledby="leather-pillars-heading"
      className="-mx-4 w-[calc(100%+2rem)] bg-[#faf4ec] px-6 py-20 lg:px-[7vw] lg:py-28"
    >
      <div className="mx-auto max-w-[80rem]">
        <div className="max-w-[46rem]">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-primary">
            Why leather
          </p>
          <h2
            id="leather-pillars-heading"
            className="mb-0 mt-4 max-w-[16ch] font-heading text-4xl font-semibold leading-[0.92] tracking-[-0.055em] text-[#2e1c12] sm:text-5xl lg:text-6xl"
          >
            Three reasons it outlasts the nylon one.
          </h2>
        </div>

        <ul className="mt-12 grid gap-px overflow-hidden rounded-[1.75rem] bg-[#e0cbae] lg:mt-16 lg:grid-cols-3 lg:rounded-[2rem]">
          {PILLARS.map(({number, title, copy}) => (
            <li key={number} className="mb-0 bg-[#f5eadb] p-8 lg:p-10">
              <p className="mb-0 font-heading text-sm font-bold tracking-[0.18em] text-[#b58150]">
                {number}
              </p>
              <h3 className="mb-0 mt-5 font-heading text-2xl font-semibold leading-[1.05] tracking-[-0.035em] text-[#2e1c12]">
                {title}
              </h3>
              <p className="mb-0 mt-4 leading-relaxed text-[#6b5340]">{copy}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
