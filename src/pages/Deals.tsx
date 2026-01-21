import * as React from "react";
import { DEFAULT_CATEGORIES, SOLD_BD, type DealCategory, type FlashDeal } from "@/config/soldbd";
import DealCard from "@/components/deals/DealCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePageMeta } from "@/lib/usePageMeta";
import { useDeals } from "@/lib/useDeals";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { getDealCategoryMeta } from "@/lib/dealCategoryMeta";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { Search } from "lucide-react";

type SortMode = "endingSoon" | "newest" | "stock";

function sortDeals(deals: FlashDeal[], sort: SortMode) {
  const copy = [...deals];
  if (sort === "stock") return copy.sort((a, b) => b.stock - a.stock);
  if (sort === "newest") return copy.sort((a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime());
  return copy.sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
}

export default function Deals() {
  usePageMeta({
    title: "Flash Deals | sold.bd",
    description: "Browse live flash deals from Bangladeshi sellers — limited time, limited stock.",
  });

  const settings = useSiteSettings();
  const categories = React.useMemo(() => {
    const raw = (settings.data?.content as any)?.dealCategories as unknown;
    const fromSettings = Array.isArray(raw)
      ? raw
          .map((v) => String(v ?? "").trim())
          .filter(Boolean)
          .slice(0, 20)
      : [];
    const base = fromSettings.length ? fromSettings : [...DEFAULT_CATEGORIES];
    // Unique + stable ordering
    return Array.from(new Set(base));
  }, [settings.data]);

  const CATEGORIES: Array<DealCategory | "All"> = React.useMemo(() => ["All", ...categories], [categories]);

  const [category, setCategory] = React.useState<(typeof CATEGORIES)[number]>("All");
  const [sort, setSort] = React.useState<SortMode>("endingSoon");
  const [page, setPage] = React.useState(1);
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebouncedValue(query, 250);

  const dealsQuery = useDeals();
  const hasDeals = (dealsQuery.data?.length ?? 0) > 0;
  const deals = hasDeals ? dealsQuery.data! : SOLD_BD.deals;
  const loading = dealsQuery.isLoading && !hasDeals;

  const pageSize = 8;

  const filtered = React.useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const base = category === "All" ? deals : deals.filter((d) => d.category === category);
    const searched =
      q.length === 0
        ? base
        : base.filter((d) => `${d.title} ${d.description}`.toLowerCase().includes(q));
    return sortDeals(searched, sort);
  }, [category, debouncedQuery, sort, deals]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  React.useEffect(() => setPage(1), [category, sort, debouncedQuery]);

  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const hasActiveFilters = category !== "All" || sort !== "endingSoon" || debouncedQuery.trim().length > 0;

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="container py-12 md:py-16">
          <div className="max-w-3xl">
            <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl">Flash deals live now</h1>
            <p className="mt-3 text-muted-foreground md:text-lg">
              Browse drops from Bangladeshi sellers — transparent stock, clear timers, WhatsApp-first ordering.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-10 md:py-14">
        <div className="sticky top-14 z-20 -mx-4 px-4 pb-4 pt-2 md:static md:mx-0 md:px-0 md:pb-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <Card className="w-full p-4 shadow-premium md:w-auto">
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <div className="text-xs font-medium text-muted-foreground">Search</div>
                  <div className="flex items-center gap-2 rounded-md border bg-card px-3">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search deals (e.g. earbuds, polo…)"
                      className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      aria-label="Search deals"
                    />
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="text-xs font-medium text-muted-foreground">Category</div>
                  <div className="mt-2 overflow-x-auto">
                    <ToggleGroup
                      type="single"
                      value={category}
                      onValueChange={(v) => setCategory((v as any) || "All")}
                      className="justify-start"
                    >
                      {CATEGORIES.map((c) => (
                        <ToggleGroupItem key={c} value={c} variant="outline" size="sm" className="shrink-0">
                          {c === "All" ? (
                            "All"
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              {(() => {
                                const Icon = getDealCategoryMeta(c).Icon;
                                return <Icon className="h-4 w-4" />;
                              })()}
                              {c}
                            </span>
                          )}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:hidden">
                  <div className="grid gap-2">
                    <div className="text-xs font-medium text-muted-foreground">Category</div>
                    <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                        {c === "All" ? (
                          "All"
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            {(() => {
                              const Icon = getDealCategoryMeta(c).Icon;
                              return <Icon className="h-4 w-4" />;
                            })()}
                            {c}
                          </span>
                        )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <div className="text-xs font-medium text-muted-foreground">Sort</div>
                    <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="endingSoon">Ending soon</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="stock">Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="hidden md:grid md:grid-cols-2 md:gap-3">
                  <div className="grid gap-2">
                    <div className="text-xs font-medium text-muted-foreground">Sort</div>
                    <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
                      <SelectTrigger className="w-full md:w-56">
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="endingSoon">Ending soon</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="stock">Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!hasActiveFilters}
                      onClick={() => {
                        setCategory("All");
                        setSort("endingSoon");
                        setQuery("");
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {loading ? "Loading…" : (
                  <>
                    Showing <span className="font-medium text-foreground">{filtered.length}</span> deal{filtered.length === 1 ? "" : "s"}
                    {category !== "All" ? (
                      <>
                        {" "}in <span className="font-medium text-foreground">{category}</span>
                      </>
                    ) : null}
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {dealsQuery.isError ? (
                  <div className="text-sm text-muted-foreground">Showing demo deals (couldn’t load live deals).</div>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="md:hidden"
                  disabled={!hasActiveFilters}
                  onClick={() => {
                    setCategory("All");
                    setSort("endingSoon");
                    setQuery("");
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="overflow-hidden rounded-lg border bg-card shadow-premium">
                  <Skeleton className="h-44 w-full" />
                  <div className="space-y-3 p-5">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
              ))
            : paged.map((deal) => <DealCard key={deal.id} deal={deal} />)}
        </div>

        {!loading && filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border bg-card p-8 text-center shadow-premium">
            <div className="text-lg font-semibold">No deals match your filters</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different keyword, switch category, or sort by Ending soon.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Button variant="outline" onClick={() => setCategory("All")}>Reset category</Button>
              <Button variant="outline" onClick={() => setQuery("")}>Clear search</Button>
              <Button variant="outline" onClick={() => setSort("endingSoon")}>Sort ending soon</Button>
            </div>
          </div>
        ) : null}

        <div className="mt-10 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>
            Prev
          </Button>
          <div className="text-sm text-muted-foreground">
            Page <span className="font-medium text-foreground">{safePage}</span> of {totalPages}
          </div>
          <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>
            Next
          </Button>
        </div>
      </section>
    </div>
  );
}
