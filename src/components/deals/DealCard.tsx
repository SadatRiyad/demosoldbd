import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CountdownPill from "@/components/deals/CountdownPill";
import { FlashDeal, SOLD_BD } from "@/config/soldbd";
import { whatsappOrderLink } from "@/lib/whatsapp";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { DEAL_CATEGORY_META } from "@/lib/dealCategoryMeta";
import { useCountdown } from "@/lib/useCountdown";

export default function DealCard({ deal }: { deal: FlashDeal }) {
  const settings = useSiteSettings();
  const phone = settings.data?.whatsapp_phone_e164 ?? SOLD_BD.whatsapp.phoneE164;

  const soldOut = deal.stock <= 0;
  const isExpired = new Date(deal.endsAt).getTime() <= Date.now();
  const isLive = !soldOut && !isExpired;

  const c = useCountdown(deal.endsAt);
  const secondsLeft = c.days * 86400 + c.hours * 3600 + c.minutes * 60 + c.seconds;
  const endsSoon = !c.isComplete && secondsLeft > 0 && secondsLeft <= 600;

  const whatsappHref = whatsappOrderLink(
    phone,
    `Hi sold.bd! I want to buy: ${deal.title}${deal.priceBdt ? ` (৳${deal.priceBdt})` : ""}. Is it still available?`,
  );

  return (
    <Card className={"overflow-hidden shadow-premium" + (isExpired ? " opacity-80" : "")}
      aria-label={isExpired ? "Deal ended" : isLive ? "Deal live" : soldOut ? "Deal sold out" : "Deal"}
    >
      <div className="relative">
        <img
          src={deal.imageUrl}
          alt={`${deal.title} product image`}
          loading="lazy"
          className={"h-44 w-full object-cover" + (isExpired ? " grayscale" : "")}
        />
        <div className="absolute left-3 top-3 flex gap-2">
          {isLive ? (
            <Badge className="bg-brand text-brand-foreground hover:bg-brand/90">LIVE</Badge>
          ) : isExpired ? (
            <Badge variant="secondary">SOLD</Badge>
          ) : null}
          {endsSoon ? (
            <Badge variant="secondary" className="px-2 py-0 text-[10px] font-semibold">
              Ends soon
            </Badge>
          ) : null}
          <Badge variant="secondary" className="inline-flex items-center gap-1.5">
            {(() => {
              const Icon = DEAL_CATEGORY_META[deal.category].Icon;
              return <Icon className="h-3.5 w-3.5" />;
            })()}
            {deal.category}
          </Badge>
          {soldOut ? <Badge variant="destructive">Sold Out</Badge> : <Badge variant="secondary">Stock: {deal.stock}</Badge>}
        </div>
        <div className="absolute bottom-3 left-3">
          <CountdownPill endsAt={deal.endsAt} />
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{deal.title}</CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">{deal.description}</p>
        {typeof deal.priceBdt === "number" && (
          <div className="mt-4 text-base font-semibold">
            ৳{deal.priceBdt.toLocaleString("en-US")}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button asChild className="w-full" disabled={soldOut || isExpired} aria-disabled={soldOut || isExpired}>
          <a href={whatsappHref} target="_blank" rel="noreferrer">
            {isExpired ? "Deal ended" : soldOut ? "Sold Out" : "Buy on WhatsApp"}
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
