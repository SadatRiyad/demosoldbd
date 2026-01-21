import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";
import { SOLD_BD } from "@/config/soldbd";
import { whatsappOrderLink } from "@/lib/whatsapp";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { Menu } from "lucide-react";
import { DEAL_CATEGORY_META } from "@/lib/dealCategoryMeta";
import ThemeToggle from "@/components/theme/ThemeToggle";
import BackendStatusPill from "@/components/site/BackendStatusPill";

const NavItems = ({ onNavigate }: { onNavigate?: () => void }) => (
  <nav className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
    <NavLink
      to="/"
      onClick={onNavigate}
      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      activeClassName="text-foreground"
    >
      Home
    </NavLink>
    <NavLink
      to="/deals"
      onClick={onNavigate}
      className="group text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      activeClassName="text-foreground"
    >
      <span className="flex flex-col gap-1">
        <span>Flash Deals</span>
        <span className="hidden items-center gap-2 text-[11px] text-muted-foreground md:flex">
          {([
            "Electronics",
            "Fashion",
            "Food",
            "Home",
            "Beauty",
          ] as const).map((c) => {
            const Icon = DEAL_CATEGORY_META[c].Icon;
            return (
              <span
                key={c}
                className="inline-flex items-center gap-1 rounded-full border bg-card px-2 py-0.5"
                aria-label={c}
              >
                <Icon className="h-3 w-3" />
                <span className="sr-only">{c}</span>
              </span>
            );
          })}
        </span>
      </span>
    </NavLink>
    <NavLink
      to="/about"
      onClick={onNavigate}
      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      activeClassName="text-foreground"
    >
      About
    </NavLink>
    <NavLink
      to="/contact"
      onClick={onNavigate}
      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      activeClassName="text-foreground"
    >
      Early Access
    </NavLink>
  </nav>
);

export default function SiteHeader() {
  const settings = useSiteSettings();
  const { user, signOut } = useAuth();
  const isAdmin = useIsAdmin();

  const phone = settings.data?.whatsapp_phone_e164 ?? SOLD_BD.whatsapp.phoneE164;
  const defaultMsg = settings.data?.whatsapp_default_message ?? SOLD_BD.whatsapp.defaultMessage;
  const whatsappHref = whatsappOrderLink(phone, defaultMsg);

  const brandName = settings.data?.brand_name ?? SOLD_BD.brand.name;
  const kicker = settings.data?.brand_tagline ?? SOLD_BD.brand.tagline;
  const logoUrl = (settings.data?.content as any)?.logoUrl as string | undefined;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <NavLink to="/" className="group inline-flex items-center gap-2">
            {logoUrl ? (
              <span className="grid size-9 place-items-center overflow-hidden rounded-lg border bg-card shadow-sm">
                <img src={logoUrl} alt={`${brandName} logo`} className="h-full w-full object-cover" loading="lazy" />
              </span>
            ) : (
              <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <span className="text-sm font-black tracking-tight">S</span>
              </span>
            )}
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight">{brandName}</span>
              <span className="block text-xs text-muted-foreground">{kicker}</span>
            </span>
          </NavLink>
        </div>

        <div className="hidden md:block">
          <NavItems />
        </div>

        <div className="flex items-center gap-2">
          <BackendStatusPill className="hidden lg:inline-flex" />
          <ThemeToggle className="hidden sm:inline-flex" />

          {user ? (
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <a href={isAdmin.data ? "/admin" : "/admin/bootstrap"}>{isAdmin.data ? "Admin" : "Bootstrap Admin"}</a>
            </Button>
          ) : (
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <a href="/login">Log in</a>
            </Button>
          )}

          <Button asChild className="hidden sm:inline-flex">
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              Get Early Access
            </a>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Menu</div>
              </div>
              <div className="mt-6 flex h-full flex-col gap-4">
                <SheetClose asChild>
                  <div>
                    <NavItems onNavigate={() => undefined} />
                  </div>
                </SheetClose>

                <div className="mt-auto space-y-3">
                  <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                    <div className="text-sm font-medium">Theme</div>
                    <ThemeToggle />
                  </div>

                  {user ? (
                    <div className="grid gap-2">
                      <Button asChild variant="outline">
                        <a href={isAdmin.data ? "/admin" : "/admin/bootstrap"}>{isAdmin.data ? "Admin" : "Bootstrap Admin"}</a>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          await signOut();
                        }}
                      >
                        Log out
                      </Button>
                    </div>
                  ) : (
                    <Button asChild variant="outline">
                      <a href="/login">Log in</a>
                    </Button>
                  )}

                  <Button asChild>
                    <a href={whatsappHref} target="_blank" rel="noreferrer">
                      Get Early Access on WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
