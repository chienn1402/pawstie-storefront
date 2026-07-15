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
    <div className="flex min-w-0 flex-col gap-5">
      <div className="relative overflow-hidden rounded-[2rem] rounded-br-[4.75rem] bg-[#f1efe8] shadow-[0_18px_45px_rgba(0,72,23,0.08)]">
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

        {activeImage ? (
          <span className="absolute bottom-4 left-4 rounded-full bg-white/85 px-3 py-1 font-heading text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#347345] shadow-sm backdrop-blur-sm">
            {Math.max(images.findIndex((image) => image.id === activeImage.id) + 1, 1)} / {images.length}
          </span>
        ) : null}
      </div>

      {images.length > 0 ? (
        <div
          className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 sm:gap-3 lg:grid-cols-6"
          aria-label="Product images"
        >
          {images.map((image, index) => {
            const imageId = image.id ?? null;
            const isActive = imageId === activeImageId;

            return (
              <button
                type="button"
                key={image.id ?? index}
                aria-label={`View image ${index + 1} of ${images.length}`}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => setActiveImageId(imageId)}
                className={`group relative aspect-[4/5] min-w-0 overflow-hidden rounded-2xl bg-[#f1efe8] p-0.5 transition-[box-shadow,opacity,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d] motion-reduce:transition-none ${isActive ? 'shadow-[0_0_0_2px_#00521d,0_0_0_4px_#fff]' : 'opacity-70 hover:-translate-y-0.5 hover:opacity-100 hover:shadow-[0_8px_18px_rgba(0,72,23,0.12)]'}`}
              >
                <Image
                  alt={image.altText || `${title} image ${index + 1}`}
                  aspectRatio="4/5"
                  data={image}
                  loading="lazy"
                  sizes="6rem"
                  className="size-full rounded-[0.9rem]! object-cover"
                />

                <span
                  aria-hidden="true"
                  className={`absolute inset-0 rounded-[0.9rem] border transition-colors motion-reduce:transition-none ${isActive ? 'border-[#00521d]/20' : 'border-white/50 group-hover:border-white'}`}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
