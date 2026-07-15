import {useEffect, useState} from 'react';
import {Image} from '@shopify/hydrogen';
import type {
  ProductFragment,
  ProductVariantFragment,
} from 'storefrontapi.generated';
import {PawIcon} from '~/components/icons';

export function ProductGallery({
  images,
  selectedImage,
  title,
}: {
  images: ProductFragment['images']['nodes'];
  selectedImage?: ProductVariantFragment['image'];
  title: string;
}) {
  const [activeImageId, setActiveImageId] = useState<string | null>(
    () => selectedImage?.id ?? images[0]?.id ?? null,
  );
  const selectedImageId = selectedImage?.id ?? null;
  const fallbackImageId = images[0]?.id ?? null;

  useEffect(() => {
    setActiveImageId(selectedImageId ?? fallbackImageId);
  }, [fallbackImageId, selectedImageId]);

  const activeImage =
    images.find((image) => image.id === activeImageId) ??
    selectedImage ??
    images[0];

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="relative overflow-hidden rounded-[2rem] rounded-br-[4.75rem] bg-[#a4e8aa]">
        {activeImage ? (
          <Image
            alt={activeImage.altText || title || 'Product image'}
            aspectRatio="4/5"
            data={activeImage}
            key={activeImage.id}
            sizes="(min-width: 64em) 45vw, 100vw"
            className="size-full rounded-none! object-cover"
          />
        ) : (
          <div className="grid aspect-[4/5] w-full place-items-center text-[#00521d]/40">
            <PawIcon className="size-16" />
          </div>
        )}
      </div>

      {images.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-1" aria-label="Product images">
          {images.map((image, index) => {
            const imageId = image.id ?? null;
            const isActive = imageId === activeImageId;

            return (
              <button
                type="button"
                key={image.id ?? index}
                aria-label={`View image ${index + 1} of ${images.length}`}
                aria-pressed={isActive}
                onClick={() => setActiveImageId(imageId)}
                className={`relative w-20 shrink-0 overflow-hidden rounded-xl bg-[#a4e8aa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d] sm:w-24 ${isActive ? 'ring-2 ring-[#00521d] ring-offset-2' : 'opacity-75 transition-opacity hover:opacity-100 motion-reduce:transition-none'}`}
              >
                <Image
                  alt={image.altText || `${title} image ${index + 1}`}
                  aspectRatio="4/5"
                  data={image}
                  loading="lazy"
                  sizes="6rem"
                  className="size-full rounded-none! object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
