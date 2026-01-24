import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { API_MODE } from "@/lib/api/config";
import { getNodeAccessToken } from "@/lib/api/nodeAuth";

export function useIsAdmin() {
  const { user } = useAuth();

  if (API_MODE === "node") {
    // Node-mode admin access is enforced by the API via JWT claims.
    // On the client we only need a fast check to unlock the Admin UI.
    return useQuery({
      queryKey: ["is-admin", "node"],
      queryFn: async () => !!getNodeAccessToken(),
      staleTime: 5_000,
      refetchOnWindowFocus: false,
    });
  }

  return useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .limit(1);
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });
}
