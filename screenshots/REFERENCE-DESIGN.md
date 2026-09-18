# Machi Cold Brew Coffee & Cafe - Design Reference

## Visual Identity
- **Brand Name**: machi
- **Tagline**: Bold coffee. Better moments.
- **Sub-tagline**: The fan favorites, best served cold.

## Color System
### Sky Gradient (Hero Background)
- Top: #87CEEB (Sky Blue)
- Mid: #B0E0E6 (Powder Blue)
- Lower: #E3F2FD (Light Blue)
- Bottom: #FFFFFF (White)

### Pastel Product Colors
- Peach Cold Brew: #FCE4D6
- Matcha Cold Brew: #E2EFDA
- Mango Cold Brew: #FFF2CC
- Berry Cold Brew: #F8CECC

### Typography Colors
- Primary: #111111 (Espresso Black)
- Secondary: #374151 (Dark Gray)
- Muted: #6B7280 (Medium Gray)

### Accent Colors
- Blue: #64B5F6
- Blue Light: #90CAF9
- Green: #4CAF50

## Typography
- **Display/Hero**: Inter Black 900, 72-128px, letter-spacing -2
- **Headings**: Inter Bold 700
- **Body**: Inter Regular 400
- **Accent**: Inter Semibold 600, uppercase tracking-widest

## Sections (Top to Bottom)

### 1. Hero Section
- Full viewport height (min-h-[90vh])
- Sky gradient background with floating clouds
- Cloud layers: rear (0.25x speed), front (0.5x speed)
- Floating beverage cups: peach, matcha, mango, berry
- Splash water droplets scattered around cups
- Bold hero text: "Bold coffee. Better moments."
- Two CTA buttons: "Order Now" (dark), "Find a Store" (white outline)

### 2. Product Cards Grid
- 4-column grid (2 on mobile)
- Each card: pastel background, rounded-3xl, hover lift (-translate-y-2)
- Product image centered with drop-shadow
- "Fan Favorite" badge on select cards
- Product name, description, price, "Find a store" button

### 3. Editorial Stats Banner
- Dark background (#111111)
- Split layout: left text, right stats grid
- Left: "Brewed slow, made for sunny days" + description
- Right: 3-column stat grid
  - 18h Slow Steep
  - 100% Arabica
  - 0g Added Sugar
- Stats in accent blue (#90CAF9), large font-black

### 4. Organic Lifestyle Banner
- Soft green gradient (#E8F5E9 to #F1F8E9)
- "Certified Organic" badge with pulse dot
- Heading: "Real organic beans. Really good cold brew."
- Description text + "Learn Our Sourcing" CTA
- Decorative floating green circles

### 5. Giant Wordmark Footer
- White background
- Giant "machi" text: text-[16rem] font-black
- 4-column link grid: Products, Company, Support, Legal
- Copyright line

## Animations (CSS Only)
- @keyframes float: translateY(0) -> translateY(-6px) -> translateY(0) [3s]
- @keyframes float-slow: translateY(0) rotate(0) -> translateY(-12px) rotate(2deg) [5s]
- @keyframes float-diagonal: translateY(0) translateX(0) -> translateY(-20px) translateX(10px) [4s]
- Cloud drift: translateX(-10%) -> translateX(110%) [60s rear, 30s front]
- animation-delay staggered per element for natural feel

## Motion Cap
- ONE orchestrated moment: Hero floating cups + cloud parallax
- Everything else: static, no scroll animations

## Technical Stack
- HTML + Tailwind CSS CDN + vanilla JS
- No React/Vite dependency required
- Inter font via Google Fonts CDN
