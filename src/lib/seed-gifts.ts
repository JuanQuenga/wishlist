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
  {
    id: "microduck",
    title: "Microduck",
    brand: "Pollen Robotics",
    description:
      "A compact, 25 cm biped robot with 15 motors, a camera, ToF LiDAR, and an included gamepad for robotics and physical AI experiments.",
    url: "https://store.pollen-robotics.com/products/microduck",
    imageUrl: "/products/microduck.jpg",
    price: "$399",
    priceNote: "Pre-order price before taxes and shipping; checked Oct 6, 2026.",
    category: "DIY electronics",
    accent: "rose",
    reserved: false,
  },
  {
    id: "satellite1-dev-kit",
    title: "Satellite1.1 Dev Kit (DIY)",
    brand: "FutureProofHomes",
    description:
      "An ESP32-S3 voice assistant and multi-sensor board with an XMOS audio chip, 25W amplifier, LED ring, and Home Assistant support.",
    url: "https://futureproofhomes.net/products/satellite1-pcb-dev-kit",
    imageUrl: "/products/satellite1-dev-kit.jpg",
    price: "$69.99",
    priceNote: "US version price checked Oct 7, 2026.",
    category: "DIY electronics",
    accent: "mint",
    reserved: false,
  },
  {
    id: "satellite1-speaker",
    title: "Satellite1.1 Smart Speaker",
    brand: "FutureProofHomes",
    description:
      "A pre-assembled private voice assistant and smart speaker with presence detection, built for Home Assistant and Music Assistant.",
    url: "https://futureproofhomes.net/products/satellite1-smart-speaker?variant=52504977146136",
    imageUrl: "/products/satellite1-speaker.jpg",
    price: "$134.99",
    priceNote: "Charcoal Gray, US version; price checked Oct 7, 2026.",
    category: "Smart home",
    accent: "lavender",
    reserved: false,
  },
];
