import { Badge } from "@/components/ui/badge";
import { API_MODE } from "@/lib/api/config";
import { apiInvokeTyped } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

type Props = {
  className?: string;
};

export default function BackendStatusPill({ className }: Props) {
  const q = useQuery({
    queryKey: ["health", API_MODE],
    queryFn: async () => {
      const res = await apiInvokeTyped("health", { method: "GET", body: undefined });
      if (res.error) throw res.error;
      return res.data;
    },
    // Don’t spam; just enough to catch outages.
    refetchInterval: 30_000,
    retry: 1,
  });

  const online = q.status === "success";
  const modeLabel = API_MODE === "node" ? "Node" : "Cloud";
  const statusLabel = online ? "Online" : q.isFetching ? "Checking" : "Offline";

  return (
    <Badge
      variant="outline"
      className={
        "gap-2 rounded-full border bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground " +
        (className ?? "")
      }
      title={online ? `Backend: ${modeLabel}` : `Backend: ${modeLabel} (unreachable)`}
    >
      <span className={"inline-block size-2 rounded-full " + (online ? "bg-primary" : "bg-destructive")} aria-hidden="true" />
      <span>Backend: {modeLabel}</span>
      <span className="text-muted-foreground">•</span>
      <span>{statusLabel}</span>
    </Badge>
  );
}
