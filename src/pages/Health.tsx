import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_MODE } from "@/lib/api/config";
import { apiInvokeTyped } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

export default function Health() {
  const q = useQuery({
    queryKey: ["health-page", API_MODE],
    queryFn: async () => {
      const res = await apiInvokeTyped("health", { method: "GET", body: undefined });
      if (res.error) throw res.error;
      return res.data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const online = q.status === "success";
  const modeLabel = API_MODE === "node" ? "Node" : "Cloud";

  return (
    <div className="container py-12">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Backend health</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quick diagnostics for the active backend mode.</p>
        </div>

        <Badge
          variant="outline"
          className="w-fit gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground"
        >
          <span className={"inline-block size-2 rounded-full " + (online ? "bg-primary" : "bg-destructive")} aria-hidden="true" />
          <span>Mode: {modeLabel}</span>
          <span className="text-muted-foreground">•</span>
          <span>{online ? "Online" : q.isFetching ? "Checking" : "Offline"}</span>
        </Badge>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="shadow-premium">
          <CardHeader>
            <CardTitle className="text-base">Endpoint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="text-muted-foreground">Contract: <span className="font-mono">health GET</span></div>
            <div className="text-muted-foreground">Resolved by:</div>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Cloud mode: backend function <span className="font-mono">health</span></li>
              <li>Node mode: <span className="font-mono">GET /api/health</span> on your server</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-premium">
          <CardHeader>
            <CardTitle className="text-base">Last response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-80 overflow-auto rounded-lg border bg-card p-4 text-xs text-foreground">
              {q.status === "success" ? JSON.stringify(q.data, null, 2) : q.error ? String(q.error) : "—"}
            </pre>
            <div className="mt-3 text-xs text-muted-foreground">Tip: keep this page unlinked; just type the URL when needed.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
