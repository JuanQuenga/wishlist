import type { Gift } from "./wishlist";

export const seedGifts: Gift[] = [
  {
    id: "waveshare-amoled",
    title: "ESP32-S3 Touch AMOLED 1.75C",
    brand: "Waveshare",
    description:
      "A pocket-size circular AMOLED touchscreen with an ESP32-S3, housed in a CNC-machined aluminum case.",
    url: "https://www.waveshare.com/esp32-s3-touch-amoled-1.75c.htm",
    imageUrl: "/products/waveshare-amoled.jpg",
    price: "See store",
    priceNote: "Options and battery inclusion affect the price.",
    category: "DIY electronics",
    accent: "mint",
    reserved: false,
  },
  {
    id: "trmnl-kit",
    title: 'TRMNL 7.5" (OG) DIY Kit',
    brand: "Seeed Studio × TRMNL",
    description:
      "A 7.5-inch monochrome e-paper kit with an ESP32-S3 Plus driver board, rechargeable battery, and cable for a customizable dashboard.",
    url: "https://www.seeedstudio.com/TRMNL-7-5-Inch-OG-DIY-Kit-p-6481.html",
    imageUrl: "/products/trmnl-kit.webp",
    price: "$47.99",
    priceNote: "Seeed Studio official store price checked Oct 6, 2026.",
    category: "DIY electronics",
    accent: "lavender",
    reserved: false,
  },
];
