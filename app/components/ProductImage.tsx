import {Image} from '@shopify/hydrogen';
import type {ProductVariantFragment} from 'storefrontapi.generated';
import {PawIcon} from '~/components/icons';

export function ProductImage({
  image,
  title,
}: {
  image: ProductVariantFragment['image'];
  title?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] rounded-br-[4.75rem] bg-[#a4e8aa]">
      {image ? (
        <Image
          alt={image.altText || title || 'Product image'}
          aspectRatio="4/5"
          data={image}
          key={image.id}
          sizes="(min-width: 64em) 45vw, 100vw"
          className="size-full rounded-none! object-cover"
        />
      ) : (
        <div className="grid aspect-[4/5] w-full place-items-center text-[#00521d]/40">
          <PawIcon className="size-16" />
        </div>
      )}
    </div>
  );
}
