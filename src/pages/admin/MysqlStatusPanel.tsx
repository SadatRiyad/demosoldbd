import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Check = {
  key: string;
  label: string;
  ok: boolean;
  message?: string;
};

type MysqlStatusResponse = {
  ok: boolean;
  checks: Check[];
};

export default function MysqlStatusPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<MysqlStatusResponse | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<MysqlStatusResponse>("admin-mysql-status", {
        method: "GET",
      });
      if (error) throw error;
      setData(data ?? null);
    } catch (e) {
      toast({ title: "Load failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checks = data?.checks ?? [];
  const anyBad = checks.some((c) => !c.ok);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-sm font-semibold">MySQL configuration</div>
        <div className="text-sm text-muted-foreground">
          This checklist verifies which backend secrets are present and whether basic formatting looks valid (values are never shown).
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm">
          Status:{" "}
          {checks.length ? (
            <Badge variant={anyBad ? "destructive" : "secondary"}>{anyBad ? "Needs attention" : "Looks good"}</Badge>
          ) : (
            <Badge variant="secondary">Unknown</Badge>
          )}
        </div>
        <Button type="button" variant="outline" disabled={loading} onClick={() => void load()}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <Card className="divide-y overflow-hidden">
        {checks.map((c) => (
          <div key={c.key} className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="text-sm font-medium">{c.label}</div>
              {c.message ? <div className="mt-1 text-xs text-muted-foreground">{c.message}</div> : null}
            </div>
            <Badge variant={c.ok ? "secondary" : "destructive"}>{c.ok ? "Set" : "Missing/Invalid"}</Badge>
          </div>
        ))}
        {!checks.length ? <div className="p-4 text-sm text-muted-foreground">No data yet.</div> : null}
      </Card>
    </div>
  );
}
