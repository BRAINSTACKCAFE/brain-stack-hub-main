import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Phone, Search, X, LayoutDashboard, Wallet as WalletIcon, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { business, telLink } from "@/config/business";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const nav: { to: string; label: string; params?: Record<string, string> }[] = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/category/$slug", label: "NIN / BVN", params: { slug: "nin-bvn" } },
  { to: "/category/$slug", label: "JAMB & Exams", params: { slug: "jamb-exams" } },
  { to: "/category/$slug", label: "NERD & NYSC", params: { slug: "nerd-nysc" } },
  { to: "/ict-training", label: "ICT Training" },
  { to: "/category/$slug", label: "Research", params: { slug: "research" } },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();

  const { data: walletBalance } = useQuery({
    queryKey: ["wallet-balance", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.balance ?? 0;
    },
    enabled: !!user,
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) return false;
      return data as boolean;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="bg-secondary text-foreground">
        <div className="bsc-container flex flex-wrap items-center justify-between gap-2 py-2">
          <p className="bsc-label opacity-80">{business.promise}</p>
          <a href={telLink} className="bsc-label inline-flex items-center gap-1.5 text-accent">
            <Phone className="size-3.5" aria-hidden />
            {business.phone}
          </a>
        </div>
      </div>

      <div className="bsc-container flex items-center justify-between gap-4 py-3.5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="bsc-gold grid size-9 place-items-center rounded font-display text-sm font-bold text-accent-foreground">
            BS
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-bold tracking-tight">
              BRAIN STACK
            </span>
            <span className="bsc-label block text-muted-foreground">Cafe</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex">
          {nav.slice(1, 9).map((item) => (
            <Link
              key={`${item.to}-${item.label}`}
              to={item.to}
              {...(item.params ? { params: item.params } : {})}
              className="border-b-2 border-transparent px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
              activeProps={{ className: "border-accent text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Link to="/services" aria-label="Search services">
              <Search className="size-4" />
            </Link>
          </Button>
          {!loading && isAuthenticated ? (
            <>
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link to="/wallet">
                  <WalletIcon className="mr-1.5 size-4" />
                  ₦{(walletBalance ?? 0).toLocaleString()}
                </Link>
              </Button>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to="/admin">
                    <ShieldCheck className="mr-1.5 size-4" />
                    Admin
                  </Link>
                </Button>
              )}
              <Button
                asChild
                size="default"
                className="bsc-gold hidden font-semibold text-accent-foreground shadow-sm transition-transform hover:scale-[1.03] sm:inline-flex"
              >
                <Link to="/dashboard">
                  <LayoutDashboard className="mr-1.5 size-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/services">Get Started</Link>
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="icon"
            className="xl:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-card xl:hidden">
          <nav className="bsc-container grid gap-1 py-3">
            {nav.map((item) => (
              <Link
                key={`${item.to}-${item.label}`}
                to={item.to}
                {...(item.params ? { params: item.params } : {})}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-secondary"
                activeProps={{ className: "bg-secondary" }}
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Button
                  asChild
                  size="lg"
                  className="bsc-gold mt-2 w-full font-semibold text-accent-foreground shadow-sm"
                >
                  <Link to="/dashboard" onClick={() => setOpen(false)}>
                    <LayoutDashboard className="mr-2 size-5" />
                    Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline" className="mt-2 w-full">
                  <Link to="/wallet" onClick={() => setOpen(false)}>
                    <WalletIcon className="mr-1.5 size-4" />
                    Wallet · ₦{(walletBalance ?? 0).toLocaleString()}
                  </Link>
                </Button>
                {isAdmin && (
                  <Button asChild variant="outline" className="mt-2 w-full">
                    <Link to="/admin" onClick={() => setOpen(false)}>
                      <ShieldCheck className="mr-1.5 size-4" />
                      Admin dashboard
                    </Link>
                  </Button>
                )}
                <Button className="mt-2 w-full" variant="outline" onClick={() => { setOpen(false); void handleSignOut(); }}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="mt-2 w-full">
                  <Link to="/auth" onClick={() => setOpen(false)}>
                    Sign in / Register
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link to="/track" onClick={() => setOpen(false)}>
                    Track a request
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}