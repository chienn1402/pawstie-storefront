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

test('the product route passes ordered media to the gallery', () => {
  assert.ok(productRoute.includes('media={product.media.nodes}'));
  assert.equal(productRoute.includes('images={product.images.nodes}'), false);
  assert.equal(productRoute.includes('images(first: 12)'), false);
});

test('the gallery uses Hydrogen media rendering and defers video loading', () => {
  assert.match(productGallery, /import \{Image, MediaFile\} from '@shopify\/hydrogen'/);
  assert.ok(productGallery.includes("media: ProductFragment['media']['nodes']"));
  assert.ok(productGallery.includes('<MediaFile'));
  assert.ok(productGallery.includes("preload: 'none'"));
  assert.ok(productGallery.includes('playsInline: true'));
  assert.ok(productGallery.includes('Product media'));
  assert.ok(productGallery.includes('<PlayIcon'));
});
