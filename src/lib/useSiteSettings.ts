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
      const { data, error } = await supabase.functions.invoke<{ settings: SiteSettings | null }>("site-settings", { method: "GET" });
      if (error) throw error;
      return data?.settings ?? null;
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}
