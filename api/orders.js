import { Redis } from '@upstash/redis';

let memOrders = globalThis._kantin_orders || (globalThis._kantin_orders = []);
let memCounter = globalThis._kantin_counter || (globalThis._kantin_counter = 0);

function getRedis() {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      return Redis.fromEnv();
    }
  } catch {}
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const redis = getRedis();

  // GET /api/orders  -> list all orders
  if (req.method === 'GET') {
    try {
      if (redis) {
        const data = await redis.get('kantin:orders');
        const orders = Array.isArray(data) ? data : (data ? JSON.parse(data) : []);
        // upstash get may return array or null; handle both
        if (Array.isArray(data)) return res.status(200).json(data);
        return res.status(200).json(orders);
      } else {
        return res.status(200).json(memOrders);
      }
    } catch (e) {
      return res.status(200).json(memOrders);
    }
  }

  // POST /api/orders -> create order, body: {id, warungId, warungNama, items, total, waktu, status?}
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    if (!body || !body.items) return res.status(400).json({error:'items required'});
    try {
      let antrian;
      let newCounter;
      if (redis) {
        newCounter = await redis.incr('kantin:counter');
        antrian = 'A-' + String(newCounter).padStart(3,'0');
        const order = {
          id: body.id || 'ORD-' + Date.now(),
          antrian,
          warungId: body.warungId,
          warungNama: body.warungNama,
          items: body.items,
          total: body.total,
          waktu: body.waktu || new Date().toLocaleString('id-ID'),
          status: 'Dipesan'
        };
        let orders = await redis.get('kantin:orders');
        if (!orders) orders = [];
        else if (typeof orders === 'string') { try { orders = JSON.parse(orders); } catch { orders = []; } }
        if (!Array.isArray(orders)) orders = [];
        orders.push(order);
        await redis.set('kantin:orders', orders);
        return res.status(201).json(order);
      } else {
        memCounter++;
        globalThis._kantin_counter = memCounter;
        antrian = 'A-' + String(memCounter).padStart(3,'0');
        const order = {
          id: body.id || 'ORD-' + Date.now(),
          antrian,
          warungId: body.warungId,
          warungNama: body.warungNama,
          items: body.items,
          total: body.total,
          waktu: body.waktu || new Date().toLocaleString('id-ID'),
          status: 'Dipesan'
        };
        memOrders.push(order);
        return res.status(201).json(order);
      }
    } catch (e) {
      console.error(e);
      return res.status(500).json({error:String(e.message||e)});
    }
  }

  // PATCH /api/orders?id=ORD-123&status=Diterima  OR body {id,status}
  if (req.method === 'PATCH') {
    let id = req.query.id;
    let status = req.query.status;
    if (!id || !status) {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
      if (body) { id = id || body.id; status = status || body.status; }
    }
    if (!id || !status) return res.status(400).json({error:'id and status required'});
    try {
      if (redis) {
        let orders = await redis.get('kantin:orders');
        if (!orders) orders = [];
        else if (typeof orders === 'string') { try { orders = JSON.parse(orders); } catch { orders = []; } }
        if (!Array.isArray(orders)) orders = [];
        const o = orders.find(x => x.id === id);
        if (!o) return res.status(404).json({error:'not found'});
        o.status = status;
        await redis.set('kantin:orders', orders);
        return res.status(200).json(o);
      } else {
        const o = memOrders.find(x => x.id === id);
        if (!o) return res.status(404).json({error:'not found'});
        o.status = status;
        return res.status(200).json(o);
      }
    } catch (e) {
      return res.status(500).json({error:String(e)});
    }
  }

  // DELETE /api/orders?clear=selesai  -> hapus selesai, ?clear=all -> hapus semua
  if (req.method === 'DELETE') {
    const clear = req.query.clear;
    try {
      if (redis) {
        if (clear === 'all') {
          await redis.set('kantin:orders', []);
          return res.status(200).json({ok:true});
        } else if (clear === 'selesai') {
          let orders = await redis.get('kantin:orders');
          if (!orders) orders = [];
          else if (typeof orders === 'string') { try { orders = JSON.parse(orders); } catch { orders = []; } }
          orders = orders.filter(o => o.status !== 'Selesai');
          await redis.set('kantin:orders', orders);
          return res.status(200).json({ok:true, remaining:orders.length});
        }
        return res.status(400).json({error:'use ?clear=all or ?clear=selesai'});
      } else {
        if (clear === 'all') { memOrders.length = 0; return res.status(200).json({ok:true}); }
        if (clear === 'selesai') { const before=memOrders.length; memOrders = memOrders.filter(o=>o.status!=='Selesai'); globalThis._kantin_orders = memOrders; return res.status(200).json({ok:true}); }
        return res.status(400).json({error:'use ?clear=all or ?clear=selesai'});
      }
    } catch (e) { return res.status(500).json({error:String(e)}); }
  }

  return res.status(405).json({error:'Method not allowed'});
}
