import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FlashDeal } from "@/config/soldbd";

type DealsResponse = { deals: FlashDeal[] };

export function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<DealsResponse>("deals", { method: "GET" });
      if (error) throw error;
      return data?.deals ?? [];
    },
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}
