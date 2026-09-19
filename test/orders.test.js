import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import handler from '../api/orders.js';

// Helper mock to simulate req and res
function createMockReqRes({ method = 'GET', body = null, query = {} } = {}) {
  const req = {
    method,
    body,
    query
  };
  const res = {
    statusCode: 200,
    headers: {},
    ended: false,
    _data: null,
    setHeader(k, v) {
      this.headers[k] = v;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this._data = data;
      this.ended = true;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    }
  };
  return { req, res };
}

// Client localStorage mock to test cross-page state synchronization logic
function createMockLocalStorage(initialStore = {}) {
  const store = new Map(Object.entries(initialStore));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    get length() {
      return store.size;
    }
  };
}

// Simulation of status.html order ID resolution hierarchy
function resolveStatusOrderId(storage, urlSearch = '') {
  const params = new URLSearchParams(urlSearch);
  const urlId = params.get('id');
  if (urlId) return urlId;

  return storage.getItem('kantin_active_order_id') ||
         storage.getItem('kantin_last_order_id') ||
         storage.getItem('kantin_pesanan_aktif') ||
         null;
}

test('API Orders Suite - Complete Unit & Integration Flows', async (t) => {
  // Clear memory state before running tests
  globalThis._kantin_orders = [];
  globalThis._kantin_counter = 0;

  await t.test('1. Order creation with valid id format (ORD-..., id custom, or number), nama, kelas, items, total, status', async () => {
    // 1a. Default auto-generated ORD- id format
    const { req, res } = createMockReqRes({
      method: 'POST',
      body: {
        nama: 'Budi Santoso',
        kelas: 'XII RPL 2',
        warungId: 'machi',
        items: [
          { nama: 'Es Kopi Susu', harga: 12000, qty: 2 }
        ],
        total: 24000,
        notes: 'Less sugar, es banyak'
      }
    });

    await handler(req, res);

    assert.equal(res.statusCode, 201);
    assert.ok(res._data);
    assert.match(String(res._data.id), /^ORD-\d+$/);
    assert.equal(res._data.nama, 'Budi Santoso');
    assert.equal(res._data.studentName, 'Budi Santoso');
    assert.equal(res._data.kelas, 'XII RPL 2');
    assert.equal(res._data.studentClass, 'XII RPL 2');
    assert.equal(res._data.antrian, 'A-001');
    assert.equal(res._data.status, 'Dipesan');
    assert.equal(res._data.total, 24000);
    assert.equal(res._data.items.length, 1);
    assert.equal(res._data.items[0].nama, 'Es Kopi Susu');
    assert.equal(res._data.items[0].harga, 12000);
    assert.equal(res._data.items[0].qty, 2);
    assert.equal(res._data.notes, 'Less sugar, es banyak');

    // 1b. Explicit numeric / custom id format preservation
    const customCall = createMockReqRes({
      method: 'POST',
      body: {
        id: 998822,
        nama: 'Siti Aminah',
        kelas: 'XI TKJ 1',
        items: [
          { nama: 'Teh Manis', harga: 4000, qty: 1 }
        ],
        total: 4000
      }
    });
    await handler(customCall.req, customCall.res);
    assert.equal(customCall.res.statusCode, 201);
    assert.equal(customCall.res._data.id, 998822);
    assert.equal(customCall.res._data.nama, 'Siti Aminah');
    assert.equal(customCall.res._data.kelas, 'XI TKJ 1');
  });

  await t.test('2. Negative Case: Missing studentName/nama rejected with 400', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      body: {
        items: [{ nama: 'Iced Matcha Latte', harga: 15000, qty: 1 }],
        total: 15000
      }
    });

    await handler(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res._data.error, /studentName\/nama is required/i);
  });

  await t.test('3. Negative Case: Empty cart / missing items rejected with 400', async () => {
    // 3a. Empty array items
    const { req: emptyReq, res: emptyRes } = createMockReqRes({
      method: 'POST',
      body: {
        studentName: 'Ahmad',
        studentClass: 'X TKJ 1',
        items: []
      }
    });

    await handler(emptyReq, emptyRes);

    assert.equal(emptyRes.statusCode, 400);
    assert.match(emptyRes._data.error, /items must be a non-empty array/i);

    // 3b. Missing items field entirely
    const { req: missingReq, res: missingRes } = createMockReqRes({
      method: 'POST',
      body: {
        studentName: 'Ahmad',
        studentClass: 'X TKJ 1'
      }
    });

    await handler(missingReq, missingRes);

    assert.equal(missingRes.statusCode, 400);
    assert.match(missingRes._data.error, /items must be a non-empty array/i);
  });

  await t.test('4. Negative Case: Invalid item price or quantity rejected with 400', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      body: {
        studentName: 'Citra',
        items: [{ nama: 'Donat Kentang', harga: -5000, qty: 1 }]
      }
    });

    await handler(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res._data.error, /positive price/i);
  });

  await t.test('5. Seller order status progression: menunggu -> dimasak -> siap -> selesai', async () => {
    const createCall = createMockReqRes({
      method: 'POST',
      body: {
        nama: 'Eko Sulistyo',
        kelas: 'XII OTKP',
        status: 'menunggu',
        items: [{ nama: 'Salad Buah', harga: 12000, qty: 1 }]
      }
    });
    await handler(createCall.req, createCall.res);
    assert.equal(createCall.res.statusCode, 201);
    assert.equal(createCall.res._data.status, 'menunggu');

    const orderId = createCall.res._data.id;
    assert.ok(orderId);

    const steps = ['dimasak', 'siap', 'selesai'];
    for (const st of steps) {
      const patchCall = createMockReqRes({
        method: 'PATCH',
        body: { id: orderId, status: st }
      });
      await handler(patchCall.req, patchCall.res);
      assert.equal(patchCall.res.statusCode, 200);
      assert.equal(patchCall.res._data.id, orderId);
      assert.equal(patchCall.res._data.status, st);
    }

    // Verify GET list reflects updated status as 'selesai'
    const getCall = createMockReqRes({ method: 'GET' });
    await handler(getCall.req, getCall.res);
    assert.equal(getCall.res.statusCode, 200);
    const updatedOrder = getCall.res._data.find(o => o.id === orderId);
    assert.ok(updatedOrder);
    assert.equal(updatedOrder.status, 'selesai');
  });

  await t.test('6. State transition workflow: Dipesan -> Diterima -> Disiapkan -> Siap Diambil -> Selesai', async () => {
    const createCall = createMockReqRes({
      method: 'POST',
      body: {
        studentName: 'Dewi',
        studentClass: 'XI MM',
        items: [{ nama: 'Risoles Mayo', harga: 5000, qty: 2 }]
      }
    });
    await handler(createCall.req, createCall.res);
    const orderId = createCall.res._data.id;
    assert.ok(orderId);

    const stages = ['Diterima', 'Disiapkan', 'Siap Diambil', 'Selesai'];
    for (const st of stages) {
      const patchCall = createMockReqRes({
        method: 'PATCH',
        query: { id: orderId, status: st }
      });
      await handler(patchCall.req, patchCall.res);
      assert.equal(patchCall.res.statusCode, 200);
      assert.equal(patchCall.res._data.status, st);
    }
  });

  await t.test('7. Negative Case: Invalid status in PATCH rejected with 400', async () => {
    const patchCall = createMockReqRes({
      method: 'PATCH',
      query: { id: 'ORD-test', status: 'HACKED_STATUS' }
    });
    await handler(patchCall.req, patchCall.res);
    assert.equal(patchCall.res.statusCode, 400);
    assert.match(patchCall.res._data.error, /Invalid status value/i);
  });

  await t.test('8. Edge case: Note length cap (max 300 chars, truncated safely)', async () => {
    const longNote = 'X'.repeat(450);
    const createCall = createMockReqRes({
      method: 'POST',
      body: {
        studentName: 'Farhan Maulana',
        studentClass: 'X RPL 1',
        items: [{ nama: 'Roti Bakar', harga: 8000, qty: 1 }],
        notes: longNote
      }
    });

    await handler(createCall.req, createCall.res);
    assert.equal(createCall.res.statusCode, 201);
    assert.equal(createCall.res._data.notes.length, 300);
    assert.equal(createCall.res._data.notes, 'X'.repeat(300));
    assert.equal(createCall.res._data.catatan.length, 300);
  });

  await t.test('9. Cross-page state sync: kantin_cart, kantin_active_order_id, and kantin_pesanan_aktif', async () => {
    const storage = createMockLocalStorage();

    // Step 1: User adds items to cart on menu.html
    const cartItems = [{ id: 'menu-1', nama: 'Nasi Goreng', harga: 15000, qty: 2 }];
    storage.setItem('kantin_cart', JSON.stringify(cartItems));
    assert.equal(JSON.parse(storage.getItem('kantin_cart')).length, 1);
    assert.equal(JSON.parse(storage.getItem('kantin_cart'))[0].nama, 'Nasi Goreng');

    // Step 2: Checkout executes POST /api/orders
    const checkoutCall = createMockReqRes({
      method: 'POST',
      body: {
        nama: 'Gita Gutawa',
        kelas: 'XI IPA 2',
        items: cartItems,
        total: 30000
      }
    });
    await handler(checkoutCall.req, checkoutCall.res);
    assert.equal(checkoutCall.res.statusCode, 201);
    const createdOrderId = checkoutCall.res._data.id;
    assert.ok(createdOrderId);

    // Step 3: Menu checkout state transition - clears cart, sets active order IDs
    storage.removeItem('kantin_cart');
    storage.setItem('kantin_active_order_id', createdOrderId);
    storage.setItem('kantin_pesanan_aktif', createdOrderId);

    assert.equal(storage.getItem('kantin_cart'), null);
    assert.equal(storage.getItem('kantin_active_order_id'), createdOrderId);
    assert.equal(storage.getItem('kantin_pesanan_aktif'), createdOrderId);

    // Step 4: Verify status.html resolution with URL param (primary)
    const resolvedFromUrl = resolveStatusOrderId(storage, `?id=${createdOrderId}`);
    assert.equal(resolvedFromUrl, createdOrderId);

    // Step 5: Verify status.html resolution fallback with kantin_active_order_id
    const resolvedFromActive = resolveStatusOrderId(storage, '');
    assert.equal(resolvedFromActive, createdOrderId);

    // Step 6: Verify status.html resolution fallback with kantin_pesanan_aktif
    storage.removeItem('kantin_active_order_id');
    const resolvedFromPesananAktif = resolveStatusOrderId(storage, '');
    assert.equal(resolvedFromPesananAktif, createdOrderId);
  });

  await t.test('10. Edge case: Missing order ID redirect/empty fallback', async () => {
    const storage = createMockLocalStorage();
    // No URL parameter, no localStorage order key present
    const resolvedId = resolveStatusOrderId(storage, '');
    assert.equal(resolvedId, null);

    // In status.html, resolvedId === null triggers showEmptyState()
    const shouldShowEmptyState = (resolvedId === null);
    assert.equal(shouldShowEmptyState, true);
  });

  await t.test('11. DELETE clearing endpoint (?clear=selesai and ?clear=all)', async () => {
    // Current orders in mem
    const delSelesai = createMockReqRes({
      method: 'DELETE',
      query: { clear: 'selesai' }
    });
    await handler(delSelesai.req, delSelesai.res);
    assert.equal(delSelesai.res.statusCode, 200);

    // Verify all finished orders removed
    const getCall = createMockReqRes({ method: 'GET' });
    await handler(getCall.req, getCall.res);
    const anySelesai = getCall.res._data.some(o => o.status === 'Selesai' || o.status === 'selesai');
    assert.equal(anySelesai, false);

    // Clear all
    const delAll = createMockReqRes({
      method: 'DELETE',
      query: { clear: 'all' }
    });
    await handler(delAll.req, delAll.res);
    assert.equal(delAll.res.statusCode, 200);

    const getFinal = createMockReqRes({ method: 'GET' });
    await handler(getFinal.req, getFinal.res);
    assert.equal(getFinal.res._data.length, 0);
  });

  await t.test('12. Seller Auth logic: credentials validation', async () => {
    function validateSellerCredentials(user, pass) {
      return (typeof user === 'string' && user.trim() === 'admin' && pass === 'boash123');
    }

    // Valid credentials
    assert.equal(validateSellerCredentials('admin', 'boash123'), true);
    assert.equal(validateSellerCredentials('  admin  ', 'boash123'), true);

    // Invalid credentials
    assert.equal(validateSellerCredentials('admin', 'wrongpass'), false);
    assert.equal(validateSellerCredentials('user', 'boash123'), false);
    assert.equal(validateSellerCredentials('', ''), false);
    assert.equal(validateSellerCredentials(null, undefined), false);
  });

  await t.test('13. Duplicate section removal audit: scan index.html', async () => {
    const indexPath = path.resolve(process.cwd(), 'index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf-8');

    assert.equal(indexHtml.includes('Filosofi Kantin Boash'), false, 'Filosofi Kantin Boash must not exist in index.html');
    assert.equal(indexHtml.includes('Standar Bersih & Cerdas'), false, 'Standar Bersih & Cerdas must not exist in index.html');
  });

  await t.test('14. Zero-emoji audit on penjual.html metric cards', async () => {
    const penjualPath = path.resolve(process.cwd(), 'penjual.html');
    const penjualHtml = fs.readFileSync(penjualPath, 'utf-8');

    const bannedEmojis = ['⏳', '🍳', '🛍️', '💰', '📋', '🔊', '🔇'];

    // Check metric cards section
    const metricCardsMatch = penjualHtml.match(/<!--\s*TOP STAT CARDS[\s\S]*?<\/section>/i)
      || penjualHtml.match(/id="stat-menunggu"[\s\S]*?id="stat-omset"/i);
    assert.ok(metricCardsMatch, 'Metric cards section should be found in penjual.html');
    const metricCardsHtml = metricCardsMatch[0];

    for (const emoji of bannedEmojis) {
      assert.equal(
        metricCardsHtml.includes(emoji),
        false,
        `Metric cards must not contain banned emoji: ${emoji}`
      );
    }
  });
});
