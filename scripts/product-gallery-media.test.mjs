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

const entryServer = await readFile(
  new URL('../app/entry.server.tsx', import.meta.url),
  'utf8',
);

function getCspDirectiveSources(directive) {
  const block = entryServer.match(
    new RegExp(`${directive}:\\s*\\[([\\s\\S]*?)\\],`),
  );
  assert.ok(block, `missing CSP directive: ${directive}`);

  return [...block[1].matchAll(/(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/g)].map(
    (match) => match[1] ?? match[2] ?? match[3],
  );
}

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

test('the CSP permits only required product video and embed origins', () => {
  const mediaSrc = getCspDirectiveSources('mediaSrc');
  const frameSrc = getCspDirectiveSources('frameSrc');

  assert.deepEqual(mediaSrc, [
    "'self'",
    'https://cdn.shopify.com',
    'https://${context.env.PUBLIC_STORE_DOMAIN}',
  ]);
  assert.deepEqual(frameSrc, [
    "'self'",
    'https://www.youtube.com',
    'https://player.vimeo.com',
  ]);

  for (const source of [...mediaSrc, ...frameSrc]) {
    assert.notEqual(source, '*');
    assert.notEqual(source, 'https:');
  }
});
