import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {createContentSecurityPolicy} from '@shopify/hydrogen';

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

function getBalancedBlock(source, marker) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `missing source marker: ${marker}`);

  const openIndex = source.indexOf('{', markerIndex + marker.length);
  assert.notEqual(openIndex, -1, `missing block after: ${marker}`);

  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(openIndex + 1, index);
  }

  assert.fail(`unclosed block after: ${marker}`);
}

function getSourceRange(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing source marker: ${startMarker}`);

  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, `missing source marker: ${endMarker}`);

  return source.slice(start, end + endMarker.length);
}

function getGraphqlDocument(source, declaration) {
  const declarationIndex = source.indexOf(declaration);
  assert.notEqual(declarationIndex, -1, `missing GraphQL document: ${declaration}`);

  const start = source.indexOf('`', declarationIndex);
  const end = source.indexOf('` as const;', start + 1);
  assert.notEqual(start, -1, `missing GraphQL start: ${declaration}`);
  assert.notEqual(end, -1, `missing GraphQL end: ${declaration}`);
  return source.slice(start + 1, end);
}

function getHeaderDirectiveSources(header, directive) {
  const value = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${directive} `));
  assert.ok(value, `missing rendered CSP directive: ${directive}`);
  return value.slice(directive.length + 1).split(' ');
}

test('the product query requests every Hydrogen product-media shape', () => {
  const productFragment = getGraphqlDocument(
    productRoute,
    'const PRODUCT_FRAGMENT',
  );
  const mediaConnection = getBalancedBlock(
    productFragment,
    'media(first: 12)',
  );
  const mediaNodes = getBalancedBlock(mediaConnection, 'nodes');
  const mediaImage = getBalancedBlock(mediaNodes, '... on MediaImage');
  const hostedVideo = getBalancedBlock(mediaNodes, '... on Video');
  const externalVideo = getBalancedBlock(mediaNodes, '... on ExternalVideo');
  const model3d = getBalancedBlock(mediaNodes, '... on Model3d');

  assert.match(mediaNodes, /\b__typename\b/);
  assert.match(mediaNodes, /\bid\b/);
  assert.match(mediaNodes, /\balt\b/);
  assert.match(mediaNodes, /\bmediaContentType\b/);
  assert.match(
    mediaNodes,
    /previewImage\s*\{\s*id\s+url\s+altText\s+width\s+height\s*\}/,
  );
  assert.match(
    mediaImage,
    /image\s*\{\s*__typename\s+id\s+url\s+altText\s+width\s+height\s*\}/,
  );
  assert.match(hostedVideo, /sources\s*\{\s*url\s+mimeType\s*\}/);
  assert.match(externalVideo, /\bembedUrl\b/);
  assert.match(externalVideo, /\bhost\b/);
  assert.match(model3d, /sources\s*\{\s*url\s+mimeType\s*\}/);
});

test('the product route isolates ordered gallery media from JSON-LD images', () => {
  const productComponent = getBalancedBlock(
    productRoute,
    'export default function Product()',
  );
  const productFragment = getGraphqlDocument(
    productRoute,
    'const PRODUCT_FRAGMENT',
  );
  const jsonLdBody = getBalancedBlock(structuredData, 'origin?: string;\n})');

  assert.match(productComponent, /<ProductGallery[\s\S]*?media=\{product\.media\.nodes\}/);
  assert.doesNotMatch(productComponent, /images=\{product\.images\.nodes\}/);
  assert.match(productFragment, /productImages:\s*images\(first: 12\)/);
  assert.doesNotMatch(productFragment, /^\s+images\(first: 12\)/m);
  assert.match(jsonLdBody, /const images = product\.productImages\.nodes/);
  assert.doesNotMatch(jsonLdBody, /product\.media\.nodes/);
});

test('the gallery uses Hydrogen media rendering and defers video loading', () => {
  const mediaKindBody = getBalancedBlock(
    productGallery,
    'function getMediaKind(media: ProductMedia)',
  );
  const renderableBody = getBalancedBlock(
    productGallery,
    'function isRenderableMedia(media: ProductMedia)',
  );
  const galleryDeclaration = getSourceRange(
    productGallery,
    'export function ProductGallery',
    'title: string;\n})',
  );
  const galleryBody = getBalancedBlock(productGallery, 'title: string;\n})');

  assert.match(productGallery, /import \{Image, MediaFile\} from '@shopify\/hydrogen'/);
  assert.match(galleryDeclaration, /media: ProductFragment\['media'\]\['nodes'\]/);
  assert.match(galleryBody, /<MediaFile/);
  assert.match(galleryBody, /preload: 'none'/);
  assert.match(galleryBody, /playsInline: true/);
  assert.match(galleryBody, /aria-label="Product media"/);
  assert.match(galleryBody, /role="group"/);
  assert.match(galleryBody, /<PlayIcon/);
  assert.match(mediaKindBody, /media\.__typename === 'ExternalVideo'/);
  assert.match(mediaKindBody, /media\.__typename === 'Model3d'/);
  assert.match(renderableBody, /case 'Video'/);
  assert.match(renderableBody, /case 'ExternalVideo'/);
  assert.match(renderableBody, /case 'Model3d'/);
});

test('the gallery preserves direct variant fallback and manual media selection', () => {
  const galleryBody = getBalancedBlock(productGallery, 'title: string;\n})');

  assert.match(
    galleryBody,
    /selectedMediaId \?\? selectedImageId \?\? fallbackMediaId/,
  );
  assert.match(galleryBody, /data=\{selectedImage\}/);
  assert.match(galleryBody, /key=\{selectedImage\.id\}/);
  assert.match(galleryBody, /\}, \[selectedImageId\]\);/);
});

test('external video data gets a descriptive fallback title without replacing alt', () => {
  const galleryBody = getBalancedBlock(productGallery, 'title: string;\n})');

  assert.match(
    galleryBody,
    /activeMedia\?\.__typename === 'ExternalVideo' &&\s*!activeMedia\.alt/,
  );
  assert.match(galleryBody, /\{\.\.\.activeMedia, alt: `\$\{title\} video`\}/);
  assert.match(galleryBody, /data=\{activeMediaData\}/);
});

test('the CSP permits only required product media, embed, and script sources', () => {
  const mediaSrc = getCspDirectiveSources('mediaSrc');
  const frameSrc = getCspDirectiveSources('frameSrc');
  const scriptSrc = getCspDirectiveSources('scriptSrc');

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
  assert.deepEqual(scriptSrc, [
    "'self'",
    'https://cdn.shopify.com',
    'https://shopify.com',
    'https://unpkg.com/@google/model-viewer@v1.12.1/dist/model-viewer.min.js',
  ]);

  const {header} = createContentSecurityPolicy({
    mediaSrc: mediaSrc.map((source) =>
      source === 'https://${context.env.PUBLIC_STORE_DOMAIN}'
        ? 'https://test.myshopify.com'
        : source,
    ),
    frameSrc,
    scriptSrc,
  });
  const renderedScriptSrc = getHeaderDirectiveSources(header, 'script-src');
  assert.deepEqual(renderedScriptSrc.slice(0, -1), scriptSrc);
  assert.match(renderedScriptSrc.at(-1), /^'nonce-[a-f0-9]+'$/);

  for (const source of [...mediaSrc, ...frameSrc, ...scriptSrc]) {
    assert.notEqual(source, '*');
    assert.notEqual(source, 'https:');
  }
});
