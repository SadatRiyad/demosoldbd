import * as React from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SOLD_BD } from "@/config/soldbd";
import { whatsappOrderLink } from "@/lib/whatsapp";
import { usePageMeta } from "@/lib/usePageMeta";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

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

  const contactTrust = ((settings.data?.content as any)?.contact_trust as
    | {
        supportHours?: string;
        location?: string;
        returns?: string;
        shipping?: string;
        privacy?: string;
      }
    | undefined) ?? {};

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
      const { data, error } = await supabase.functions.invoke("early-access", {
        method: "POST",
        body: { email: parsed.data },
      });
      if (error) throw error;
      if ((data as any)?.ok !== true) throw new Error((data as any)?.error ?? "Couldn’t save");
      setSaved(true);
    } catch (err) {
      toast({ title: "Couldn’t save", description: (err as Error).message, variant: "destructive" });
    }
  }

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="container py-14 md:py-20">
          <header className="max-w-3xl">
            <Badge className="bg-brand text-brand-foreground hover:bg-brand/90">Early Access & Support</Badge>
            <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight md:text-5xl">Get Early Access</h1>
            <p className="mt-3 text-muted-foreground md:text-lg">
              Join the WhatsApp list for drop alerts, or leave your email for updates. We’ll help you order fast.
            </p>
          </header>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-premium lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">WhatsApp (fastest)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Tap below to open a chat with our default message.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Button asChild size="lg" className="w-full">
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    Chat on WhatsApp
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full">
                  <Link to="/deals">Browse deals</Link>
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">WhatsApp: {phone}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="h-4 w-4 text-primary" /> Support hours
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{contactTrust.supportHours ?? "10:00 AM – 10:00 PM (BDT)"}</div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4 text-primary" /> Location
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{contactTrust.location ?? "Dhaka, Bangladesh"}</div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Trust
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">Clear timers & stock transparency</div>
                </div>
              </div>
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
                <div className="text-xs text-muted-foreground">We only use this for drop alerts. No spam.</div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 grid gap-6 md:mt-12 md:grid-cols-3">
          <Card className="shadow-premium">
            <CardContent className="p-6">
              <div className="text-sm font-semibold">Returns & refunds</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {contactTrust.returns ?? "Handled by the seller. We’ll help connect you quickly on WhatsApp."}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-premium">
            <CardContent className="p-6">
              <div className="text-sm font-semibold">Shipping</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {contactTrust.shipping ?? "Delivery time and cost depend on the seller and your location."}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-premium">
            <CardContent className="p-6">
              <div className="text-sm font-semibold">Privacy</div>
              <p className="mt-2 text-sm text-muted-foreground">{contactTrust.privacy ?? "We store your email for early access alerts only."}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
