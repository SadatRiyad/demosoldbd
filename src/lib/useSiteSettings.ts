import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  id: string;
  brand_name: string;
  brand_tagline: string;
  header_kicker: string;
  hero_h1: string;
  hero_subtitle: string;
  whatsapp_phone_e164: string;
  whatsapp_default_message: string;
  next_drop_at: string | null;
  content: Record<string, unknown>;
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select(
          "id, brand_name, brand_tagline, header_kicker, hero_h1, hero_subtitle, whatsapp_phone_e164, whatsapp_default_message, next_drop_at, content",
        )
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SiteSettings | null;
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}
