import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_MODE } from "@/lib/api/config";
import { apiInvokeTyped } from "@/lib/api/client";
import { resolveNodeApiBaseUrl, setRuntimeNodeApiBaseUrl } from "@/lib/api/nodeBaseUrl";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

function normalizeApiBase(input: string) {
  const raw = input.trim();
  if (!raw) return "";
  let v = raw.replace(/\s+/g, "");
  v = v.replace(/\/api\/health\/?$/i, "");
  v = v.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  try {
    const u = new URL(v);
    return `${u.protocol}//${u.host}`;
  } catch {
    return v;
  }
}

function isValidHttpBase(v: string) {
  return /^https?:\/\//i.test(v);
}

export default function Health() {
  const { toast } = useToast();
  const [apiBaseDraft, setApiBaseDraft] = React.useState("");
  const resolvedBase = resolveNodeApiBaseUrl(import.meta.env.VITE_NODE_API_BASE_URL as string | undefined);
  const resolvedBaseOk = Boolean(resolvedBase) && isValidHttpBase(resolvedBase);

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

      {API_MODE === "node" && !resolvedBaseOk ? (
        <div className="mt-6 rounded-lg border bg-card p-4">
          <div className="text-sm font-medium">Express API base URL</div>
          <div className="mt-1 text-xs text-muted-foreground">
            In preview we can’t auto-guess your API host. Set it once (saved in this browser) then re-run checks.
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="https://api.sold.bd"
              value={apiBaseDraft || resolvedBase || ""}
              onChange={(e) => setApiBaseDraft(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              inputMode="url"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const normalized = normalizeApiBase(apiBaseDraft || resolvedBase || "");
                setApiBaseDraft(normalized);
                setRuntimeNodeApiBaseUrl(normalized);
                toast({ title: "Saved", description: "API base URL saved. Re-running health check…" });
                void q.refetch();
              }}
            >
              Save & test
            </Button>
          </div>
        </div>
      ) : null}

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
