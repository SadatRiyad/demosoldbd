import * as React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { FlashDeal } from "@/config/soldbd";
import { DEAL_CATEGORY_META } from "@/lib/dealCategoryMeta";

function FeaturedDealRow({ deal }: { deal: FlashDeal }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <img
        src={deal.imageUrl}
        alt={`${deal.title} thumbnail`}
        className="h-14 w-14 rounded-lg object-cover"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{deal.title}</div>
        <div className="mt-0.5 flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            {(() => {
              const Icon = DEAL_CATEGORY_META[deal.category].Icon;
              return <Icon className="h-3.5 w-3.5" />;
            })()}
            {deal.category}
          </div>
          <div className="truncate text-xs text-muted-foreground">• {deal.description}</div>
        </div>
      </div>
      <Badge variant={deal.stock <= 0 ? "destructive" : "secondary"}>{deal.stock <= 0 ? "Sold" : `${deal.stock} left`}</Badge>
    </div>
  );
}

function FeaturedDealRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <Skeleton className="h-14 w-14 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
      </div>
      <Skeleton className="h-6 w-14 rounded-full" />
    </div>
  );
}

export default function FeaturedDealsSection({
  deals,
  loading,
}: {
  deals: FlashDeal[];
  loading: boolean;
}) {
  const items = React.useMemo(() => deals.slice(0, 3), [deals]);

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-premium">
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
            items.map((d) => <FeaturedDealRow key={d.id} deal={d} />)
          )}
        </div>

        <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
          Pro tip: turn on WhatsApp notifications so you never miss a drop.
        </div>
      </div>
    </div>
  );
}
