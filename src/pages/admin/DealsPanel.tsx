import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadPublicFile } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Electronics", "Fashion", "Food", "Home", "Beauty"] as const;
type Category = (typeof CATEGORIES)[number];

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(5).max(500),
  category: z.enum(CATEGORIES),
  priceBdt: z.coerce.number().int().min(0).max(1_000_000).optional(),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  endsAt: z.string().trim().min(8).max(40),
  imageUrl: z.string().trim().url().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

type AdminDeal = {
  id: string;
  title: string;
  description: string;
  category: Category;
  priceBdt?: number;
  imageUrl: string;
  stock: number;
  endsAt: string;
  isActive?: boolean;
};

export default function DealsPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [imageUploading, setImageUploading] = React.useState(false);
  const [items, setItems] = React.useState<AdminDeal[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      category: "Electronics",
      priceBdt: undefined,
      stock: 1,
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
      imageUrl: "",
    },
  });

  async function refresh() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-deals", { method: "GET" });
      if (error) throw error;
      setItems(((data as any)?.deals ?? []) as AdminDeal[]);
    } catch (e) {
      toast({ title: "Load failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onUploadImage(file: File) {
    setImageUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `deal-images/${Date.now()}_${safeName}`;
      const url = await uploadPublicFile({ bucket: "deals", path, file });
      form.setValue("imageUrl", url, { shouldValidate: true });
      toast({ title: "Uploaded", description: "Image uploaded." });
    } catch (e) {
      toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setImageUploading(false);
    }
  }

  async function onCreate(values: FormValues) {
    setSaving(true);
    try {
      const payload = {
        title: values.title,
        description: values.description,
        category: values.category,
        price_bdt: typeof values.priceBdt === "number" ? values.priceBdt : null,
        image_url: values.imageUrl ?? "",
        stock: values.stock,
        ends_at: new Date(values.endsAt).toISOString(),
        is_active: 1,
      };
      const { data, error } = await supabase.functions.invoke("admin-deals", { method: "POST", body: payload });
      if (error) throw error;
      if ((data as any)?.ok !== true) throw new Error((data as any)?.error ?? "Create failed");
      toast({ title: "Created", description: "Deal created." });
      form.reset();
      await refresh();
    } catch (e) {
      toast({ title: "Create failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function onToggleActive(id: string, active: boolean) {
    try {
      const { data, error } = await supabase.functions.invoke("admin-deals", { method: "PATCH", body: { id, is_active: active ? 1 : 0 } });
      if (error) throw error;
      if ((data as any)?.ok !== true) throw new Error((data as any)?.error ?? "Update failed");
      await refresh();
    } catch (e) {
      toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="text-sm font-semibold">Create deal</div>
        <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
          <div className="grid gap-2">
            <div className="text-sm font-medium">Title</div>
            <Input {...form.register("title")} />
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium">Description</div>
            <Textarea rows={4} {...form.register("description")} />
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium">Category</div>
            <Select value={form.watch("category")} onValueChange={(v) => form.setValue("category", v as Category)}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <div className="text-sm font-medium">Price (BDT)</div>
              <Input type="number" inputMode="numeric" {...form.register("priceBdt")} />
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Stock</div>
              <Input type="number" inputMode="numeric" {...form.register("stock")} />
            </div>
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium">Ends at (ISO)</div>
            <Input {...form.register("endsAt")} />
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Image URL</div>
            <Input placeholder="https://…" {...form.register("imageUrl")} />
            <label className="inline-flex">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onUploadImage(f);
                }}
              />
              <Button type="button" variant="outline" disabled={imageUploading}>
                {imageUploading ? "Uploading…" : "Upload image"}
              </Button>
            </label>
          </div>

          <Button className="w-full" type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create deal"}
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Deals</div>
          <Button variant="outline" onClick={() => refresh()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
        <div className="space-y-3">
          {items.map((d) => (
            <div key={d.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{d.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {d.category} • Stock {d.stock} • Ends {new Date(d.endsAt).toLocaleString()}
                  </div>
                </div>
                <Button variant={d.isActive === false ? "outline" : "secondary"} onClick={() => onToggleActive(d.id, d.isActive === false)}>
                  {d.isActive === false ? "Activate" : "Deactivate"}
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-sm text-muted-foreground">No deals yet.</div>}
        </div>
      </div>
    </div>
  );
}
