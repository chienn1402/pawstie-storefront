import {cn} from '~/lib/utils';

type ProductPodBadgeProps = {
  className?: string;
};

type PodMetafield = {
  value?: string | null;
} | null;

export function isPrintOnDemand(
  metafield: PodMetafield | undefined,
): boolean {
  return metafield?.value === 'true';
}

export function ProductPodBadge({className}: ProductPodBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-[#f1bc73] bg-[#fff4df] px-2.5 py-1 font-heading text-[0.6875rem] font-bold uppercase leading-none tracking-[0.11em] text-[#754000]',
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-[#df7a00]" />
      Print on demand
    </span>
  );
}
