/**
 * Phase 1 Architecture Contracts: Kantin Boash Market Redesign & Seller Auth
 * Path: .opencode/artifacts/phase-1-contracts.ts & .antigravity/artifacts/phase-1-contracts.ts
 */

export interface SellerAuthContract {
  storageKey: "boash_seller_auth";
  validCredentials: {
    username: "admin";
    password: "boash123";
  };
  sessionState: "true" | null;
  authOverlayId: "seller-auth-modal";
  errorContainerId: "login-error-msg";
}

export interface SvgIconContract {
  viewBox: "0 0 24 24";
  fill: "none";
  stroke: "currentColor";
  strokeWidth: 2;
  strokeLinecap: "round";
  strokeLinejoin: "round";
  permittedIcons: [
    "clock",
    "flame",
    "chef",
    "check-circle",
    "bag",
    "wallet",
    "sound-on",
    "sound-off",
    "user",
    "lock",
    "search",
    "cart",
    "filter",
    "arrow-left",
    "arrow-right",
    "plus",
    "minus",
    "trash"
  ];
  banRules: {
    banEmojiInUIControls: true;
    banEmojiInPortalStatus: true;
    banEmojiInMetricCards: true;
    banEmojiInButtons: true;
    allowedEmojiScope: "ONLY fallback representation in food/beverage catalog items lacking image assets";
  };
}

export interface MarketCardContract {
  containerStyle: {
    bg: "bg-white";
    rounded: "rounded-3xl" | "rounded-2xl" | "rounded-[24px]";
    border: "border border-gray-100" | "border border-slate-100";
    shadow: "shadow-xs hover:shadow-md";
  };
  portionChip: {
    element: "span";
    classes: "px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold";
    allowedLabels: ["Reguler", "Large", "Jumbo", "Paket Hemat", "1 Porsi", string];
  };
  priceDisplay: {
    font: "font-display font-extrabold text-espresso text-lg sm:text-xl";
    prefix: "Rp ";
  };
  actionButton: {
    classes: "min-h-[44px] px-4 py-2.5 rounded-full bg-espresso text-white text-xs font-bold hover:bg-black transition flex items-center justify-center gap-2";
    hasFocusRing: true;
  };
}

export interface SectionRemovalContract {
  removedSections: [
    {
      page: "index.html";
      sectionId: "cerita";
      title: "Filosofi Kantin Boash";
    },
    {
      page: "index.html";
      sectionId: "lifestyle-banner";
      title: "Standar Bersih & Cerdas / Bahan Segar Berkualitas";
    }
  ];
  anchorAudit: {
    deadAnchor: "#cerita";
    status: "PURGED_OR_REDIRECTED_TO_MENU";
  };
}

export interface MotionLifecycleContract {
  motionMomentsCap: 1;
  orchestratedMoment: "Hero section initial fade-in or single status-badge pulse";
  unmountCleanup: "Modal DOM overlay hidden with class 'hidden', body scroll restored";
  prefersReducedMotion: "All CSS transitions disabled or instantaneous when prefers-reduced-motion is active";
}

export interface PageCopyContract {
  sellerPortal: {
    title: "Portal Pengelola & Dapur";
    subtitle: "Masuk untuk mengelola dan memproses pesanan siswa";
    loginCardTitle: "Masuk Portal Penjual";
    loginCardSubtitle: "Gunakan kredensial pengelola kantin resmi";
    usernamePlaceholder: "Username (admin)";
    passwordPlaceholder: "Kata sandi (boash123)";
    submitButton: "Buka Dapur";
    logoutButton: "Keluar";
    errorMessage: "Username atau kata sandi tidak valid.";
    stats: {
      waiting: "Pesanan Menunggu";
      cooking: "Sedang Dimasak";
      ready: "Siap Diambil";
      revenue: "Total Omset Hari Ini";
    };
    filterAll: "Semua Pesanan";
    filterWaiting: "Menunggu";
    filterCooking: "Dimasak";
    filterReady: "Siap";
    filterCompleted: "Selesai";
  };
  marketCatalog: {
    heroTitle: "Kantin Digital Sekolah";
    heroSubtitle: "Pesan makanan & minuman sehat tanpa antre, pantau status live langsung dari kelas.";
    portionReguler: "Porsi Reguler";
    portionLarge: "Porsi Kenyang";
    orderCta: "Tambah Pesanan";
    cartEmpty: "Keranjang belanja masih kosong.";
    orderConfirmation: "Pesanan Anda berhasil dikirim ke dapur.";
  };
}
