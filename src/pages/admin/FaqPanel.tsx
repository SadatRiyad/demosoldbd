import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/lib/useSiteSettings";

const itemSchema = z.object({
  q: z.string().trim().min(3).max(140),
  a: z.string().trim().min(5).max(600),
});

const schema = z.object({
  items: z.array(itemSchema).min(1).max(20),
});

type FormValues = z.infer<typeof schema>;

const DEFAULTS: Array<{ q: string; a: string }> = [
  {
    q: "How do I order a deal?",
    a: "Tap ‘Buy on WhatsApp’. We’ll open a chat with the item details so you can confirm availability and delivery.",
  },
  {
    q: "Are stock counts real?",
    a: "Yes. Deals show stock and are marked Sold Out when stock reaches zero.",
  },
  {
    q: "Do deals expire automatically?",
    a: "Yes. Each deal has an end time. Expired deals are removed from the public view.",
  },
];

export default function FaqPanel() {
  const { toast } = useToast();
  const settings = useSiteSettings();
  const [saving, setSaving] = React.useState(false);

  const initialFaq = ((settings.data?.content as any)?.faq as Array<{ q: string; a: string }> | undefined) ?? DEFAULTS;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { items: initialFaq },
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  React.useEffect(() => {
    const faq = ((settings.data?.content as any)?.faq as Array<{ q: string; a: string }> | undefined) ?? DEFAULTS;
    form.reset({ items: faq });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.data]);

  async function onSave(values: FormValues) {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-site-settings", {
        method: "PATCH",
        body: { content_patch: { faq: values.items } },
      });
      if (error) throw error;
      if ((data as any)?.ok !== true) throw new Error((data as any)?.error ?? "Save failed");
      toast({ title: "Saved", description: "FAQ updated." });
      await settings.refetch();
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-sm font-semibold">FAQ</div>
        <div className="text-sm text-muted-foreground">Edit the questions shown on the homepage (FAQ section).</div>
      </div>

      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <div className="space-y-3">
          {fields.map((f, idx) => (
            <Card key={f.id} className="shadow-premium">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">Item {idx + 1}</div>
                  <Button type="button" variant="outline" onClick={() => remove(idx)} disabled={fields.length <= 1}>
                    Remove
                  </Button>
                </div>

                <div className="grid gap-2">
                  <div className="text-sm font-medium">Question</div>
                  <Input {...form.register(`items.${idx}.q`)} placeholder="e.g. How do I order?" />
                </div>
                <div className="grid gap-2">
                  <div className="text-sm font-medium">Answer</div>
                  <Textarea rows={4} {...form.register(`items.${idx}.a`)} placeholder="Write a clear answer…" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ q: "", a: "" })}
            disabled={fields.length >= 20}
          >
            Add FAQ item
          </Button>
          <Button type="submit" disabled={saving} className="sm:ml-auto">
            {saving ? "Saving…" : "Save FAQ"}
          </Button>
        </div>
      </form>
    </div>
  );
}
