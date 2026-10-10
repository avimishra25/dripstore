// Read-only smoke check for a local or deployed portfolio demo.
const assert = require('node:assert/strict');
const base = new URL(process.argv[2] || 'http://127.0.0.1:10000');
if (!['localhost', '127.0.0.1'].includes(base.hostname) && base.protocol !== 'https:') throw new Error('Public staging must use HTTPS');
async function get(path, status = 200, type) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, status, path);
  if (type) assert.ok(response.headers.get('content-type')?.includes(type), path + ' content type');
  return response;
}
(async () => {
  assert.equal((await (await get('/api/ready', 200, 'application/json')).json()).ready, true);
  assert.equal((await (await get('/api/demo/status', 200, 'application/json')).json()).enabled, true);
  for (const path of ['/', '/products', '/checkout', '/admin/orders']) {
    const response = await get(path, 200, 'text/html');
    const html = await response.text();
    assert.ok(html.includes('id="root"'), path);
    if (path === '/') {
      const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match => match[1]);
      assert.ok(assets.length >= 2, 'Built JS and CSS present');
      for (const asset of assets) await get(asset, 200, asset.endsWith('.css') ? 'text/css' : 'javascript');
    }
  }
  const { products } = await (await get('/api/products?limit=100', 200, 'application/json')).json();
  assert.ok(products.length >= 12, 'Sample catalog present');
  let photos = 0;
  for (const product of products) for (const image of product.images) {
    if (image.startsWith('/demo/products/')) { await get(image, 200, 'image/jpeg'); photos++; }
  }
  assert.ok(photos >= 12, 'Bundled sample photos available');
  await get('/api/does-not-exist', 404, 'application/json');
  await get('/assets/missing.js', 404);
  console.log('PASS: readiness, demo mode, 4 direct SPA routes, JS/CSS, catalog, ' + photos + ' local photos, API 404, asset 404.');
  console.log('Target: ' + base.origin);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
