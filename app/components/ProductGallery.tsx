import {useEffect, useState} from 'react';
import {Image, MediaFile} from '@shopify/hydrogen';
import type {
  ProductFragment,
  ProductVariantFragment,
} from 'storefrontapi.generated';
import {PawIcon, PlayIcon} from '~/components/icons';

type ProductMedia = ProductFragment['media']['nodes'][number];

function getPreviewImage(media: ProductMedia) {
  if (media.previewImage) return media.previewImage;
  return media.__typename === 'MediaImage' ? media.image : null;
}

function getMediaKind(media: ProductMedia) {
  if (media.__typename === 'Video' || media.__typename === 'ExternalVideo') {
    return 'video';
  }
  if (media.__typename === 'Model3d') return '3D model';
  return 'image';
}

function isRenderableMedia(media: ProductMedia) {
  switch (media.__typename) {
    case 'MediaImage':
      return Boolean(media.image?.url);
    case 'Video':
      return media.sources.some((source) => source.url && source.mimeType);
    case 'ExternalVideo':
      return Boolean(media.embedUrl);
    case 'Model3d':
      return media.sources.some((source) => source.url);
    default:
      return false;
  }
}

function MediaFallback() {
  return (
    <div className="grid aspect-[4/5] w-full place-items-center text-[#00521d]/40">
      <PawIcon className="size-16" />
    </div>
  );
}

export function ProductGallery({
  media,
  selectedImage,
  title,
}: {
  media: ProductFragment['media']['nodes'];
  selectedImage?: ProductVariantFragment['image'];
  title: string;
}) {
  const displayableMedia = media.filter(isRenderableMedia);
  const selectedImageId = selectedImage?.id ?? null;
  const selectedMediaId =
    displayableMedia.find(
      (item) =>
        item.__typename === 'MediaImage' && item.image?.id === selectedImageId,
    )?.id ?? null;
  const fallbackMediaId = displayableMedia[0]?.id ?? null;
  const [activeMediaId, setActiveMediaId] = useState<string | null>(
    () => selectedMediaId ?? fallbackMediaId,
  );

  useEffect(() => {
    setActiveMediaId(selectedMediaId ?? fallbackMediaId);
  }, [fallbackMediaId, selectedMediaId]);

  const activeMedia =
    displayableMedia.find((item) => item.id === activeMediaId) ??
    displayableMedia[0];
  const activeIndex = activeMedia
    ? displayableMedia.findIndex((item) => item.id === activeMedia.id)
    : -1;
  const activeKind = activeMedia ? getMediaKind(activeMedia) : null;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="relative overflow-hidden rounded-[2rem] rounded-br-[4.75rem] bg-[#f1efe8] shadow-[0_18px_45px_rgba(0,72,23,0.08)]">
        {activeMedia ? (
          <MediaFile
            aria-label={activeMedia.alt || `${title} ${activeKind}`}
            className="aspect-[4/5] w-full rounded-none! object-cover"
            data={activeMedia}
            key={activeMedia.id}
            mediaOptions={{
              image: {
                alt: activeMedia.alt || title || 'Product image',
                aspectRatio: '4/5',
                loading: 'eager',
                sizes: '(min-width: 64em) 45vw, 100vw',
              },
              video: {
                className: 'aspect-[4/5] w-full bg-black object-contain',
                controls: true,
                playsInline: true,
                preload: 'none',
              },
            }}
          />
        ) : (
          <MediaFallback />
        )}

        {activeMedia ? (
          <span
            className={`pointer-events-none absolute left-4 rounded-full bg-white/85 px-3 py-1 font-heading text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#347345] shadow-sm backdrop-blur-sm ${activeKind === 'image' ? 'bottom-4' : 'top-4'}`}
          >
            {activeIndex + 1} / {displayableMedia.length}
          </span>
        ) : null}
      </div>

      {displayableMedia.length > 0 ? (
        <div
          className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 sm:gap-3 lg:grid-cols-6"
          aria-label="Product media"
        >
          {displayableMedia.map((item, index) => {
            const isActive = item.id === activeMediaId;
            const kind = getMediaKind(item);
            const previewImage = getPreviewImage(item);

            return (
              <button
                type="button"
                key={item.id}
                aria-label={`View ${kind} ${index + 1} of ${displayableMedia.length}`}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => setActiveMediaId(item.id)}
                className={`group relative aspect-[4/5] min-w-0 overflow-hidden rounded-2xl bg-[#f1efe8] p-0.5 transition-[box-shadow,opacity,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d] motion-reduce:transition-none ${isActive ? 'shadow-[0_0_0_2px_#00521d,0_0_0_4px_#fff]' : 'opacity-70 hover:-translate-y-0.5 hover:opacity-100 hover:shadow-[0_8px_18px_rgba(0,72,23,0.12)]'}`}
              >
                {previewImage ? (
                  <Image
                    alt=""
                    aspectRatio="4/5"
                    data={previewImage}
                    loading="lazy"
                    sizes="6rem"
                    className="size-full rounded-[0.9rem]! object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-[#00521d]/35">
                    <PawIcon className="size-8" />
                  </div>
                )}

                {kind === 'video' ? (
                  <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
                    <span className="grid size-9 place-items-center rounded-full bg-white/90 text-[#00521d] shadow-md">
                      <PlayIcon className="ml-0.5 size-4" />
                    </span>
                  </span>
                ) : null}

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
