import { SOLD_BD, whatsappOrderLink } from "@/config/soldbd";

export default function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="text-sm font-semibold">{SOLD_BD.brand.name}</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Limited-stock drops from local sellers. Miss it, it’s gone forever.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold">Contact</div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <a
                className="story-link inline-flex"
                href={whatsappOrderLink("Hi sold.bd! I have a question.")}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp support
              </a>
              <div>Email: hello@sold.bd</div>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold">Trust</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Transparent stock counts, clear deadlines, and fast WhatsApp ordering.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>© 2026 sold.bd — All rights reserved</div>
          <div className="flex gap-4">
            <a className="hover:text-foreground" href="/about">
              About
            </a>
            <a className="hover:text-foreground" href="/contact">
              Early Access
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
