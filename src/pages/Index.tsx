import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SOLD_BD, whatsappOrderLink } from "@/config/soldbd";
import { useCountdown } from "@/lib/useCountdown";
import { usePageMeta } from "@/lib/usePageMeta";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function Index() {
  usePageMeta({
    title: "sold.bd | Bangladesh Flash Deals Marketplace",
    description: "Get it before it’s sold — limited-stock flash deals from Bangladeshi sellers. Order fast on WhatsApp.",
  });

  const next = useCountdown(SOLD_BD.nextDropAt);
  const whatsappHref = whatsappOrderLink(SOLD_BD.whatsapp.defaultMessage);
  const nextLabel = next.days > 0 ? `${next.days}d ${pad(next.hours)}h` : `${pad(next.hours)}:${pad(next.minutes)}:${pad(next.seconds)}`;

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
              <Badge className="bg-brand text-brand-foreground hover:bg-brand/90">Live drops • Limited stock</Badge>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-5xl">
                Get it Before it’s Sold — Bangladesh’s Flash Deals Marketplace
              </h1>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                Limited-stock drops from local sellers. Miss it, it’s gone forever.
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
              <div className="rounded-2xl border bg-card p-6 shadow-premium">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Today’s highlights</div>
                    <a className="text-sm text-primary hover:underline" href="/deals">
                      View all
                    </a>
                  </div>
                  <div className="grid gap-3">
                    {SOLD_BD.deals.slice(0, 3).map((d) => (
                      <div key={d.id} className="flex items-center gap-3 rounded-xl border p-3">
                        <img src={d.imageUrl} alt={`${d.title} thumbnail`} className="h-14 w-14 rounded-lg object-cover" loading="lazy" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{d.title}</div>
                          <div className="truncate text-xs text-muted-foreground">{d.description}</div>
                        </div>
                        <Badge variant={d.stock <= 0 ? "destructive" : "secondary"}>{d.stock <= 0 ? "Sold" : `${d.stock} left`}</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                    Pro tip: turn on notifications in WhatsApp so you never miss a drop.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="container py-14 md:py-18">
        <header className="max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Why sold.bd feels different</h2>
          <p className="mt-2 text-muted-foreground">Premium experience, urgency by design, and transparent stock.</p>
        </header>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "⏳ Limited Time Deals", desc: "Every drop has a clear timer — no guesswork." },
            { title: "📦 Limited Stock", desc: "Real stock counts. When it’s sold, it’s gone." },
            { title: "🇧🇩 Local Sellers", desc: "Curated deals from Bangladeshi merchants." },
            { title: "💬 WhatsApp Ordering", desc: "Fast ordering without complex checkout steps." },
          ].map((f) => (
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

      <section className="container pb-16">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-premium lg:col-span-2">
            <CardContent className="p-8">
              <h3 className="text-xl font-extrabold tracking-tight">Social proof that builds trust</h3>
              <p className="mt-2 text-muted-foreground">(Optional section) Replace these with real Bangladeshi customer quotes when ready.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {["Fast response on WhatsApp — got my deal confirmed in minutes.", "Stock was accurate. When it says 7 left, it’s real."]
                  .map((q, idx) => (
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
              <h3 className="text-xl font-extrabold tracking-tight">Don’t miss the next drop</h3>
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
    </div>
  );
}
