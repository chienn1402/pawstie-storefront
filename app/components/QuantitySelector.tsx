import {MinusIcon, PlusIcon} from '~/components/icons';

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]';

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const button = `grid size-11 place-items-center rounded-full text-[#00521d] transition-colors hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent ${FOCUS_RING} motion-reduce:transition-none`;

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-[#edf8e9] p-1">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={disabled || value <= min} aria-label="Decrease quantity" className={button}>
        <MinusIcon className="size-4" />
      </button>
      <span aria-live="polite" className="min-w-9 text-center font-heading text-lg font-semibold text-[#004817]">
        {value}
      </span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="Increase quantity" className={button}>
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}
