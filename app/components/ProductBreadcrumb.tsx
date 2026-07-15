import {Link} from 'react-router';

const LINK = 'rounded-sm text-[#347345] transition-colors hover:text-[#00752d] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d] motion-reduce:transition-none';

export function ProductBreadcrumb({title}: {title: string}) {
  return <nav aria-label="Breadcrumb" className="text-sm font-medium"><ol className="flex flex-wrap items-center gap-2 [&>li]:mb-0"><li><Link to="/" className={LINK}>Home</Link></li><li aria-hidden="true" className="text-[#bfe9bb]">/</li><li><Link to="/collections/all" className={LINK}>Shop</Link></li><li aria-hidden="true" className="text-[#bfe9bb]">/</li><li aria-current="page" className="truncate text-[#004817]">{title}</li></ol></nav>;
}
