import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const productRoute = await readFile(
  new URL('../app/routes/products.$handle.tsx', import.meta.url),
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
