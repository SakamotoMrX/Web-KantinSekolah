import test from 'node:test';
import assert from 'node:assert/strict';
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

test('API Orders Suite - Complete Unit & Integration Flows', async (t) => {
  // Clear memory state before running tests
  globalThis._kantin_orders = [];
  globalThis._kantin_counter = 0;

  await t.test('1. Order creation with valid payload returns 201 and sets queue number', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      body: {
        studentName: 'Budi Santoso',
        studentClass: 'XII RPL 2',
        warungId: 'machi',
        warungNama: 'Machi Cold Brew Bar',
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
    assert.equal(res._data.studentName, 'Budi Santoso');
    assert.equal(res._data.nama, 'Budi Santoso');
    assert.equal(res._data.studentClass, 'XII RPL 2');
    assert.equal(res._data.kelas, 'XII RPL 2');
    assert.equal(res._data.antrian, 'A-001');
    assert.equal(res._data.status, 'Dipesan');
    assert.equal(res._data.total, 24000);
    assert.equal(res._data.items.length, 1);
    assert.equal(res._data.notes, 'Less sugar, es banyak');
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
    const { req, res } = createMockReqRes({
      method: 'POST',
      body: {
        studentName: 'Ahmad',
        studentClass: 'X TKJ 1',
        items: []
      }
    });

    await handler(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res._data.error, /items must be a non-empty array/i);
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

  await t.test('5. State transition workflow: Dipesan -> Diterima -> Disiapkan -> Siap Diambil -> Selesai', async () => {
    // Create new order
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

    // Verify GET list reflects updated status
    const getCall = createMockReqRes({ method: 'GET' });
    await handler(getCall.req, getCall.res);
    assert.equal(getCall.res.statusCode, 200);
    const found = getCall.res._data.find(o => o.id === orderId);
    assert.ok(found);
    assert.equal(found.status, 'Selesai');
  });

  await t.test('6. Alternative lowercase state flow: menunggu -> dimasak -> siap -> selesai', async () => {
    const createCall = createMockReqRes({
      method: 'POST',
      body: {
        nama: 'Eko',
        kelas: 'XII OTKP',
        status: 'menunggu',
        items: [{ nama: 'Salad Buah', harga: 12000, qty: 1 }]
      }
    });
    await handler(createCall.req, createCall.res);
    assert.equal(createCall.res.statusCode, 201);
    assert.equal(createCall.res._data.status, 'menunggu');

    const orderId = createCall.res._data.id;

    for (const st of ['dimasak', 'siap', 'selesai']) {
      const patchCall = createMockReqRes({
        method: 'PATCH',
        body: { id: orderId, status: st }
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

  await t.test('8. Breaking scenario: STRESS-INPUT-OVERFLOW (truncate note to max 300 chars)', async () => {
    const longNote = 'A'.repeat(500);
    const longName = 'Budi '.repeat(30);

    const createCall = createMockReqRes({
      method: 'POST',
      body: {
        studentName: longName,
        items: [{ nama: 'Roti Bakar', harga: 8000, qty: 1 }],
        notes: longNote
      }
    });

    await handler(createCall.req, createCall.res);
    assert.equal(createCall.res.statusCode, 201);
    assert.equal(createCall.res._data.notes.length, 300);
    assert.ok(createCall.res._data.studentName.length <= 60);
  });

  await t.test('9. DELETE clearing endpoint (?clear=selesai and ?clear=all)', async () => {
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
});
