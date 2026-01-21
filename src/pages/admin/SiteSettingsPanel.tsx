import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { uploadPublicFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  brandName: z.string().trim().min(2).max(60),
  brandTagline: z.string().trim().min(2).max(120),
  headerKicker: z.string().trim().min(2).max(80),
  heroH1: z.string().trim().min(10).max(140),
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
  const [logoUploading, setLogoUploading] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      brandName: "sold.bd",
      brandTagline: "Bangladesh’s Flash Deals Marketplace",
      headerKicker: "Live drops • Limited stock",
      heroH1: "Get it Before it’s Sold — Bangladesh’s Flash Deals Marketplace",
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
      heroSubtitle: settings.data.hero_subtitle,
      whatsappPhoneE164: settings.data.whatsapp_phone_e164,
      whatsappDefaultMessage: settings.data.whatsapp_default_message,
      nextDropAt: settings.data.next_drop_at ?? "",
    });
  }, [settings.data, form]);

  async function onSubmit(values: FormValues) {
    if (!settings.data?.id) return;
    setSaving(true);
    try {
      const nextDropAt = values.nextDropAt ? new Date(values.nextDropAt).toISOString() : null;
      const { error } = await supabase
        .from("site_settings")
        .update({
          brand_name: values.brandName,
          brand_tagline: values.brandTagline,
          header_kicker: values.headerKicker,
          hero_h1: values.heroH1,
          hero_subtitle: values.heroSubtitle,
          whatsapp_phone_e164: values.whatsappPhoneE164,
          whatsapp_default_message: values.whatsappDefaultMessage,
          next_drop_at: nextDropAt,
        })
        .eq("id", settings.data.id);
      if (error) throw error;
      toast({ title: "Saved", description: "Site settings updated." });
      await settings.refetch();
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function onUploadLogo(file: File) {
    if (!settings.data?.id) return;
    setLogoUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `logo/${Date.now()}_${safeName}`;
      const url = await uploadPublicFile({ bucket: "brand", path, file });

      const current = settings.data.content ?? {};
      const merged = { ...current, logoUrl: url };
      const { error } = await supabase.from("site_settings").update({ content: merged }).eq("id", settings.data.id);
      if (error) throw error;

      toast({ title: "Uploaded", description: "Logo updated." });
      await settings.refetch();
    } catch (e) {
      toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLogoUploading(false);
    }
  }

  const logoUrl = (settings.data?.content as any)?.logoUrl as string | undefined;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="text-sm font-semibold">Brand logo</div>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 overflow-hidden rounded-xl border bg-card">
              {logoUrl ? <img className="h-full w-full object-cover" src={logoUrl} alt="Brand logo" /> : null}
            </div>
            <label className="inline-flex">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onUploadLogo(f);
                }}
              />
              <Button type="button" variant="outline" disabled={logoUploading}>
                {logoUploading ? "Uploading…" : "Upload"}
              </Button>
            </label>
          </div>
          <div className="text-xs text-muted-foreground">Stored in secure file storage; only the URL is saved.</div>
        </div>
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
