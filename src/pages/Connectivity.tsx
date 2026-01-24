import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_MODE } from "@/lib/api/config";
import { resolveNodeApiBaseUrl, setRuntimeNodeApiBaseUrl } from "@/lib/api/nodeBaseUrl";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/lib/usePageMeta";

type StepStatus = "idle" | "running" | "ok" | "warn" | "fail";

type StepResult = {
  key: string;
  title: string;
  status: StepStatus;
  summary?: string;
  details?: string;
  hints?: string[];
};

function withSlashTrim(v: string) {
  return v.replace(/\/+$/, "");
}

function badgeVariantFor(status: StepStatus) {
  if (status === "ok") return "outline" as const;
  if (status === "warn") return "outline" as const;
  if (status === "fail") return "outline" as const;
  return "outline" as const;
}

function badgeClassFor(status: StepStatus) {
  switch (status) {
    case "ok":
      return "border-primary/30 bg-primary/10 text-primary";
    case "warn":
      return "border-secondary/40 bg-secondary/20 text-foreground";
    case "fail":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "running":
      return "border-muted bg-muted/50 text-muted-foreground";
    default:
      return "border-muted bg-card text-muted-foreground";
  }
}

function guessHints(params: {
  origin: string;
  apiBase: string;
  stepKey: string;
  error?: unknown;
  corsProbably?: boolean;
}): string[] {
  const { origin, apiBase, stepKey, corsProbably } = params;

  const hints: string[] = [];

  if (!apiBase) {
    hints.push("Set the API base URL (example: https://api.sold.bd). In preview it cannot be auto-guessed.");
    return hints;
  }

  // General Hostinger / Cloudflare hints.
  if (stepKey === "reachability" || stepKey === "health-cors") {
    hints.push(`Confirm DNS A/AAAA record for ${new URL(apiBase).hostname} points to your server (or Cloudflare).`);
    hints.push("Confirm your API process is running and listening on the correct port.");
  }

  if (corsProbably) {
    hints.push(`Set CORS_ORIGIN to allow this frontend origin: ${origin}`);
    hints.push("If using Cloudflare, ensure it forwards OPTIONS requests and doesn’t cache API responses incorrectly.");
  }

  // TLS-specific hint
  try {
    const u = new URL(apiBase);
    if (u.protocol === "https:") {
      hints.push("If TLS/SSL is failing: in Cloudflare set SSL/TLS to Full (strict) and install a valid origin cert.");
    }
  } catch {
    // ignore
  }

  hints.push("If you use Hostinger shared hosting, ensure the /api paths are routed to Node (Passenger / reverse proxy).");
  return hints;
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export default function Connectivity() {
  usePageMeta({
    title: "Connectivity Test | sold.bd",
    description: "DNS/TLS/CORS connectivity diagnostics for sold.bd → api.sold.bd.",
  });

  const { toast } = useToast();
  const envBase = (import.meta.env.VITE_NODE_API_BASE_URL as string | undefined) ?? "";
  const [apiBaseDraft, setApiBaseDraft] = React.useState("");
  const apiBase = resolveNodeApiBaseUrl(envBase);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const [steps, setSteps] = React.useState<StepResult[]>(() => [
    {
      key: "reachability",
      title: "DNS/TLS reachability (no-cors ping)",
      status: "idle",
      summary: "Checks if the host is reachable at all (helps distinguish CORS vs network).",
    },
    {
      key: "health-cors",
      title: "CORS JSON fetch: GET /api/health",
      status: "idle",
      summary: "Fetches JSON from /api/health with normal CORS mode.",
    },
    {
      key: "auth-probe",
      title: "CORS probe: POST /api/auth/login (expected 200/400)",
      status: "idle",
      summary: "Sends a harmless login request to verify preflight/CORS for POST+JSON.",
    },
  ]);

  function updateStep(key: string, patch: Partial<StepResult>) {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  async function run() {
    // Reset
    setSteps((prev) => prev.map((s) => ({ ...s, status: "running", details: undefined, hints: undefined })));

    const base = withSlashTrim(apiBase);
    if (!base) {
      setSteps((prev) =>
        prev.map((s) => ({
          ...s,
          status: "fail",
          details: "No API base URL resolved.",
          hints: guessHints({ origin, apiBase: "", stepKey: s.key }),
        })),
      );
      return;
    }

    const healthUrl = `${base}/api/health`;
    const loginUrl = `${base}/api/auth/login`;

    // 1) Reachability via no-cors
    try {
      const res = await fetch(healthUrl, { method: "GET", mode: "no-cors" });
      // Opaque is expected if cross-origin.
      updateStep("reachability", {
        status: "ok",
        details: `no-cors fetch resolved (type: ${res.type}). Host reachable.`,
      });
    } catch (e) {
      updateStep("reachability", {
        status: "fail",
        details: `Network error while reaching ${healthUrl}. Browser error: ${String((e as any)?.message ?? e)}`,
        hints: guessHints({ origin, apiBase: base, stepKey: "reachability", error: e }),
      });
      // If we can't reach at all, the rest will likely fail too.
      updateStep("health-cors", {
        status: "fail",
        details: "Skipped because host is not reachable.",
      });
      updateStep("auth-probe", {
        status: "fail",
        details: "Skipped because host is not reachable.",
      });
      return;
    }

    // 2) CORS JSON health
    try {
      const res = await fetch(healthUrl, { method: "GET" });
      const text = await safeText(res);
      if (!res.ok) {
        updateStep("health-cors", {
          status: "warn",
          details: `Reached ${healthUrl} but got HTTP ${res.status}. Body: ${text.slice(0, 300)}`,
          hints: guessHints({ origin, apiBase: base, stepKey: "health-cors" }),
        });
      } else {
        updateStep("health-cors", {
          status: "ok",
          details: `OK: ${text.slice(0, 300)}`,
        });
      }
    } catch (e) {
      // If reachability succeeded but cors fetch failed, it's likely CORS.
      updateStep("health-cors", {
        status: "fail",
        details: `Fetch failed (likely CORS). Browser error: ${String((e as any)?.message ?? e)}`,
        hints: guessHints({ origin, apiBase: base, stepKey: "health-cors", error: e, corsProbably: true }),
      });
    }

    // 3) Auth POST probe (this may return 200/400/401; we only care that it responds)
    try {
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "probe@example.com", password: "probe" }),
      });
      const text = await safeText(res);

      // Any HTTP response means POST+preflight worked.
      updateStep("auth-probe", {
        status: "ok",
        details: `Responded with HTTP ${res.status}. Body: ${text.slice(0, 300)}`,
      });
    } catch (e) {
      updateStep("auth-probe", {
        status: "fail",
        details: `POST failed (likely CORS preflight). Browser error: ${String((e as any)?.message ?? e)}`,
        hints: guessHints({ origin, apiBase: base, stepKey: "auth-probe", error: e, corsProbably: true }),
      });
    }
  }

  const running = steps.some((s) => s.status === "running");

  return (
    <div className="container py-10 md:py-14">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Connectivity test</h1>
          <p className="mt-1 text-sm text-muted-foreground">DNS / TLS / CORS checks for your API (Hostinger / Cloudflare).</p>
        </div>
        <Badge
          variant="outline"
          className="w-fit gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground"
        >
          <span className={"inline-block size-2 rounded-full " + (API_MODE === "node" ? "bg-primary" : "bg-muted")} aria-hidden="true" />
          <span>Mode: {API_MODE === "node" ? "Node" : "Cloud"}</span>
        </Badge>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="shadow-premium lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Target</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="text-muted-foreground">
              Frontend origin: <span className="font-mono text-foreground">{origin || "(unknown)"}</span>
            </div>
            <div className="text-muted-foreground">
              Resolved API base: <span className="font-mono text-foreground">{apiBase || "(not set)"}</span>
            </div>

            <div className="rounded-lg border bg-card p-3">
              <div className="text-sm font-medium">API base URL</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Use this in preview and when switching between Hostinger / VPS / Render.
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="https://api.sold.bd"
                  value={apiBaseDraft}
                  onChange={(e) => setApiBaseDraft(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  inputMode="url"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRuntimeNodeApiBaseUrl(apiBaseDraft);
                    toast({ title: "Saved", description: "API base URL saved in this browser." });
                  }}
                >
                  Save
                </Button>
              </div>
            </div>

            <Button className="w-full" onClick={() => void run()} disabled={running}>
              {running ? "Running…" : "Run checks"}
            </Button>

            <div className="text-xs text-muted-foreground">
              Cloudflare tip: if you proxy <span className="font-mono">api.sold.bd</span>, keep SSL/TLS on “Full (strict)” and allow
              OPTIONS requests.
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-premium lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((s) => (
              <div key={s.key} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold">{s.title}</div>
                    {s.summary ? <div className="mt-1 text-sm text-muted-foreground">{s.summary}</div> : null}
                  </div>
                  <Badge variant={badgeVariantFor(s.status)} className={"shrink-0 rounded-full px-3 py-1 text-xs font-semibold " + badgeClassFor(s.status)}>
                    {s.status === "idle" ? "Idle" : s.status === "running" ? "Running" : s.status.toUpperCase()}
                  </Badge>
                </div>

                {s.details ? (
                  <pre className="mt-3 max-h-48 overflow-auto rounded-lg border bg-card p-3 text-xs text-foreground">{s.details}</pre>
                ) : null}

                {s.hints?.length ? (
                  <div className="mt-3">
                    <div className="text-sm font-medium">Fix hints</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {s.hints.map((h, idx) => (
                        <li key={idx}>{h}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
