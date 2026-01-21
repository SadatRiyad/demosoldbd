import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const providerSchema = z.enum(["s3", "r2", "cloudinary"]);

const schema = z
  .object({
    provider: providerSchema,

    // S3 / R2
    accessKeyId: z.string().trim().max(200).optional(),
    secretAccessKey: z.string().trim().max(200).optional(),
    bucket: z.string().trim().max(200).optional(),
    endpoint: z.string().trim().max(500).optional(),
    region: z.string().trim().max(60).optional(),
    publicBaseUrl: z.string().trim().max(500).optional(),

    // Cloudinary
    cloudName: z.string().trim().max(120).optional(),
    apiKey: z.string().trim().max(120).optional(),
    apiSecret: z.string().trim().max(200).optional(),
    folder: z.string().trim().max(120).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.provider === "cloudinary") {
      if (!v.cloudName) ctx.addIssue({ code: "custom", path: ["cloudName"], message: "Required" });
      if (!v.apiKey) ctx.addIssue({ code: "custom", path: ["apiKey"], message: "Required" });
      if (!v.apiSecret) ctx.addIssue({ code: "custom", path: ["apiSecret"], message: "Required" });
    } else {
      if (!v.accessKeyId) ctx.addIssue({ code: "custom", path: ["accessKeyId"], message: "Required" });
      if (!v.secretAccessKey) ctx.addIssue({ code: "custom", path: ["secretAccessKey"], message: "Required" });
      if (!v.bucket) ctx.addIssue({ code: "custom", path: ["bucket"], message: "Required" });
    }
  });

type FormValues = z.infer<typeof schema>;

export default function ExternalStoragePanel() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: "s3",
      accessKeyId: "",
      secretAccessKey: "",
      bucket: "",
      endpoint: "",
      region: "auto",
      publicBaseUrl: "",
      cloudName: "",
      apiKey: "",
      apiSecret: "",
      folder: "soldbd",
    },
  });

  const provider = form.watch("provider");

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-storage-settings", { method: "GET" });
      if (error) throw error;
      const p = String((data as any)?.provider ?? "s3");
      const s = ((data as any)?.settings ?? {}) as Record<string, any>;
      form.reset({
        provider: (p === "r2" || p === "cloudinary" ? p : "s3") as any,
        accessKeyId: String(s.accessKeyId ?? ""),
        secretAccessKey: String(s.secretAccessKey ?? ""),
        bucket: String(s.bucket ?? ""),
        endpoint: String(s.endpoint ?? ""),
        region: String(s.region ?? "auto"),
        publicBaseUrl: String(s.publicBaseUrl ?? ""),
        cloudName: String(s.cloudName ?? ""),
        apiKey: String(s.apiKey ?? ""),
        apiSecret: String(s.apiSecret ?? ""),
        folder: String(s.folder ?? "soldbd"),
      });
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

  async function onSave(values: FormValues) {
    setSaving(true);
    try {
      const settings: Record<string, unknown> = {};
      if (values.provider === "cloudinary") {
        settings.cloudName = values.cloudName;
        settings.apiKey = values.apiKey;
        settings.apiSecret = values.apiSecret;
        settings.folder = values.folder;
      } else {
        settings.accessKeyId = values.accessKeyId;
        settings.secretAccessKey = values.secretAccessKey;
        settings.bucket = values.bucket;
        settings.endpoint = values.endpoint;
        settings.region = values.region;
        settings.publicBaseUrl = values.publicBaseUrl;
      }

      const { data, error } = await supabase.functions.invoke("admin-storage-settings", {
        method: "PUT",
        body: { provider: values.provider, settings },
      });
      if (error) throw error;
      if ((data as any)?.ok !== true) throw new Error((data as any)?.error ?? "Save failed");
      toast({ title: "Saved", description: "External storage settings updated." });
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function onTestUpload() {
    if (!file) {
      toast({ title: "Pick a file", description: "Choose an image to upload." });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("purpose", "admin-test");
      const { data, error } = await supabase.functions.invoke("admin-upload", { method: "POST", body: fd });
      if (error) throw error;
      if ((data as any)?.ok !== true) throw new Error((data as any)?.error ?? "Upload failed");
      const url = String((data as any)?.url ?? "");
      await navigator.clipboard.writeText(url).catch(() => undefined);
      toast({ title: "Uploaded", description: "URL copied to clipboard." });
    } catch (e) {
      toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-sm font-semibold">External Storage Settings</div>
        <div className="text-sm text-muted-foreground">
          Configure S3/R2/Cloudinary here. Credentials are stored encrypted in MySQL (never in the browser).
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <div className="grid gap-2">
          <div className="text-sm font-medium">Provider</div>
          <Select value={provider} onValueChange={(v) => form.setValue("provider", v as any)}>
            <SelectTrigger disabled={loading}>
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="s3">S3</SelectItem>
              <SelectItem value="r2">Cloudflare R2</SelectItem>
              <SelectItem value="cloudinary">Cloudinary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {provider === "cloudinary" ? (
          <div className="grid gap-3 rounded-xl border bg-card p-4">
            <div className="grid gap-2">
              <div className="text-sm font-medium">Cloud name</div>
              <Input disabled={loading} {...form.register("cloudName")} />
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">API key</div>
              <Input disabled={loading} {...form.register("apiKey")} />
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">API secret</div>
              <Input disabled={loading} type="password" {...form.register("apiSecret")} />
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Folder (optional)</div>
              <Input disabled={loading} {...form.register("folder")} />
            </div>
          </div>
        ) : (
          <div className="grid gap-3 rounded-xl border bg-card p-4">
            <div className="grid gap-2">
              <div className="text-sm font-medium">Access key</div>
              <Input disabled={loading} {...form.register("accessKeyId")} />
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Secret key</div>
              <Input disabled={loading} type="password" {...form.register("secretAccessKey")} />
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Bucket</div>
              <Input disabled={loading} {...form.register("bucket")} />
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Endpoint (optional)</div>
              <Input disabled={loading} placeholder="https://..." {...form.register("endpoint")} />
              <div className="text-xs text-muted-foreground">For R2 use your R2 S3 endpoint URL.</div>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Region</div>
              <Input disabled={loading} {...form.register("region")} />
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Public base URL (optional)</div>
              <Input disabled={loading} placeholder="https://cdn.example.com/bucket" {...form.register("publicBaseUrl")} />
            </div>
          </div>
        )}

        <Button type="submit" disabled={saving || loading} className="w-full">
          {saving ? "Saving…" : "Save storage settings"}
        </Button>
      </form>

      <div className="rounded-xl border bg-card p-4">
        <div className="text-sm font-semibold">Test upload</div>
        <div className="mt-2 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="grid gap-2">
            <div className="text-sm font-medium">File</div>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              aria-label="Pick file to upload"
            />
            <div className="text-xs text-muted-foreground">Uploads via backend, returns a public URL you can paste into deals/logo.</div>
          </div>
          <Button type="button" onClick={() => void onTestUpload()} disabled={uploading}>
            {uploading ? "Uploading…" : "Upload & copy URL"}
          </Button>
        </div>
      </div>
    </div>
  );
}
