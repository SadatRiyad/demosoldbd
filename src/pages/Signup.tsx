import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/lib/usePageMeta";

const schema = z.object({
  displayName: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(200),
});

type FormValues = z.infer<typeof schema>;

export default function Signup() {
  usePageMeta({ title: "Sign up | sold.bd", description: "Create an account to access sold.bd tools." });
  const navigate = useNavigate();
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", email: "", password: "" },
  });
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        // MySQL-only data mode: do not write to backend tables (profiles/site_settings/etc).
        // Store display name in auth user metadata instead.
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: values.displayName },
        },
      });
      if (error) throw error;

      // Note: we intentionally do NOT insert into public.profiles.
      // Roles remain in user_roles for secure admin gating.

      toast({ title: "Account created", description: "You can now log in." });
      navigate("/login", { replace: true });
    } catch (e) {
      toast({ title: "Signup failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-background">
      <section className="container py-12 md:py-16">
        <Card className="mx-auto max-w-md shadow-premium">
          <CardHeader>
            <CardTitle className="text-2xl">Create account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Display name</div>
                <Input autoComplete="name" {...form.register("displayName")} />
                {form.formState.errors.displayName && (
                  <div className="text-sm text-destructive">{form.formState.errors.displayName.message}</div>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Email</div>
                <Input type="email" autoComplete="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <div className="text-sm text-destructive">{form.formState.errors.email.message}</div>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Password</div>
                <Input type="password" autoComplete="new-password" {...form.register("password")} />
                {form.formState.errors.password && (
                  <div className="text-sm text-destructive">{form.formState.errors.password.message}</div>
                )}
              </div>
              <Button className="w-full" type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create account"}
              </Button>
              <div className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link className="text-primary hover:underline" to="/login">
                  Log in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
