import {cn} from '~/lib/utils';

export type Pillar = {title: string; copy: string};

/**
 * Three numbered claims in a row — the "why this and not the cheap one" block.
 * Numbering is generated from position so a caller never has to keep a label in
 * sync with the order of its own array.
 *
 * Callers are expected to lift their claims from the product descriptions
 * rather than invent them here, so nothing in a pillar can outrun what the PDP
 * goes on to say.
 */
export function LandingPillars({
  id,
  eyebrow,
  heading,
  pillars,
  tone = 'cream',
}: {
  id?: string;
  eyebrow: string;
  heading: string;
  pillars: readonly Pillar[];
  tone?: 'cream' | 'sand';
}) {
  const headingId = `${id ?? 'landing'}-pillars-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        '-mx-4 w-[calc(100%+2rem)] px-6 py-20 lg:px-[7vw] lg:py-28',
        tone === 'cream' ? 'bg-[#faf4ec]' : 'bg-[#f0e3d1]',
      )}
    >
      <div className="mx-auto max-w-[80rem]">
        <div className="max-w-[46rem]">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h2
            id={headingId}
            className="mb-0 mt-4 max-w-[16ch] font-heading text-4xl font-semibold leading-[0.92] tracking-[-0.055em] text-[#2e1c12] sm:text-5xl lg:text-6xl"
          >
            {heading}
          </h2>
        </div>

        <ul className="mt-12 grid gap-px overflow-hidden rounded-[1.75rem] bg-[#e0cbae] lg:mt-16 lg:grid-cols-3 lg:rounded-[2rem]">
          {pillars.map(({title, copy}, index) => (
            <li
              key={title}
              className={cn(
                'mb-0 p-8 lg:p-10',
                tone === 'cream' ? 'bg-[#f5eadb]' : 'bg-[#faf4ec]',
              )}
            >
              <p className="mb-0 font-heading text-sm font-bold tracking-[0.18em] text-[#b58150]">
                {String(index + 1).padStart(2, '0')}
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
