import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { apiInvoke } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/lib/usePageMeta";

const schema = z.object({ token: z.string().trim().min(20).max(200) });
type FormValues = z.infer<typeof schema>;

export default function BootstrapAdmin() {
  usePageMeta({ title: "Bootstrap Admin | sold.bd", description: "Create the first admin role (one-time)." });
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { token: "" } });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const { data, error } = await apiInvoke("bootstrap-admin", { body: { token: values.token } });
      if (error) throw error;
      if ((data as any)?.ok !== true) throw new Error((data as any)?.error ?? "Bootstrap failed");
      toast({ title: "Admin granted", description: "You can now open the admin dashboard." });
      navigate("/admin", { replace: true });
    } catch (e) {
      toast({ title: "Bootstrap failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-background">
      <section className="container py-12 md:py-16">
        <Card className="mx-auto max-w-xl shadow-premium">
          <CardHeader>
            <CardTitle className="text-2xl">Bootstrap first admin (one-time)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Bootstrap token</div>
                <Input autoComplete="off" {...form.register("token")} />
                {form.formState.errors.token && (
                  <div className="text-sm text-destructive">{form.formState.errors.token.message}</div>
                )}
                <div className="text-xs text-muted-foreground">
                  Use this once to grant your account the admin role. After an admin exists, this will stop working.
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Granting…" : "Grant admin role"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
