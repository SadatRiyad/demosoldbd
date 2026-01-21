import type { DealCategory } from "@/config/soldbd";
import { Home, Shirt, Smartphone, Sparkles, Tag, Utensils } from "lucide-react";

const DEFAULT_META: Record<Extract<DealCategory, string>, { label: string; Icon: typeof Smartphone }> = {
  Electronics: { label: "Electronics", Icon: Smartphone },
  Fashion: { label: "Fashion", Icon: Shirt },
  Food: { label: "Food", Icon: Utensils },
  Home: { label: "Home", Icon: Home },
  Beauty: { label: "Beauty", Icon: Sparkles },
};

export function getDealCategoryMeta(category: string): { label: string; Icon: typeof Smartphone } {
  const hit = (DEFAULT_META as Record<string, { label: string; Icon: typeof Smartphone }>)[category];
  return hit ?? { label: category, Icon: Tag };
}

// Back-compat for older call sites that still index into this map.
export const DEAL_CATEGORY_META = DEFAULT_META;
