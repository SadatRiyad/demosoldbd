import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/lib/usePageMeta";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Timer, MessageCircle } from "lucide-react";

export default function About() {
  usePageMeta({
    title: "About | sold.bd",
    description: "Learn how sold.bd works and why we’re building Bangladesh’s most trusted flash-deals marketplace.",
  });

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
