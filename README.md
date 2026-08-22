# Web-KantinSekolah — Pre-order Kantin Sekolah

Prototype aplikasi pre-order kantin sekolah dalam HTML + vanilla JS murni, tanpa backend dan tanpa build step.

## Fitur

### Siswa (`index.html`)
- Pilih warung → pilih menu → keranjang → checkout
- Nomor antrean otomatis (`A-001`, dst) + QR code pesanan
- Status pesanan live (polling tiap detik)

### Penjual (`penjual.html`)
- Dashboard pesanan masuk real-time (polling 1s + sync antar tab via `storage` event)
- Alur status: **Dipesan → Diterima → Disiapkan → Siap Diambil → Selesai**
- Filter per status, statistik ringkas, hapus pesanan selesai/semua

## Cara Run Lokal

```bash
python3 -m http.server 8000
```

Lalu buka http://localhost:8000 (siswa) dan http://localhost:8000/penjual.html (penjual).

## Struktur File

```
├── index.html    # Halaman siswa: menu, checkout, QR, lacak status
├── penjual.html  # Dashboard penjual: kelola status pesanan
├── vercel.json   # Konfigurasi deploy Vercel
├── .gitignore
└── README.md
```

## Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Di Vercel: **Add New Project** → connect repo GitHub.
3. Framework preset: **Other** — tanpa build command, tanpa output directory.
4. Deploy. `cleanUrls: true` di `vercel.json` menyembunyikan `.html` di URL.

## Batasan

- Data disimpan di `localStorage` — hanya tersinkron di device/browser yang sama (demo: buka siswa & penjual di 2 tab browser yang sama). **Bukan** cross-device.
- Tanpa autentikasi, tanpa database.

## Cross-device (NEW)

- Frontend sekarang fetch `/api/orders` (Vercel serverless) untuk sinkron antar device.
- Fallback ke localStorage jika API offline (file:// atau localhost tanpa `vercel dev`).
- Server hybrid: jika env `UPSTASH_REDIS_REST_URL`+`UPSTASH_REDIS_REST_TOKEN` ada → pakai Upstash Redis (persistent). Jika tidak → pakai `globalThis._kantin_orders` in-memory (ephemeral, cukup untuk demo, hilang saat cold start).
- Cara jadikan persistent 1 click: Vercel Dashboard → Storage → Upstash Redis → Create → connect ke project Web-KantinSekolah → redeploy. Tanpa setup tetap jalan cross-device selama function warm.

## Tech

- Tailwind CSS (CDN)
- qrcodejs
- `localStorage` keys: `kantin_orders`, `kantin_counter`, `kantin_last_order_id`
