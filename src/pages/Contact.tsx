import * as React from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SOLD_BD } from "@/config/soldbd";
import { whatsappOrderLink } from "@/lib/whatsapp";
import { usePageMeta } from "@/lib/usePageMeta";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const emailSchema = z.string().trim().email().max(255);

export default function Contact() {
  usePageMeta({
    title: "Early Access | sold.bd",
    description: "Get early access to upcoming flash drops on sold.bd via WhatsApp or email notifications.",
  });

  const [email, setEmail] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  const { toast } = useToast();
  const settings = useSiteSettings();

  const phone = settings.data?.whatsapp_phone_e164 ?? SOLD_BD.whatsapp.phoneE164;
  const defaultMsg = settings.data?.whatsapp_default_message ?? SOLD_BD.whatsapp.defaultMessage;
  const whatsappHref = whatsappOrderLink(phone, defaultMsg);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from("early_access_signups").insert({ email: parsed.data });
      // ignore duplicates (unique constraint)
      if (error && !String(error.message).toLowerCase().includes("duplicate")) throw error;
      setSaved(true);
    } catch (err) {
      toast({ title: "Couldn’t save", description: (err as Error).message, variant: "destructive" });
    }
  }

  return (
    <div className="bg-background">
      <section className="container py-12 md:py-16">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Get Early Access</h1>
          <p className="mt-3 text-muted-foreground">
            Join the WhatsApp list for drop alerts, or leave your email for upcoming updates.
          </p>
        </header>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className="shadow-premium">
            <CardHeader>
              <CardTitle className="text-xl">WhatsApp</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Fastest way to order and get notified — tap below.
              </p>
              <Button asChild className="mt-4 w-full">
                <a href={whatsappHref} target="_blank" rel="noreferrer">
                  Get Early Access on WhatsApp
                </a>
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">Number: {phone}</p>
            </CardContent>
          </Card>

          <Card className="shadow-premium">
            <CardHeader>
              <CardTitle className="text-xl">Email updates (optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-3">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="you@example.com"
                  aria-label="Email address"
                  required
                />
                <Button type="submit" className="w-full">
                  Notify me
                </Button>
                {saved && <div className="text-sm text-muted-foreground">Saved — we’ll use this for next-drop updates.</div>}
                <div className="text-xs text-muted-foreground">
                  MVP note: this saves locally in your browser; connect Cloud later for real email capture.
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
