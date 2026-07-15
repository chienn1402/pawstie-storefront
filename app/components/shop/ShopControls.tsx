import {Form, Link, useSubmit} from 'react-router';
import {SHOP_CATEGORIES, SHOP_SORTS} from '~/lib/shop';
import {ChevronDownIcon} from '~/components/icons';
import {cn} from '~/lib/utils';

const CHIP_BASE =
  'inline-flex min-h-11 items-center justify-center rounded-full px-4 font-heading text-sm font-semibold tracking-[-0.01em] transition-colors duration-200 hover:no-underline! focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d] motion-reduce:transition-none';

export function ShopControls({
  activeCategory,
  activeSort,
  count,
}: {
  activeCategory: string;
  activeSort: string;
  count: number;
}) {
  const submit = useSubmit();

  // Chips preserve the active sort but drop the pagination cursor (fresh nav
  // = first page). Defaults are omitted so the URL stays clean.
  function categoryHref(id: string) {
    const params = new URLSearchParams();
    if (id !== 'all') params.set('category', id);
    if (activeSort !== 'featured') params.set('sort', activeSort);
    const qs = params.toString();
    return qs ? `/shop?${qs}` : '/shop';
  }

  return (
    <div className="px-6 lg:px-[7vw]">
      <div className="mx-auto flex max-w-[80rem] flex-col gap-5 border-b border-[#cdeccb] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Product categories" className="flex flex-wrap gap-2">
          {SHOP_CATEGORIES.map((category) => {
            const active = category.id === activeCategory;
            return (
              <Link
                key={category.id}
                to={categoryHref(category.id)}
                prefetch="intent"
                aria-current={active ? 'page' : undefined}
                className={cn(
                  CHIP_BASE,
                  active
                    ? 'bg-[#00521d] text-white! hover:bg-[#006523]'
                    : 'bg-[#effce9] text-[#00521d]! hover:bg-[#e2f8dd]',
                )}
              >
                {category.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-between gap-4 lg:justify-end">
          <p
            aria-live="polite"
            className="font-heading text-sm font-semibold text-[#347345]"
          >
            {count} {count === 1 ? 'product' : 'products'}
          </p>

          <Form method="get" action="/shop" className="flex items-center gap-2">
            {activeCategory !== 'all' ? (
              <input type="hidden" name="category" value={activeCategory} />
            ) : null}
            <label
              htmlFor="shop-sort"
              className="font-heading text-sm font-semibold text-[#00521d]"
            >
              Sort
            </label>
            <div className="relative">
              <select
                id="shop-sort"
                name="sort"
                defaultValue={activeSort}
                onChange={(event) => void submit(event.currentTarget.form)}
                className="min-h-11 appearance-none rounded-full border border-[#cdeccb] bg-white py-2 pl-4 pr-10 font-heading text-sm font-semibold text-[#00521d] transition-colors hover:border-[#00521d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]"
              >
                {SHOP_SORTS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#00521d]" />
            </div>
            <noscript>
              <button
                type="submit"
                className="min-h-11 rounded-full bg-[#00521d] px-4 font-heading text-sm font-semibold text-white"
              >
                Sort
              </button>
            </noscript>
          </Form>
        </div>
      </div>
    </div>
  );
}
