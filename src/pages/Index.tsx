import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SOLD_BD } from "@/config/soldbd";
import { useCountdown } from "@/lib/useCountdown";
import { usePageMeta } from "@/lib/usePageMeta";
import { useDeals } from "@/lib/useDeals";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { whatsappOrderLink } from "@/lib/whatsapp";
import FeaturedDealsSection from "@/components/home/FeaturedDealsSection";
import FaqSection from "@/components/home/FaqSection";
import AboutTeaserSection from "@/components/home/AboutTeaserSection";
import DealCard from "@/components/deals/DealCard";
import { Skeleton } from "@/components/ui/skeleton";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function Index() {
  usePageMeta({
    title: "sold.bd | Bangladesh Flash Deals Marketplace",
    description: "Get it before it’s sold — limited-stock flash deals from Bangladeshi sellers. Order fast on WhatsApp.",
  });

  const settings = useSiteSettings();

  const phone = settings.data?.whatsapp_phone_e164 ?? SOLD_BD.whatsapp.phoneE164;
  const defaultMsg = settings.data?.whatsapp_default_message ?? SOLD_BD.whatsapp.defaultMessage;
  const nextDropAt = settings.data?.next_drop_at ?? SOLD_BD.nextDropAt;

  const headerKicker = settings.data?.header_kicker ?? "Live drops • Limited stock";
  const heroH1 = settings.data?.hero_h1 ?? "Get it Before it’s Sold — Bangladesh’s Flash Deals Marketplace";
  const heroH1Mobile = ((settings.data?.content as any)?.heroH1Mobile as string | undefined) ?? "";
  const heroH1ClampXs = (((settings.data?.content as any)?.heroH1ClampXs as boolean | undefined) ?? false) === true;
  const endsSoonThresholdMinutes = (settings.data?.content as any)?.endsSoonThresholdMinutes as number | undefined;
  const endsSoonThresholdSeconds =
    typeof endsSoonThresholdMinutes === "number" && Number.isFinite(endsSoonThresholdMinutes)
      ? Math.min(60 * 60, Math.max(60, Math.round(endsSoonThresholdMinutes * 60)))
      : 10 * 60;
  const heroSubtitle =
    settings.data?.hero_subtitle ?? "Limited-stock drops from local sellers. Miss it, it’s gone forever.";

  const next = useCountdown(nextDropAt);
  const whatsappHref = whatsappOrderLink(phone, defaultMsg);
  const nextLabel = next.days > 0 ? `${next.days}d ${pad(next.hours)}h` : `${pad(next.hours)}:${pad(next.minutes)}:${pad(next.seconds)}`;

  const dealsQuery = useDeals();
  const hasDeals = (dealsQuery.data?.length ?? 0) > 0;
  const deals = hasDeals ? dealsQuery.data! : SOLD_BD.deals;
  const dealsLoading = dealsQuery.isLoading && !hasDeals;

  const features =
    ((settings.data?.content as any)?.features as Array<{ title: string; desc: string }> | undefined) ??
    [
      { title: "⏳ Limited Time Deals", desc: "Every drop has a clear timer — no guesswork." },
      { title: "📦 Limited Stock", desc: "Real stock counts. When it’s sold, it’s gone." },
      { title: "🇧🇩 Local Sellers", desc: "Curated deals from Bangladeshi merchants." },
      { title: "💬 WhatsApp Ordering", desc: "Fast ordering without complex checkout steps." },
    ];

  const socialProof =
    ((settings.data?.content as any)?.socialProof as string[] | undefined) ??
    ["Fast response on WhatsApp — got my deal confirmed in minutes.", "Stock was accurate. When it says 7 left, it’s real."];

  const faqItems = ((settings.data?.content as any)?.faq as Array<{ q: string; a: string }> | undefined) ?? undefined;

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-20 top-10 size-80 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-32 w-[120%] -translate-x-1/2 bg-gradient-to-b from-transparent to-background" />
        </div>

        <div className="container relative py-16 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="animate-fade-in">
              <Badge className="bg-brand text-brand-foreground hover:bg-brand/90">{headerKicker}</Badge>
              <h1 className="mt-5 text-pretty font-display text-3xl font-extrabold leading-[1.07] tracking-tight sm:text-4xl sm:leading-[1.08] md:text-6xl md:leading-[1.03]">
                <span className={heroH1ClampXs ? "sm:hidden max-[360px]:clamp-2" : "sm:hidden"}>
                  {heroH1Mobile.trim().length > 0 ? heroH1Mobile : heroH1}
                </span>
                <span className="hidden sm:inline">{heroH1}</span>
              </h1>
              <p className="mt-3 max-w-xl text-base text-muted-foreground sm:text-lg md:mt-4 md:text-xl">
                {heroSubtitle}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="hover-scale">
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    Get Early Access on WhatsApp
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="/deals">Browse Flash Deals</a>
                </Button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Card className="shadow-premium">
                  <CardContent className="p-5">
                    <div className="text-xs font-medium text-muted-foreground">Next flash drop</div>
                    <div className="mt-1 text-2xl font-extrabold tracking-tight">{next.isComplete ? "Now" : nextLabel}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Countdown updates every second</div>
                  </CardContent>
                </Card>
                <Card className="shadow-premium">
                  <CardContent className="p-5">
                    <div className="text-xs font-medium text-muted-foreground">Ordering</div>
                    <div className="mt-1 text-2xl font-extrabold tracking-tight">WhatsApp-first</div>
                    <div className="mt-1 text-xs text-muted-foreground">Fast chat, fast confirmation</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="relative animate-enter">
              <FeaturedDealsSection deals={deals} loading={dealsLoading} endsSoonThresholdSeconds={endsSoonThresholdSeconds} />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-14 md:py-18" aria-labelledby="live-deals-title">
        <header className="max-w-2xl">
          <h2 id="live-deals-title" className="text-2xl font-extrabold tracking-tight md:text-3xl">
            Flash deals live right now
          </h2>
          <p className="mt-2 text-muted-foreground">Fresh drops, clear timers, and WhatsApp ordering in one tap.</p>
        </header>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dealsLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="overflow-hidden rounded-lg border bg-card shadow-premium">
                <Skeleton className="h-44 w-full" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>
            ))
          ) : (
            deals.slice(0, 6).map((d) => <DealCard key={d.id} deal={d} />)
          )}
        </div>
      </section>

      <section id="features" className="container py-14 md:py-18">
        <header className="max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Why sold.bd feels different</h2>
          <p className="mt-2 text-muted-foreground">Premium experience, urgency by design, and transparent stock.</p>
        </header>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="shadow-premium hover-scale">
              <CardHeader>
                <CardTitle className="text-base">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container py-14 md:py-18" aria-labelledby="trust-title">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-premium lg:col-span-2">
            <CardContent className="p-8">
              <h2 id="trust-title" className="text-xl font-extrabold tracking-tight md:text-2xl">
                Social proof that builds trust
              </h2>
              <p className="mt-2 text-muted-foreground">Replace these with real buyer quotes when you’re ready.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {socialProof.map((q, idx) => (
                  <div key={idx} className="rounded-xl border bg-card p-5">
                    <div className="text-sm text-muted-foreground">“{q}”</div>
                    <div className="mt-3 text-xs font-medium">Early buyer • Dhaka</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-premium">
            <CardContent className="p-8">
              <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">Don’t miss the next drop</h2>
              <p className="mt-2 text-sm text-muted-foreground">Join the WhatsApp list for early access and alerts.</p>
              <Button asChild size="lg" className="mt-6 w-full">
                <a href={whatsappHref} target="_blank" rel="noreferrer">
                  Get Early Access
                </a>
              </Button>
              <div className="mt-4 text-xs text-muted-foreground">No spam. Just drop alerts and ordering help.</div>
            </CardContent>
          </Card>
        </div>
      </section>

      <FaqSection items={faqItems} loading={settings.isLoading} />
      <AboutTeaserSection />
    </div>
  );
}
