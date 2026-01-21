import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Timer, BadgeCheck } from "lucide-react";

export default function AboutTeaserSection() {
  return (
    <section className="container pb-16" aria-labelledby="about-teaser-title">
      <div className="grid gap-6">
        <Card className="shadow-premium">
          <CardContent className="p-8">
            <h2 id="about-teaser-title" className="text-xl font-extrabold tracking-tight md:text-2xl">
              Built for speed, trust, and real urgency
            </h2>
            <p className="mt-2 text-muted-foreground">
              sold.bd is a flash-deals marketplace for Bangladesh: clear timers, transparent stock, and WhatsApp-first ordering.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Timer className="h-4 w-4 text-primary" />
                  Clear deadlines
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Every deal shows exactly when it ends.</p>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  Transparent stock
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Know what’s left before you message.</p>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Verified sellers
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Curated deals from trusted merchants.</p>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline">
                <Link to="/about">Learn more about sold.bd</Link>
              </Button>
              <Button asChild>
                <Link to="/deals">Browse deals</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
