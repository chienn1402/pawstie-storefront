import {PawIcon, ShieldCheckIcon, TruckIcon} from '~/components/icons';

const PROMISES = [
  {Icon: TruckIcon, label: 'Free shipping over $35', copy: 'Fast, tracked delivery to your door.'},
  {Icon: ShieldCheckIcon, label: '30-day happy-pet guarantee', copy: 'Not a hit? Send it back, no fuss.'},
  {Icon: PawIcon, label: 'Play-tested picks', copy: 'Chosen by pets who take toys seriously.'},
] as const;

export function ProductPromises() {
  return <ul className="grid gap-3 rounded-[1.5rem] bg-[#effce9] p-4 sm:grid-cols-3">{PROMISES.map(({Icon, label, copy}) => <li key={label} className="mb-0 flex items-start gap-3 sm:flex-col sm:gap-2"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#00521d] ring-1 ring-[#ccefc8]"><Icon className="size-5" /></span><div><p className="font-heading text-sm font-semibold text-[#004817]">{label}</p><p className="mt-1 text-xs leading-relaxed text-[#347345]">{copy}</p></div></li>)}</ul>;
}
