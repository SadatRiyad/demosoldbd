import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/lib/usePageMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SOLD_BD } from "@/config/soldbd";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { whatsappOrderLink } from "@/lib/whatsapp";
import { Clock, MapPin, MessageCircle, ShieldCheck, Timer } from "lucide-react";

export default function About() {
  usePageMeta({
    title: "About | sold.bd",
    description: "Learn how sold.bd works and why we’re building Bangladesh’s most trusted flash-deals marketplace.",
  });

  const settings = useSiteSettings();
  const phone = settings.data?.whatsapp_phone_e164 ?? SOLD_BD.whatsapp.phoneE164;
  const defaultMsg = settings.data?.whatsapp_default_message ?? SOLD_BD.whatsapp.defaultMessage;
  const whatsappHref = whatsappOrderLink(phone, defaultMsg);

  const contactTrust = ((settings.data?.content as any)?.contact_trust as
    | {
        supportHours?: string;
        location?: string;
        returns?: string;
      }
    | undefined) ?? {};

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="container py-14 md:py-20">
          <header className="max-w-3xl">
            <Badge className="bg-brand text-brand-foreground hover:bg-brand/90">About sold.bd</Badge>
            <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight md:text-5xl">Built for speed, trust, and FOMO</h1>
            <p className="mt-3 text-muted-foreground md:text-lg">
              sold.bd is a Bangladeshi flash-deals marketplace where verified local sellers drop limited stock for a limited time.
            </p>
          </header>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-premium lg:col-span-2">
            <CardContent className="p-8">
              <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">Order in seconds</h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                No slow checkout in V1. Deals are WhatsApp-first so buyers can confirm availability, delivery time, and payment options fast.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="sm:w-auto">
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    Chat on WhatsApp
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="sm:w-auto">
                  <a href="/deals">Browse deals</a>
                </Button>
              </div>
              <div className="mt-6 text-xs text-muted-foreground">WhatsApp: {phone}</div>
            </CardContent>
          </Card>

          <Card className="shadow-premium">
            <CardContent className="p-8">
              <div className="text-sm font-semibold">Trust basics</div>
              <div className="mt-4 grid gap-3">
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
                    <ShieldCheck className="h-4 w-4 text-primary" /> Policies
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {contactTrust.returns ?? "Returns/refunds handled by the seller. We help connect you fast."}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-premium">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Timer className="h-4 w-4 text-primary" />
                How it works
              </div>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>We publish limited-time drops from local sellers.</li>
                <li>You pick a deal and order instantly on WhatsApp.</li>
                <li>Stock is transparent — when it’s gone, it’s gone.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-premium">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MessageCircle className="h-4 w-4 text-primary" />
                Why WhatsApp
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                In BD, WhatsApp is the fastest way to confirm availability, delivery details, and payment options—without a slow checkout.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-premium">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Trust & policies
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                We prioritize clear timers, transparent stock, and verified sellers. Share your policy details on the Contact page.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 rounded-2xl border bg-card p-8 shadow-premium">
          <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">Our goal</h2>
          <p className="mt-2 text-muted-foreground">
            Build a premium, trustworthy marketplace that rewards early buyers and helps sellers move inventory quickly.
          </p>
        </div>
      </section>
    </div>
  );
}
