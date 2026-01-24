import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { API_MODE, NODE_API_BASE_URL } from "@/lib/api/config";
import { setNodeTokens } from "@/lib/api/nodeAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/lib/usePageMeta";

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(200),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  usePageMeta({ title: "Login | sold.bd", description: "Log in to manage your sold.bd account." });
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as any)?.from ?? "/admin";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      if (API_MODE === "node") {
        if (!NODE_API_BASE_URL) throw new Error("VITE_NODE_API_BASE_URL is not set");
        const res = await fetch(`${NODE_API_BASE_URL.replace(/\/+$/, "")}/api/auth/login`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: values.email, password: values.password }),
        });
        const json = (await res.json().catch(() => null)) as any;
        if (!res.ok) throw new Error(String(json?.error ?? "Login failed"));
        if (!json?.accessToken || !json?.refreshToken) throw new Error("Invalid login response");
        setNodeTokens({ accessToken: String(json.accessToken), refreshToken: String(json.refreshToken) });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;
      }
      navigate(from, { replace: true });
    } catch (e) {
      toast({ title: "Login failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-background">
      <section className="container py-12 md:py-16">
        <Card className="mx-auto max-w-md shadow-premium">
          <CardHeader>
            <CardTitle className="text-2xl">Log in</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Email</div>
                <Input type="email" autoComplete="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <div className="text-sm text-destructive">{form.formState.errors.email.message}</div>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Password</div>
                <Input type="password" autoComplete="current-password" {...form.register("password")} />
                {form.formState.errors.password && (
                  <div className="text-sm text-destructive">{form.formState.errors.password.message}</div>
                )}
              </div>
              <Button className="w-full" type="submit" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
              <div className="text-sm text-muted-foreground">
                No account?{" "}
                <Link className="text-primary hover:underline" to="/signup">
                  Create one
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
