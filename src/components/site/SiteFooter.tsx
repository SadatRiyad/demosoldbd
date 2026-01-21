import { SOLD_BD } from "@/config/soldbd";
import { whatsappOrderLink } from "@/lib/whatsapp";
import { useSiteSettings } from "@/lib/useSiteSettings";

export default function SiteFooter() {
  const settings = useSiteSettings();
  const brandName = settings.data?.brand_name ?? SOLD_BD.brand.name;
  const footerBlurb = ((settings.data?.content as any)?.footerBlurb as string | undefined) ??
    "Limited-stock drops from local sellers. Miss it, it’s gone forever.";
  const trustBlurb = ((settings.data?.content as any)?.trustBlurb as string | undefined) ??
    "Transparent stock counts, clear deadlines, and fast WhatsApp ordering.";
  const phone = settings.data?.whatsapp_phone_e164 ?? SOLD_BD.whatsapp.phoneE164;

  return (
    <footer className="border-t">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="text-sm font-semibold">{brandName}</div>
            <p className="mt-2 text-sm text-muted-foreground">{footerBlurb}</p>
          </div>
          <div>
            <div className="text-sm font-semibold">Contact</div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <a
                className="story-link inline-flex"
                href={whatsappOrderLink(phone, "Hi sold.bd! I have a question.")}
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
            <p className="mt-2 text-sm text-muted-foreground">{trustBlurb}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>© 2026 {brandName} — All rights reserved</div>
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
