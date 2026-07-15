import {ChevronDownIcon} from '~/components/icons';

const SECTIONS = [
  {summary: 'Shipping & returns', body: 'Orders ship within 1–2 business days with tracking, and shipping is free on orders over $35. Changed your mind? Return any unused item within 30 days for a full refund.'},
  {summary: 'Care & cleaning', body: 'Spot-clean with mild soap and warm water, then air-dry away from direct heat. Check the product tag for any material-specific guidance before washing.'},
] as const;

const PROSE = 'text-[#347345] [&>p]:text-lg [&>p]:leading-relaxed [&>p]:text-[#347345] [&>ul]:mt-5 [&>ul]:flex [&>ul]:flex-col [&>ul]:gap-3 [&_li]:relative [&_li]:mb-0 [&_li]:pl-7 [&_li]:text-base [&_li]:leading-relaxed [&_li]:text-[#347345] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.55em] [&_li]:before:size-2 [&_li]:before:rounded-full [&_li]:before:bg-[#00752d] [&_li]:before:content-[\'\']';

export function ProductDetails({descriptionHtml}: {descriptionHtml: string}) {
  return <div className="flex flex-col gap-8"><div className={PROSE} dangerouslySetInnerHTML={{__html: descriptionHtml}} /><div className="flex flex-col divide-y divide-[#e2f2dd] border-y border-[#e2f2dd]">{SECTIONS.map(({summary, body}) => <details key={summary} className="group"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-heading text-base font-semibold text-[#004817] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d] [&::-webkit-details-marker]:hidden">{summary}<ChevronDownIcon className="size-5 shrink-0 text-[#347345] transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" /></summary><p className="pb-5 text-base leading-relaxed text-[#347345]">{body}</p></details>)}</div></div>;
}
