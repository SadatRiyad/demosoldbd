import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type SignupRow = { id: string; email: string; created_at: string };

export default function EarlyAccessPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<SignupRow[]>([]);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-early-access", { method: "GET" });
      if (error) throw error;
      setItems(((data as any)?.signups ?? []) as SignupRow[]);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Recent signups</div>
        <Button variant="outline" onClick={() => load()} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-12 gap-2 border-b bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
          <div className="col-span-7">Email</div>
          <div className="col-span-5">Created</div>
        </div>
        <div className="divide-y">
          {items.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm">
              <div className="col-span-7 truncate">{r.email}</div>
              <div className="col-span-5 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
            </div>
          ))}
          {items.length === 0 && <div className="px-4 py-4 text-sm text-muted-foreground">No signups yet.</div>}
        </div>
      </div>
    </div>
  );
}
