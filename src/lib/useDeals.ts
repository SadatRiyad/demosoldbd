import { useQuery } from "@tanstack/react-query";
import { apiInvoke } from "@/lib/api/client";
import type { FlashDeal } from "@/config/soldbd";

type DealsResponse = { deals: FlashDeal[] };

export function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await apiInvoke<DealsResponse>("deals", { method: "GET" });
      if (error) throw error;
      return data?.deals ?? [];
    },
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}
