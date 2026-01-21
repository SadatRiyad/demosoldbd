import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/lib/useSiteSettings";

const schema = z.object({
  supportHours: z.string().trim().min(3).max(120),
  location: z.string().trim().min(2).max(120),
  returns: z.string().trim().min(5).max(220),
  shipping: z.string().trim().min(5).max(220),
  privacy: z.string().trim().min(5).max(220),
});

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  supportHours: "10:00 AM – 10:00 PM (BDT)",
  location: "Dhaka, Bangladesh",
  returns: "Handled by the seller. We’ll help connect you quickly on WhatsApp.",
  shipping: "Delivery time and cost depend on the seller and your location.",
  privacy: "We store your email for early access alerts only.",
};

export default function ContactTrustSettings() {
  const { toast } = useToast();
  const settings = useSiteSettings();
  const [saving, setSaving] = React.useState(false);

  const current = ((settings.data?.content as any)?.contact_trust as Partial<FormValues> | undefined) ?? {};
  const initial: FormValues = { ...DEFAULTS, ...current };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
    mode: "onBlur",
  });

  React.useEffect(() => {
    const next = ((settings.data?.content as any)?.contact_trust as Partial<FormValues> | undefined) ?? {};
    form.reset({ ...DEFAULTS, ...next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.data]);

  async function onSave(values: FormValues) {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-site-settings", {
        method: "PATCH",
        body: { content_patch: { contact_trust: values } },
      });
      if (error) throw error;
      if ((data as any)?.ok !== true) throw new Error((data as any)?.error ?? "Save failed");
      toast({ title: "Saved", description: "Contact & trust content updated." });
      await settings.refetch();
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="shadow-premium">
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1">
          <div className="text-sm font-semibold">Contact & trust</div>
          <div className="text-xs text-muted-foreground">Controls what appears on the About + Early Access pages.</div>
        </div>

        <form onSubmit={form.handleSubmit(onSave)} className="space-y-3">
          <div className="grid gap-2">
            <div className="text-xs font-medium text-muted-foreground">Support hours</div>
            <Input {...form.register("supportHours")} placeholder="10:00 AM – 10:00 PM (BDT)" />
          </div>
          <div className="grid gap-2">
            <div className="text-xs font-medium text-muted-foreground">Location</div>
            <Input {...form.register("location")} placeholder="Dhaka, Bangladesh" />
          </div>
          <div className="grid gap-2">
            <div className="text-xs font-medium text-muted-foreground">Returns & refunds</div>
            <Textarea rows={2} {...form.register("returns")} />
          </div>
          <div className="grid gap-2">
            <div className="text-xs font-medium text-muted-foreground">Shipping</div>
            <Textarea rows={2} {...form.register("shipping")} />
          </div>
          <div className="grid gap-2">
            <div className="text-xs font-medium text-muted-foreground">Privacy</div>
            <Textarea rows={2} {...form.register("privacy")} />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save contact & trust"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
