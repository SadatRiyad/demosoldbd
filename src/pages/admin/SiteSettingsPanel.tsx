import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ContactTrustSettings from "@/pages/admin/ContactTrustSettings";

const THRESHOLDS = ["5", "10", "15"] as const;
type ThresholdStr = (typeof THRESHOLDS)[number];

function normalizeThresholdStr(v: unknown): ThresholdStr {
  const s = typeof v === "number" ? String(v) : typeof v === "string" ? v.trim() : "";
  return (THRESHOLDS as readonly string[]).includes(s) ? (s as ThresholdStr) : "10";
}

const schema = z.object({
  brandName: z.string().trim().min(2).max(60),
  brandTagline: z.string().trim().min(2).max(120),
  headerKicker: z.string().trim().min(2).max(80),
  heroH1: z.string().trim().min(10).max(140),
  heroH1Mobile: z.string().trim().max(140).optional(),
  heroH1ClampXs: z.boolean().optional(),
  endsSoonThresholdMinutes: z.enum(THRESHOLDS).optional(),
  heroSubtitle: z.string().trim().min(10).max(220),
  whatsappPhoneE164: z.string().trim().min(8).max(20),
  whatsappDefaultMessage: z.string().trim().min(5).max(400),
  nextDropAt: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function SiteSettingsPanel() {
  const { toast } = useToast();
  const settings = useSiteSettings();
  const [saving, setSaving] = React.useState(false);
  const [savingLogo, setSavingLogo] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      brandName: "sold.bd",
      brandTagline: "Bangladesh’s Flash Deals Marketplace",
      headerKicker: "Live drops • Limited stock",
      heroH1: "Get it Before it’s Sold — Bangladesh’s Flash Deals Marketplace",
      heroH1Mobile: "Get it before it’s sold — flash deals in Bangladesh",
      heroH1ClampXs: false,
      endsSoonThresholdMinutes: "10",
      heroSubtitle: "Limited-stock drops from local sellers. Miss it, it’s gone forever.",
      whatsappPhoneE164: "+8801700000000",
      whatsappDefaultMessage: "Hi sold.bd! I want early access and updates about upcoming flash drops.",
      nextDropAt: "",
    },
  });

  React.useEffect(() => {
    if (!settings.data) return;
    form.reset({
      brandName: settings.data.brand_name,
      brandTagline: settings.data.brand_tagline,
      headerKicker: settings.data.header_kicker,
      heroH1: settings.data.hero_h1,
      heroH1Mobile: (settings.data.content as any)?.heroH1Mobile ?? "",
      heroH1ClampXs: (settings.data.content as any)?.heroH1ClampXs ?? false,
      endsSoonThresholdMinutes: normalizeThresholdStr((settings.data.content as any)?.endsSoonThresholdMinutes),
      heroSubtitle: settings.data.hero_subtitle,
      whatsappPhoneE164: settings.data.whatsapp_phone_e164,
      whatsappDefaultMessage: settings.data.whatsapp_default_message,
      nextDropAt: settings.data.next_drop_at ?? "",
    });
  }, [settings.data, form]);

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const nextDropAt = values.nextDropAt ? new Date(values.nextDropAt).toISOString() : null;
      const { data, error } = await supabase.functions.invoke("admin-site-settings", {
        method: "PUT",
        body: {
          brand_name: values.brandName,
          brand_tagline: values.brandTagline,
          header_kicker: values.headerKicker,
          hero_h1: values.heroH1,
          hero_subtitle: values.heroSubtitle,
          whatsapp_phone_e164: values.whatsappPhoneE164,
          whatsapp_default_message: values.whatsappDefaultMessage,
          next_drop_at: nextDropAt,
        },
      });
      if (error) throw error;
      if ((data as any)?.ok !== true) throw new Error((data as any)?.error ?? "Save failed");

      // Mobile hero settings live in content JSON.
      const { data: data2, error: error2 } = await supabase.functions.invoke("admin-site-settings", {
        method: "PATCH",
        body: {
          content_patch: {
            heroH1Mobile: values.heroH1Mobile?.trim() || null,
            heroH1ClampXs: values.heroH1ClampXs ?? false,
            endsSoonThresholdMinutes: Number.parseInt(values.endsSoonThresholdMinutes ?? "10", 10),
          },
        },
      });
      if (error2) throw error2;
      if ((data2 as any)?.ok !== true) throw new Error((data2 as any)?.error ?? "Save failed");

      toast({ title: "Saved", description: "Site settings updated." });
      await settings.refetch();
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const logoUrl = (settings.data?.content as any)?.logoUrl as string | undefined;

  async function onSaveLogoUrl(url: string) {
    setSavingLogo(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-site-settings", {
        method: "PATCH",
        body: { content_patch: { logoUrl: url.trim() || null } },
      });
      if (error) throw error;
      if ((data as any)?.ok !== true) throw new Error((data as any)?.error ?? "Save failed");
      toast({ title: "Saved", description: "Logo URL updated." });
      await settings.refetch();
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSavingLogo(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="text-sm font-semibold">Brand logo</div>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 overflow-hidden rounded-xl border bg-card">
              {logoUrl ? <img className="h-full w-full object-cover" src={logoUrl} alt="Brand logo" /> : null}
            </div>
            <div className="flex-1" />
          </div>
          <div className="grid gap-2">
            <div className="text-xs font-medium text-muted-foreground">Logo URL</div>
            <Input
              defaultValue={logoUrl ?? ""}
              placeholder="https://…"
              onBlur={(e) => void onSaveLogoUrl(e.target.value)}
              aria-label="Logo URL"
            />
            <div className="text-xs text-muted-foreground">
              MySQL-only mode: paste a hosted image URL. (Uploads can be enabled later with an external storage provider.)
            </div>
            <Button type="button" variant="outline" disabled={savingLogo} onClick={() => void onSaveLogoUrl(logoUrl ?? "")}>
              {savingLogo ? "Saving…" : "Save logo URL"}
            </Button>
          </div>
        </div>

        <ContactTrustSettings />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-2">
          <div className="text-sm font-medium">Brand name</div>
          <Input {...form.register("brandName")} />
        </div>
        <div className="grid gap-2">
          <div className="text-sm font-medium">Tagline</div>
          <Input {...form.register("brandTagline")} />
        </div>
        <div className="grid gap-2">
          <div className="text-sm font-medium">Header kicker</div>
          <Input {...form.register("headerKicker")} />
        </div>
        <div className="grid gap-2">
          <div className="text-sm font-medium">Hero H1</div>
          <Textarea rows={3} {...form.register("heroH1")} />
        </div>
        <div className="grid gap-2">
          <div className="text-sm font-medium">Hero H1 (mobile)</div>
          <Textarea rows={2} placeholder="Shorter headline for small phones" {...form.register("heroH1Mobile")} />
          <div className="text-xs text-muted-foreground">Shown on small screens (sm and below). Leave blank to use the main H1.</div>
        </div>
        <div className="flex items-center justify-between rounded-lg border bg-card p-3">
          <div>
            <div className="text-sm font-medium">Clamp H1 to 2 lines (ultra-small)</div>
            <div className="text-xs text-muted-foreground">Applies only to very small devices to prevent overflow.</div>
          </div>
          <Switch checked={!!form.watch("heroH1ClampXs")} onCheckedChange={(v) => form.setValue("heroH1ClampXs", v)} />
        </div>
        <div className="grid gap-2">
          <div className="text-sm font-medium">“Ends soon” threshold</div>
          <Select
            value={form.watch("endsSoonThresholdMinutes") ?? "10"}
            onValueChange={(v) => form.setValue("endsSoonThresholdMinutes", v as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 minutes</SelectItem>
              <SelectItem value="10">10 minutes</SelectItem>
              <SelectItem value="15">15 minutes</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">Controls when the “Ends soon” badge appears on deal cards.</div>
        </div>
        <div className="grid gap-2">
          <div className="text-sm font-medium">Hero subtitle</div>
          <Textarea rows={3} {...form.register("heroSubtitle")} />
        </div>

        <div className="grid gap-2">
          <div className="text-sm font-medium">WhatsApp phone (E.164)</div>
          <Input placeholder="+8801…" {...form.register("whatsappPhoneE164")} />
        </div>
        <div className="grid gap-2">
          <div className="text-sm font-medium">WhatsApp default message</div>
          <Textarea rows={3} {...form.register("whatsappDefaultMessage")} />
        </div>
        <div className="grid gap-2">
          <div className="text-sm font-medium">Next drop at (ISO)</div>
          <Input placeholder="2026-01-21T18:00:00+06:00" {...form.register("nextDropAt")} />
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Saving…" : "Save site settings"}
        </Button>
      </form>
    </div>
  );
}
