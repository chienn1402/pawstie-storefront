import {useLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductImage} from '~/components/ProductImage';
import {ProductForm} from '~/components/ProductForm';
import {ProductBreadcrumb} from '~/components/ProductBreadcrumb';
import {ProductPromises} from '~/components/ProductPromises';
import {ProductDetails} from '~/components/ProductDetails';
import {RelatedProducts} from '~/components/RelatedProducts';
import {PawIcon} from '~/components/icons';
import {RECOMMENDED_PRODUCT_FRAGMENT} from '~/lib/fragments';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `Pawstie | ${data?.product.title ?? ''}`},
    {
      name: 'description',
      content: data?.product.seo?.description ?? data?.product.description ?? '',
    },
    {rel: 'canonical', href: `/products/${data?.product.handle}`},
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const criticalData = await loadCriticalData(args);
  const recommended = args.context.storefront
    .query(PRODUCT_RECOMMENDATIONS_QUERY, {
      variables: {productId: criticalData.product.id},
    })
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  return {...criticalData, recommended};
}

async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) throw new Error('Expected product handle to be defined');

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
  ]);

  if (!product?.id) throw new Response(null, {status: 404});
  redirectIfHandleIsLocalized(request, {handle, data: product});
  return {product};
}

export default function Product() {
  const {product, recommended} = useLoaderData<typeof loader>();
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });
  const {title, descriptionHtml, vendor} = product;
  const heroImage = selectedVariant?.image ?? product.featuredImage;

  return (
    <div className="pb-4">
      <div className="px-6 pt-8 lg:px-[7vw] lg:pt-12">
        <div className="mx-auto max-w-[80rem]">
          <ProductBreadcrumb title={title} />
          <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-2 lg:gap-16">
            <ProductImage image={heroImage} title={title} />
            <div className="flex flex-col gap-7">
              <div>
                <p className="inline-flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-[0.16em] text-[#347345]"><PawIcon className="size-4 text-[#00752d]" />{vendor}</p>
                <h1 className="mb-0 mt-3 font-heading text-4xl font-semibold leading-[0.95] tracking-[-0.05em] text-[#004817] sm:text-5xl">{title}</h1>
              </div>
              <ProductPrice price={selectedVariant?.price} compareAtPrice={selectedVariant?.compareAtPrice} availableForSale={selectedVariant?.availableForSale} />
              <ProductForm productOptions={productOptions} selectedVariant={selectedVariant} />
              <ProductPromises />
              <ProductDetails descriptionHtml={descriptionHtml} />
            </div>
          </div>
        </div>
      </div>
      <RelatedProducts products={recommended} />
      <Analytics.ProductView data={{products: [{id: product.id, title: product.title, price: selectedVariant?.price.amount || '0', vendor: product.vendor, variantId: selectedVariant?.id || '', variantTitle: selectedVariant?.title || '', quantity: 1}]}} />
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice { amount currencyCode }
    id
    image { __typename id url altText width height }
    price { amount currencyCode }
    product { title handle }
    selectedOptions { name value }
    sku
    title
    unitPrice { amount currencyCode }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    featuredImage { __typename id url altText width height }
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant { ...ProductVariant }
        swatch { color image { previewImage { url } } }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) { ...ProductVariant }
    adjacentVariants (selectedOptions: $selectedOptions) { ...ProductVariant }
    seo { description title }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product($country: CountryCode, $handle: String!, $language: LanguageCode, $selectedOptions: [SelectedOptionInput!]!) @inContext(country: $country, language: $language) {
    product(handle: $handle) { ...Product }
  }
  ${PRODUCT_FRAGMENT}
` as const;

const PRODUCT_RECOMMENDATIONS_QUERY = `#graphql
  query ProductRecommendations($country: CountryCode, $language: LanguageCode, $productId: ID!) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId, intent: RELATED) { ...RecommendedProduct }
  }
  ${RECOMMENDED_PRODUCT_FRAGMENT}
` as const;
