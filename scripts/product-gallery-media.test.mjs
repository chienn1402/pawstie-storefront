import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const productRoute = await readFile(
  new URL('../app/routes/products.$handle.tsx', import.meta.url),
  'utf8',
);

const productGallery = await readFile(
  new URL('../app/components/ProductGallery.tsx', import.meta.url),
  'utf8',
);

const structuredData = await readFile(
  new URL('../app/lib/structured-data.ts', import.meta.url),
  'utf8',
);

test('the product query requests every Hydrogen product-media shape', () => {
  const requiredGraphql = [
    'media(first: 12)',
    'mediaContentType',
    'previewImage { id url altText width height }',
    '... on MediaImage',
    '... on Video',
    'sources { url mimeType }',
    '... on ExternalVideo',
    'embedUrl',
    '... on Model3d',
  ];

  for (const field of requiredGraphql) {
    assert.ok(productRoute.includes(field), `missing GraphQL media field: ${field}`);
  }
});

test('the product route isolates ordered gallery media from JSON-LD images', () => {
  assert.ok(productRoute.includes('media={product.media.nodes}'));
  assert.equal(productRoute.includes('images={product.images.nodes}'), false);
  assert.ok(productRoute.includes('productImages: images(first: 12)'));
  assert.doesNotMatch(productRoute, /^\s+images\(first: 12\)/m);
  assert.ok(structuredData.includes('product.productImages.nodes'));
  assert.equal(structuredData.includes('product.media.nodes'), false);
});

test('the gallery uses Hydrogen media rendering and defers video loading', () => {
  assert.match(productGallery, /import \{Image, MediaFile\} from '@shopify\/hydrogen'/);
  assert.ok(productGallery.includes("media: ProductFragment['media']['nodes']"));
  assert.ok(productGallery.includes('<MediaFile'));
  assert.ok(productGallery.includes("preload: 'none'"));
  assert.ok(productGallery.includes('playsInline: true'));
  assert.ok(productGallery.includes('Product media'));
  assert.ok(productGallery.includes('role="group"'));
  assert.ok(productGallery.includes('<PlayIcon'));
});

test('the gallery preserves direct variant fallback and manual media selection', () => {
  assert.ok(
    productGallery.includes(
      'selectedMediaId ?? selectedImageId ?? fallbackMediaId',
    ),
  );
  assert.ok(productGallery.includes('data={selectedImage}'));
  assert.ok(productGallery.includes('key={selectedImage.id}'));
  assert.match(productGallery, /\}, \[selectedImageId\]\);/);
});
