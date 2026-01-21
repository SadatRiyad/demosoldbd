import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_FAQ = [
  {
    q: "How do I order a deal?",
    a: "Tap ‘Buy on WhatsApp’. We’ll open a chat with the item details so you can confirm availability and delivery.",
  },
  {
    q: "Are stock counts real?",
    a: "Yes. Deals show live stock. When stock reaches zero, the deal is marked Sold Out.",
  },
  {
    q: "Do deals expire automatically?",
    a: "Yes. Each drop has a countdown timer. When time is up, the deal disappears from the public list.",
  },
  {
    q: "Is there a checkout or payment inside the website?",
    a: "Not in V1. Ordering happens via WhatsApp so it’s fast and familiar for Bangladesh.",
  },
];

export default function FaqSection({
  items,
  loading,
}: {
  items?: Array<{ q: string; a: string }>;
  loading?: boolean;
}) {
  const safeItems = items && items.length > 0 ? items : DEFAULT_FAQ;

  return (
    <section className="container py-14 md:py-18" aria-labelledby="faq-title">
      <header className="max-w-2xl">
        <h2 id="faq-title" className="text-2xl font-extrabold tracking-tight md:text-3xl">
          FAQ
        </h2>
        <p className="mt-2 text-muted-foreground">Everything you need to know before your first drop.</p>
      </header>

      <div className="mt-8 rounded-2xl border bg-card p-2 shadow-premium">
        <Accordion type="single" collapsible className="w-full">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="px-4 py-4">
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))
          ) : (
            safeItems.map((it, idx) => (
              <AccordionItem key={`${it.q}-${idx}`} value={`${idx}`}>
                <AccordionTrigger className="px-4">{it.q}</AccordionTrigger>
                <AccordionContent className="px-4 text-muted-foreground">{it.a}</AccordionContent>
              </AccordionItem>
            ))
          )}
        </Accordion>
      </div>
    </section>
  );
}
