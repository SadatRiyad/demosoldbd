import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/lib/usePageMeta";

export default function About() {
  usePageMeta({
    title: "About | sold.bd",
    description: "Learn how sold.bd works and why we’re building Bangladesh’s most trusted flash-deals marketplace.",
  });

  return (
    <div className="bg-background">
      <section className="container py-12 md:py-16">
        <header className="max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Built for speed, trust, and FOMO</h1>
          <p className="mt-3 text-muted-foreground">
            sold.bd is a Bangladeshi flash-deals marketplace where verified local sellers drop limited stock for a limited time.
          </p>
        </header>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Card className="shadow-premium">
            <CardContent className="p-6">
              <div className="text-sm font-semibold">How it works</div>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>We publish limited-time drops from local sellers.</li>
                <li>You pick a deal and order instantly on WhatsApp.</li>
                <li>Stock is transparent — when it’s gone, it’s gone.</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="shadow-premium">
            <CardContent className="p-6">
              <div className="text-sm font-semibold">Why Bangladesh</div>
              <p className="mt-3 text-sm text-muted-foreground">
                We make flash deals simple for BD shoppers: local sellers, clear pricing, and fast WhatsApp ordering.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-premium">
            <CardContent className="p-6">
              <div className="text-sm font-semibold">Our goal</div>
              <p className="mt-3 text-sm text-muted-foreground">
                Build a premium, trustworthy marketplace that rewards early buyers and helps sellers move inventory quickly.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
