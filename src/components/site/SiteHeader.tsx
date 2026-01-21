import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";
import { SOLD_BD, whatsappOrderLink } from "@/config/soldbd";
import { Menu } from "lucide-react";

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
      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      activeClassName="text-foreground"
    >
      Flash Deals
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
  const whatsappHref = whatsappOrderLink(SOLD_BD.whatsapp.defaultMessage);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <NavLink to="/" className="group inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <span className="text-sm font-black tracking-tight">S</span>
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight">{SOLD_BD.brand.name}</span>
              <span className="block text-xs text-muted-foreground">Flash deals • Bangladesh</span>
            </span>
          </NavLink>
        </div>

        <div className="hidden md:block">
          <NavItems />
        </div>

        <div className="flex items-center gap-2">
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
              <div className="mt-6 flex flex-col gap-4">
                <SheetClose asChild>
                  <div>
                    <NavItems onNavigate={() => undefined} />
                  </div>
                </SheetClose>
                <Button asChild>
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    Get Early Access on WhatsApp
                  </a>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
