import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiInvokeTyped } from "@/lib/api/client";
import { API_MODE } from "@/lib/api/config";
import { usePageMeta } from "@/lib/usePageMeta";
import { useQuery } from "@tanstack/react-query";

function resolvedApiBaseUrl(): string {
  const explicit = (import.meta.env.VITE_NODE_API_BASE_URL as string | undefined) ?? "";
  if (explicit.trim()) return explicit.trim().replace(/\/+$/, "");
  if (typeof window === "undefined") return "";
  const { protocol, hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") return "http://localhost:3001";
  const apiHost = hostname.startsWith("api.") ? hostname : `api.${hostname.replace(/^www\./, "")}`;
  return `${protocol}//${apiHost}`;
}

function StepRow({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4">
      <div className="min-w-0">
        <div className="font-semibold">{label}</div>
        {detail ? <div className="mt-1 text-sm text-muted-foreground">{detail}</div> : null}
      </div>
      <Badge
        variant="outline"
        className={
          "shrink-0 rounded-full px-3 py-1 text-xs font-semibold " +
          (ok ? "border-primary/30 bg-primary/10 text-primary" : "border-destructive/30 bg-destructive/10 text-destructive")
        }
      >
        {ok ? "OK" : "Fix"}
      </Badge>
    </div>
  );
}

export default function Deploy() {
  usePageMeta({
    title: "Deploy Checklist | Admin | sold.bd",
    description: "Production build/deploy checklist and environment verification.",
  });

  const healthQ = useQuery({
    queryKey: ["deploy-health", API_MODE],
    queryFn: async () => {
      const r = await apiInvokeTyped("health", { method: "GET", body: undefined });
      if (r.error) throw r.error;
      return r.data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const envQ = useQuery({
    queryKey: ["deploy-env", API_MODE],
    queryFn: async () => {
      const r = await apiInvokeTyped("admin-deploy-check", { method: "GET", body: undefined });
      if (r.error) throw r.error;
      return r.data;
    },
    enabled: API_MODE === "node",
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const apiBase = resolvedApiBaseUrl();
  const backendOnline = healthQ.status === "success";

  return (
    <div className="container py-10 md:py-14">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Deploy checklist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Production sanity checks for <span className="font-mono">sold.bd</span> → <span className="font-mono">api.sold.bd</span>.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2">
          <Badge variant="outline" className="rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
            <span
              className={
                "mr-2 inline-block size-2 rounded-full " + (backendOnline ? "bg-primary" : "bg-destructive")
              }
              aria-hidden="true"
            />
            Backend: {backendOnline ? "Online" : healthQ.isFetching ? "Checking" : "Offline"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void healthQ.refetch();
              void envQ.refetch();
            }}
          >
            Re-run checks
          </Button>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="shadow-premium">
          <CardHeader>
            <CardTitle className="text-base">Build / Deploy steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StepRow label="Frontend builds to dist/" ok detail="Run build locally/CI and upload dist/ to sold.bd hosting." />
            <StepRow
              label="SPA routing rewrite configured"
              ok
              detail="Ensure non-file routes rewrite to index.html (e.g. /deals, /admin)."
            />
            <StepRow
              label="API is reachable at api.sold.bd"
              ok={backendOnline}
              detail={`Expected base URL: ${apiBase || "(cannot resolve)"}`}
            />
            <StepRow
              label="CORS allows sold.bd"
              ok
              detail="API must allow requests from sold.bd (CORS_ORIGIN)."
            />
            <StepRow
              label="Admin auth works (JWT + refresh)"
              ok
              detail="Login → access token, refresh token rotation enabled."
            />
          </CardContent>
        </Card>

        <Card className="shadow-premium">
          <CardHeader>
            <CardTitle className="text-base">Production env verification (API)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {API_MODE !== "node" ? (
              <div className="text-sm text-muted-foreground">
                This check runs against your Express API and is only available in <span className="font-mono">node</span> mode.
                In this preview environment the app defaults to <span className="font-mono">lovable</span> mode.
              </div>
            ) : null}
            {envQ.isPending ? (
              <div className="text-sm text-muted-foreground">Checking…</div>
            ) : envQ.status === "error" ? (
              <div className="text-sm text-destructive">{String(envQ.error)}</div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  NODE_ENV: <span className="font-mono">{envQ.data?.runtime.nodeEnv ?? "(not set)"}</span>
                </div>
                <div className="space-y-2">
                  {(envQ.data?.checks ?? []).map((c) => (
                    <div
                      key={c.key}
                      className={
                        "flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 text-sm " +
                        (c.ok ? "" : "border-destructive/30")
                      }
                    >
                      <div className="min-w-0">
                        <div className="font-medium">{c.label}</div>
                        <div className="text-xs text-muted-foreground">{c.key}</div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          "shrink-0 rounded-full px-3 py-1 text-xs font-semibold " +
                          (c.ok
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-destructive/30 bg-destructive/10 text-destructive")
                        }
                        title={c.message}
                      >
                        {c.ok ? "OK" : c.message ?? "Missing"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="pt-2 text-xs text-muted-foreground">
              Tip: If you want zero-config hosting, you can omit <span className="font-mono">VITE_NODE_API_BASE_URL</span> and the
              frontend will auto-resolve it to <span className="font-mono">api.&lt;your-domain&gt;</span> (for production: <span className="font-mono">api.sold.bd</span>).
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
