import * as React from "react";
import { SOLD_BD, type DealCategory, type FlashDeal } from "@/config/soldbd";
import DealCard from "@/components/deals/DealCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePageMeta } from "@/lib/usePageMeta";
import { useDeals } from "@/lib/useDeals";

type SortMode = "timeLeft" | "stock";

const CATEGORIES: Array<DealCategory | "All"> = ["All", "Electronics", "Fashion", "Food", "Home", "Beauty"];

function sortDeals(deals: FlashDeal[], sort: SortMode) {
  const copy = [...deals];
  if (sort === "stock") return copy.sort((a, b) => b.stock - a.stock);
  return copy.sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
}

export default function Deals() {
  usePageMeta({
    title: "Flash Deals | sold.bd",
    description: "Browse live flash deals from Bangladeshi sellers — limited time, limited stock.",
  });

  const [category, setCategory] = React.useState<(typeof CATEGORIES)[number]>("All");
  const [sort, setSort] = React.useState<SortMode>("timeLeft");
  const [page, setPage] = React.useState(1);

  const dealsQuery = useDeals();
  const deals = dealsQuery.data?.length ? dealsQuery.data : SOLD_BD.deals;

  const pageSize = 8;

  const filtered = React.useMemo(() => {
    const base = category === "All" ? deals : deals.filter((d) => d.category === category);
    return sortDeals(base, sort);
  }, [category, sort, deals]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  React.useEffect(() => setPage(1), [category, sort]);

  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="bg-background">
      <section className="container py-10 md:py-14">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Flash Deals Marketplace</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Live drops from local sellers — stock updates fast. If it’s sold, it’s gone.
            </p>
          </div>

          <Card className="w-full p-4 md:w-auto">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <div className="text-xs font-medium text-muted-foreground">Category</div>
                <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <div className="text-xs font-medium text-muted-foreground">Sort</div>
                <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timeLeft">Time left</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>

        {dealsQuery.isError && (
          <div className="mt-6 text-sm text-muted-foreground">
            Showing demo deals (couldn’t load live deals from the database).
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>
            Prev
          </Button>
          <div className="text-sm text-muted-foreground">
            Page <span className="font-medium text-foreground">{safePage}</span> of {totalPages}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
          >
            Next
          </Button>
        </div>
      </section>
    </div>
  );
}
