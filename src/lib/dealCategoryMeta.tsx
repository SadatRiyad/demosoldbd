import type { DealCategory } from "@/config/soldbd";
import { Home, Shirt, Smartphone, Sparkles, Utensils } from "lucide-react";

export const DEAL_CATEGORY_META: Record<DealCategory, { label: string; Icon: typeof Smartphone }> = {
  Electronics: { label: "Electronics", Icon: Smartphone },
  Fashion: { label: "Fashion", Icon: Shirt },
  Food: { label: "Food", Icon: Utensils },
  Home: { label: "Home", Icon: Home },
  Beauty: { label: "Beauty", Icon: Sparkles },
};
