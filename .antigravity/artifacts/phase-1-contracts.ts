/**
 * Phase 1 Contract Definitions & Zod Schemas
 * Project: Kantin Boash Multi-Page Architecture & Dedicated Seller Dashboard
 * Grounded in: phase-0-recon.json, phase-0-research.json, design-intel.json, phase-0-visual-baseline.json
 */

import { z } from "zod";

// ==========================================
// 1. DESIGN TOKENS (Persistent Machi Aesthetic)
// ==========================================
export const DesignTokens = {
  brand: {
    name: "Kantin Boash",
    wordmark: "boash",
    tagline: "Kopi & Kudapan Kantin. Momen Terbaik Sekolah.",
  },
  colors: {
    background: "#F0F9FF",
    surface: "#FFFFFF",
    primary: "#1A1A1A", // Espresso
    skyGradient: {
      start: "#64B5F6",
      mid: "#B0E0E6",
      end: "#F0F9FF",
      pureWhite: "#FFFFFF",
    },
    pastels: {
      peach: "#FCE4D6",
      matcha: "#E2EFDA",
      mango: "#FFF2CC",
      berry: "#F8CECC",
    },
    typography: {
      primary: "#1A1A1A",
      secondary: "#374151",
      muted: "#6B7280",
      inverse: "#FFFFFF",
    },
    status: {
      ordered: { bg: "#E0F2FE", text: "#0369A1", label: "Dipesan" },
      accepted: { bg: "#E0E7FF", text: "#3730A3", label: "Diterima" },
      preparing: { bg: "#FEF3C7", text: "#92400E", label: "Sedang Disiapkan" },
      ready: { bg: "#D1FAE5", text: "#065F46", label: "Siap Diambil" },
      completed: { bg: "#F3F4F6", text: "#374151", label: "Selesai" },
    },
  },
  typography: {
    displayFont: "'Plus Jakarta Sans', sans-serif",
    bodyFont: "'Inter', sans-serif",
    lineHeightLimitCh: 80,
  },
  motion: {
    heroFloatDurationS: 4,
    minTouchTargetPx: 44,
  },
} as const;

// ==========================================
// 2. CORE SCHEMAS & ENTITY CONTRACTS
// ==========================================

export const OrderStatusSchema = z.enum([
  "Dipesan",
  "Diterima",
  "Disiapkan",
  "Siap Diambil",
  "Selesai",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const MenuItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(250),
  price: z.number().int().positive(),
  category: z.enum(["minuman", "makanan", "snack", "beverage", "meal"]),
  warung: z.string().min(1),
  badge: z.string().optional(),
  pastelBg: z.enum(["#FCE4D6", "#E2EFDA", "#FFF2CC", "#F8CECC", "peach", "matcha", "mango", "berry"]).optional(),
  image: z.string().optional(),
  available: z.boolean().default(true),
});
export type MenuItem = z.infer<typeof MenuItemSchema>;

export const CartItemSchema = z.object({
  item: MenuItemSchema,
  quantity: z.number().int().min(1).max(99),
  notes: z.string().max(140).default(""),
});
export type CartItem = z.infer<typeof CartItemSchema>;

export const OrderPayloadSchema = z.object({
  studentName: z.string().trim().min(2, "Nama minimal 2 karakter").max(60, "Nama maksimal 60 karakter"),
  studentClass: z.string().trim().min(1, "Kelas wajib diisi").max(20),
  items: z.array(CartItemSchema).min(1, "Keranjang tidak boleh kosong"),
  totalAmount: z.number().int().positive(),
  notes: z.string().max(300, "Catatan terlalu panjang (maks 300 karakter)").default(""),
});
export type OrderPayload = z.infer<typeof OrderPayloadSchema>;

export const OrderRecordSchema = z.object({
  id: z.string().min(1),
  queueNumber: z.number().int().positive(),
  studentName: z.string(),
  studentClass: z.string(),
  items: z.array(CartItemSchema),
  totalAmount: z.number().int().positive(),
  status: OrderStatusSchema,
  createdAt: z.string().datetime().or(z.string()),
  notes: z.string().optional().default(""),
});
export type OrderRecord = z.infer<typeof OrderRecordSchema>;

export const OrdersApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(OrderRecordSchema).optional(),
  order: OrderRecordSchema.optional(),
  error: z.string().optional(),
});
export type OrdersApiResponse = z.infer<typeof OrdersApiResponseSchema>;

// ==========================================
// 3. MULTI-PAGE ROUTE & ARCHITECTURE CONTRACTS
// ==========================================

export const PageRoutes = {
  landing: "index.html",
  menu: "menu.html",
  status: "status.html",
  penjual: "penjual.html",
} as const;

export const LocalStorageKeys = {
  cart: "kantin_cart",
  activeOrderId: "kantin_active_order_id",
  lastOrder: "kantin_last_order",
  soundEnabled: "kantin_penjual_sound",
  ordersFallback: "kantin_orders",
  counterFallback: "kantin_counter",
} as const;

