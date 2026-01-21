export type DealCategory = "Electronics" | "Fashion" | "Food" | "Home" | "Beauty";

export type FlashDeal = {
  id: string;
  title: string;
  description: string;
  category: DealCategory;
  priceBdt?: number;
  imageUrl: string;
  stock: number;
  endsAt: string; // ISO
};

export const SOLD_BD = {
  brand: {
    name: "sold.bd",
    tagline: "Bangladesh’s Flash Deals Marketplace",
  },
  whatsapp: {
    phoneE164: "+8801700000000",
    defaultMessage: "Hi sold.bd! I want early access and updates about upcoming flash drops.",
  },
  nextDropAt: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
  deals: [
    {
      id: "d1",
      title: "Wireless Earbuds (Flash Drop)",
      description: "Low-latency sound, long battery life — limited units.",
      category: "Electronics",
      priceBdt: 1499,
      imageUrl: "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
      stock: 18,
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: "d2",
      title: "Premium Polo Shirt", 
      description: "Soft cotton blend with a clean fit — sizes run fast.",
      category: "Fashion",
      priceBdt: 899,
      imageUrl: "https://images.unsplash.com/photo-1520975682031-ae0c73f2f45b?auto=format&fit=crop&w=1200&q=80",
      stock: 0,
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 1.5).toISOString(),
    },
    {
      id: "d3",
      title: "Gourmet Snack Box", 
      description: "A curated mix of sweet + spicy favorites — today only.",
      category: "Food",
      priceBdt: 699,
      imageUrl: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=1200&q=80",
      stock: 42,
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: "d4",
      title: "Smart LED Bulb (2-Pack)",
      description: "App control + warm/cool modes for your room setup.",
      category: "Home",
      priceBdt: 599,
      imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=1200&q=80",
      stock: 11,
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 2.2).toISOString(),
    },
    {
      id: "d5",
      title: "Skincare Essentials Bundle",
      description: "Clean, gentle routine — limited bundle stock.",
      category: "Beauty",
      priceBdt: 1299,
      imageUrl: "https://images.unsplash.com/photo-1556228724-4b8b7f2cd7c2?auto=format&fit=crop&w=1200&q=80",
      stock: 7,
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 4.25).toISOString(),
    },
  ] satisfies FlashDeal[],
} as const;

export function whatsappOrderLink(message: string) {
  const base = "https://wa.me/";
  const phone = SOLD_BD.whatsapp.phoneE164.replace(/\+/g, "");
  return `${base}${phone}?text=${encodeURIComponent(message)}`;
}
