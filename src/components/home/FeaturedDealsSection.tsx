import * as React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { FlashDeal } from "@/config/soldbd";
import { DEAL_CATEGORY_META } from "@/lib/dealCategoryMeta";
import { useCountdown } from "@/lib/useCountdown";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function EndingIn({ endsAt, endsSoonThresholdSeconds }: { endsAt: string; endsSoonThresholdSeconds: number }) {
  const c = useCountdown(endsAt);
  if (c.isComplete) return <span className="text-xs text-muted-foreground">Ended</span>;
  const secondsLeft = c.days * 86400 + c.hours * 3600 + c.minutes * 60 + c.seconds;
  const label = c.days > 0 ? `${c.days}d ${pad(c.hours)}:${pad(c.minutes)}` : `${pad(c.hours)}:${pad(c.minutes)}:${pad(c.seconds)}`;
  return (
    <span className="text-[11px] text-muted-foreground" aria-label={`Ending in ${label}`}>
      Ending in <span className="font-medium text-foreground">{label}</span>
      {secondsLeft > 0 && secondsLeft <= endsSoonThresholdSeconds ? (
        <Badge variant="secondary" className="ml-2 px-2 py-0 text-[10px] font-semibold">
          Ends soon
        </Badge>
      ) : null}
    </span>
  );
}

function FeaturedDealRow({ deal, endsSoonThresholdSeconds }: { deal: FlashDeal; endsSoonThresholdSeconds: number }) {
  const isExpired = new Date(deal.endsAt).getTime() <= Date.now();
  const isLive = deal.stock > 0 && !isExpired;
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border bg-card p-3">
      <img
        src={deal.imageUrl}
        alt={`${deal.title} thumbnail`}
        className="h-12 w-12 shrink-0 rounded-lg object-cover sm:h-14 sm:w-14"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{deal.title}</div>
        <div className="mt-0.5 flex items-center gap-2">
          {isLive ? (
            <Badge className="bg-brand text-brand-foreground hover:bg-brand/90 px-2 py-0 text-[10px] font-semibold">LIVE</Badge>
          ) : isExpired ? (
            <Badge variant="secondary" className="px-2 py-0 text-[10px] font-semibold">
              SOLD
            </Badge>
          ) : null}
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            {(() => {
              const Icon = DEAL_CATEGORY_META[deal.category].Icon;
              return <Icon className="h-3.5 w-3.5" />;
            })()}
            {deal.category}
          </div>
          <div className="min-w-0 truncate text-xs text-muted-foreground">• {deal.description}</div>
        </div>

        <div className="mt-1">
          <EndingIn endsAt={deal.endsAt} endsSoonThresholdSeconds={endsSoonThresholdSeconds} />
        </div>
      </div>
      <Badge className="shrink-0" variant={deal.stock <= 0 ? "destructive" : "secondary"}>
        {deal.stock <= 0 ? "Sold" : `${deal.stock} left`}
      </Badge>
    </div>
  );
}

function FeaturedDealRowSkeleton() {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border bg-card p-3">
      <Skeleton className="h-12 w-12 shrink-0 rounded-lg sm:h-14 sm:w-14" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
      </div>
      <Skeleton className="h-6 w-14 shrink-0 rounded-full" />
    </div>
  );
}

export default function FeaturedDealsSection({
  deals,
  loading,
  endsSoonThresholdSeconds = 10 * 60,
}: {
  deals: FlashDeal[];
  loading: boolean;
  endsSoonThresholdSeconds?: number;
}) {
  const items = React.useMemo(() => deals.slice(0, 3), [deals]);

  return (
    <div className="w-full max-w-full overflow-hidden rounded-2xl border bg-card p-4 shadow-premium sm:p-6">
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Featured deals</div>
          <Link className="text-sm text-primary hover:underline" to="/deals">
            View all
          </Link>
        </div>

        <div className="grid gap-3">
          {loading ? (
            <>
              <FeaturedDealRowSkeleton />
              <FeaturedDealRowSkeleton />
              <FeaturedDealRowSkeleton />
            </>
          ) : (
            items.map((d) => <FeaturedDealRow key={d.id} deal={d} endsSoonThresholdSeconds={endsSoonThresholdSeconds} />)
          )}
        </div>

        <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
          Pro tip: turn on WhatsApp notifications so you never miss a drop.
        </div>
      </div>
    </div>
  );
}
