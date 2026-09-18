/**
 * Phase 1 Contract Definitions & Zod Schemas
 * Kantin Sekolah Pre-Order & Machi Aesthetic Redesign
 */

import { z } from "zod";

// ==========================================
// 1. DESIGN TOKENS
// ==========================================
export const DesignTokens = {
  colors: {
    skyGradient: {
      start: "#87CEEB",
      mid: "#B0E0E6",
      end: "#E3F2FD",
      pureWhite: "#FFFFFF",
    },
    pastels: {
      peach: "#FCE4D6",
      matcha: "#E2EFDA",
      mango: "#FFF2CC",
      berry: "#F8CECC",
    },
    typography: {
      primary: "#111111",
      secondary: "#374151",
      muted: "#6B7280",
      inverse: "#FFFFFF",
    },
    accents: {
      blue: "#64B5F6",
      blueLight: "#90CAF9",
      green: "#4CAF50",
      darkSectionBg: "#111111",
    },
    status: {
      ordered: "#F59E0B",
      accepted: "#3B82F6",
      preparing: "#8B5CF6",
      ready: "#10B981",
      completed: "#6B7280",
    },
  },
  typography: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
  category: z.enum(["beverage", "snack", "meal"]),
  badge: z.string().optional(),
  pastelBg: z.enum(["#FCE4D6", "#E2EFDA", "#FFF2CC", "#F8CECC"]),
  image: z.string(),
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
  notes: z.string(),
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
// 3. MOTION LIFECYCLE & EFFECT FALLBACKS
// ==========================================

export const MotionLifecycleContract = {
  primaryOrchestratedMoment: "hero-floating-cups",
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
  webglShaderFallback: {
    when: "WebGL unsupported or context lost",
    action: "Render CSS linear-gradient sky-bg (#87CEEB to #E3F2FD) without three.js canvas",
  },
  unmountCleanup: {
    action: "Cancel requestAnimationFrame, remove document event listeners, purge cart timers",
  },
} as const;

// ==========================================
// 4. LOCKED PAGE COPY CONTRACT
// ==========================================

export const LockedPageCopy = {
  headline: "Kopi & Kudapan Kantin. Momen Terbaik Sekolah.",
  subheadline: "Cold brew segar, matcha lembut, dan aneka snack kantin favorit. Pesan duluan tanpa antre.",
  cta_primary: "Pesan Sekarang",
  cta_secondary: "Jelajahi Menu",
  section_favorites: "Menu Favorit Siswa, Dingin & Segar",
  stats: {
    steep_time: "12 Jam",
    beans: "100% Biji Lokal",
    sugar: "Rendah Gula",
  },
  banner_text: "Bahan Segar Berkualitas. Kantin Sehat, Siswa Semangat.",
  footer_brand: "kantin",
  footer_sub: "Kantin Sekolah Modern & Digital",
  empty_state: {
    title: "Keranjang Masih Kosong",
    subtitle: "Pilih kopi atau camilan favoritmu sebelum bel istirahat berbunyi.",
    action: "Mulai Memilih",
  },
  confirmation_message: "Pesanan Berhasil Dikirim ke Kantin",
} as const;
