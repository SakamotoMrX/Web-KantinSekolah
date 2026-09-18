let memOrders = globalThis._kantin_orders || (globalThis._kantin_orders = []);
let memCounter = globalThis._kantin_counter || (globalThis._kantin_counter = 0);

async function getRedis() {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis');
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

  const redis = await getRedis();

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

  // POST /api/orders -> create order
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    if (!body) return res.status(400).json({ error: 'Request body required' });

    const items = body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items must be a non-empty array' });
    }

    // Validate item structure
    for (const it of items) {
      const itemName = it.nama || it.name;
      const itemPrice = it.harga !== undefined ? it.harga : it.price;
      const itemQty = it.qty !== undefined ? it.qty : it.quantity;
      if (!itemName || typeof itemPrice !== 'number' || itemPrice <= 0 || !itemQty || itemQty <= 0) {
        return res.status(400).json({ error: 'Each item must have a valid name, positive price, and positive qty' });
      }
    }

    const rawName = body.studentName || body.nama;
    if (!rawName || typeof rawName !== 'string' || rawName.trim().length === 0) {
      return res.status(400).json({ error: 'studentName/nama is required' });
    }

    const studentName = rawName.trim().slice(0, 60);
    const studentClass = (body.studentClass || body.kelas || 'Umum').toString().trim().slice(0, 20);
    const warungId = body.warungId || body.warung || 'machi';
    const warungNama = body.warungNama || (warungId === 'machi' ? 'Machi Cold Brew Bar' : 'Kantin Sekolah');
    const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 300) : (typeof body.catatan === 'string' ? body.catatan.trim().slice(0, 300) : '');

    // Canonical items mapping
    const normalizedItems = items.map(it => ({
      nama: it.nama || it.name,
      name: it.name || it.nama,
      harga: it.harga !== undefined ? it.harga : it.price,
      price: it.price !== undefined ? it.price : it.harga,
      qty: it.qty !== undefined ? it.qty : it.quantity,
      quantity: it.quantity !== undefined ? it.quantity : it.qty
    }));

    const calculatedTotal = normalizedItems.reduce((acc, it) => acc + (it.harga * it.qty), 0);
    const total = typeof body.total === 'number' && body.total > 0 ? body.total : calculatedTotal;

    const validInitialStatuses = ['Dipesan', 'menunggu'];
    const initialStatus = validInitialStatuses.includes(body.status) ? body.status : 'Dipesan';

    try {
      let antrian;
      let newCounter;
      if (redis) {
        newCounter = await redis.incr('kantin:counter');
        antrian = 'A-' + String(newCounter).padStart(3,'0');
        const order = {
          id: body.id || 'ORD-' + Date.now(),
          antrian,
          nama: studentName,
          studentName,
          kelas: studentClass,
          studentClass,
          warung: warungId,
          warungId,
          warungNama,
          items: normalizedItems,
          total,
          totalAmount: total,
          notes,
          catatan: notes,
          waktu: body.waktu || new Date().toLocaleString('id-ID'),
          status: initialStatus
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
          nama: studentName,
          studentName,
          kelas: studentClass,
          studentClass,
          warung: warungId,
          warungId,
          warungNama,
          items: normalizedItems,
          total,
          totalAmount: total,
          notes,
          catatan: notes,
          waktu: body.waktu || new Date().toLocaleString('id-ID'),
          status: initialStatus
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

    const validStatuses = [
      'Dipesan', 'Diterima', 'Disiapkan', 'Siap Diambil', 'Selesai',
      'menunggu', 'dimasak', 'siap', 'selesai', 'dibatalkan'
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
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
          orders = orders.filter(o => o.status !== 'Selesai' && o.status !== 'selesai');
          await redis.set('kantin:orders', orders);
          return res.status(200).json({ok:true, remaining:orders.length});
        }
        return res.status(400).json({error:'use ?clear=all or ?clear=selesai'});
      } else {
        if (clear === 'all') { memOrders.length = 0; globalThis._kantin_orders = memOrders; return res.status(200).json({ok:true}); }
        if (clear === 'selesai') {
          memOrders = memOrders.filter(o => o.status !== 'Selesai' && o.status !== 'selesai');
          globalThis._kantin_orders = memOrders;
          return res.status(200).json({ok:true, remaining: memOrders.length});
        }
        return res.status(400).json({error:'use ?clear=all or ?clear=selesai'});
      }
    } catch (e) { return res.status(500).json({error:String(e)}); }
  }

  return res.status(405).json({error:'Method not allowed'});
}
