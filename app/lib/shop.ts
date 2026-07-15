import type {ProductSortKeys} from '@shopify/hydrogen/storefront-api-types';

/**
 * A shop "category" is a routine keyword resolved by Storefront product
 * search — the store has no real category collections (see the design spec).
 * `query: null` means "no filter" (the All chip).
 */
export type ShopCategory = {
  id: string;
  label: string;
  query: string | null;
};

export type ShopSort = {
  id: string;
  label: string;
  sortKey: ProductSortKeys;
  reverse: boolean;
};

// Walk/Play/Snooze/Treat mirror the home page's ShopByRoutine mappings;
// Feeding is added so the bowls surface as their own chip.
export const SHOP_CATEGORIES: readonly ShopCategory[] = [
  {id: 'all', label: 'All', query: null},
  {id: 'walk', label: 'Walk', query: 'walk'},
  {id: 'play', label: 'Play', query: 'toy'},
  {id: 'snooze', label: 'Snooze', query: 'bed'},
  {id: 'treat', label: 'Treat', query: 'treat'},
  {id: 'feeding', label: 'Feeding', query: 'bowl'},
];

export const SHOP_SORTS: readonly ShopSort[] = [
  {id: 'featured', label: 'Featured', sortKey: 'BEST_SELLING', reverse: false},
  {id: 'newest', label: 'Newest', sortKey: 'CREATED_AT', reverse: true},
  {
    id: 'price-asc',
    label: 'Price: Low to High',
    sortKey: 'PRICE',
    reverse: false,
  },
  {
    id: 'price-desc',
    label: 'Price: High to Low',
    sortKey: 'PRICE',
    reverse: true,
  },
];

const DEFAULT_CATEGORY = SHOP_CATEGORIES[0];
const DEFAULT_SORT = SHOP_SORTS[0];

export function resolveCategory(id: string | null | undefined): ShopCategory {
  return (
    SHOP_CATEGORIES.find((category) => category.id === id) ?? DEFAULT_CATEGORY
  );
}

export function resolveSort(id: string | null | undefined): ShopSort {
  return SHOP_SORTS.find((sort) => sort.id === id) ?? DEFAULT_SORT;
}