// ==========================================
// 4. MOTION LIFECYCLE & EFFECT FALLBACKS
// ==========================================

export const MotionLifecycleContract = {
  primaryOrchestratedMoment: "hero-floating-cups",
  maxOrchestratedMomentsPerPage: 1,
  animationProperties: {
    duration: "4s",
    timingFunction: "ease-in-out",
    iterationCount: "infinite",
    direction: "alternate",
  },
  reducedMotionFallback: {
    mediaQuery: "(prefers-reduced-motion: reduce)",
    action: "animation: none !important; transform: none !important;",
  },
  unmountCleanup: {
    action: "Cancel requestAnimationFrame, remove document event listeners, purge polling intervals on pagehide/unload",
  },
} as const;

// ==========================================
// 5. REAL LOCKED END-USER PAGE COPY
// ==========================================

export const LockedPageCopy = {
  brand: {
    name: "Kantin Boash",
    wordmark: "boash",
    subtitle: "Kantin Sekolah Modern & Digital",
  },
  landing: {
    headline: "Kopi & Kudapan Kantin. Momen Terbaik Sekolah.",
    subheadline: "Cold brew segar, matcha lembut, dan aneka menu kantin favorit. Pesan duluan tanpa antre berdesakan.",
    cta_menu: "Pesan Sekarang",
    cta_status: "Cek Status Pesanan",
    favorites_title: "Menu Favorit Siswa, Dingin & Segar",
    story_title: "Standar Baru Makan Siang di Sekolah",
    story_body: "Kantin Boash memadukan bahan lokal terbaik dengan kemudahan pemesanan digital. Dari cold brew segar hingga kudapan hangat, semua disiapkan tepat waktu saat bel istirahat berbunyi.",
    stats: {
      steep_time: "12 Jam",
      beans: "100% Biji Lokal",
      sugar: "Rendah Gula",
    },
    banner_text: "Bahan Segar Berkualitas. Kantin Sehat, Siswa Semangat.",
  },
  menu: {
    headline: "Daftar Menu Kantin Boash",
    subheadline: "Pilih makanan dan minuman favoritmu dari warung mitra kantin.",
    search_placeholder: "Cari makanan atau minuman...",
    warung_all: "Semua Menu",
    cart_title: "Keranjang Belanja",
    cart_empty_title: "Keranjang Masih Kosong",
    cart_empty_desc: "Pilih menu favoritmu sebelum bel istirahat berbunyi.",
    checkout_btn: "Lanjut ke Pembayaran",
    checkout_modal_title: "Konfirmasi Pesanan",
    name_label: "Nama Lengkap Siswa",
    class_label: "Kelas & Jurusan",
    notes_label: "Catatan Khusus (Opsional)",
    submit_order: "Kirim Pesanan Sekarang",
  },
  status: {
    headline: "Status Pesanan Kamu",
    subheadline: "Pantau antrean secara langsung dan ambil pesananmu tepat waktu.",
    empty_title: "Tidak Ada Pesanan Aktif",
    empty_desc: "Kamu belum memiliki pesanan aktif saat ini. Yuk buat pesanan baru dari menu.",
    back_to_menu_cta: "Buka Daftar Menu",
    queue_label: "Nomor Antrean Kamu",
    steps: {
      dipesan: "Pesanan Diterima Sistem",
      disiapkan: "Sedang Disiapkan di Dapur",
      siap: "Siap Diambil di Konter",
      selesai: "Pesanan Selesai",
    },
    pickup_instruction: "Tunjukkan layar atau kode QR ini ke petugas kantin saat mengambil pesanan.",
  },
  penjual: {
    headline: "Portal Pengelola Kantin Boash",
    subheadline: "Kelola alur antrean dapur dan pesanan masuk secara langsung.",
    sound_toggle_on: "Suara Notifikasi Aktif",
    sound_toggle_off: "Suara Notifikasi Hening",
    stats: {
      total: "Total Masuk",
      baru: "Pesanan Baru",
      disiapkan: "Sedang Dimasak",
      siap: "Siap Diambil",
      selesai: "Selesai",
    },
    tabs: {
      all: "Semua",
      dipesan: "Baru",
      disiapkan: "Disiapkan",
      siap: "Siap Diambil",
      selesai: "Selesai",
    },
    actions: {
      terima: "Terima Pesanan",
      siapkan: "Mulai Siapkan",
      siap: "Tandai Siap Diambil",
      selesaikan: "Selesaikan",
      clear_done: "Bersihkan Selesai",
    },
    empty_orders: "Belum ada pesanan masuk untuk status ini.",
  },
  footer: {
    wordmark: "boash",
    copyright: "© 2026 Kantin Boash. Momen Terbaik Sekolah.",
  },
} as const;
