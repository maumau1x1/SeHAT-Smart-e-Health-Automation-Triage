import { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MapPin, ClipboardList, Pill, User } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { ProgressTracker } from "./ProgressTracker";
import { SosButton } from "./SosButton";

const tabs = [
  { to: "/", label: "Home", icon: Home, tour: "nav-home" },
  { to: "/clinics", label: "Clinics", icon: MapPin, tour: "nav-clinics" },
  { to: "/visits", label: "My Visits", icon: ClipboardList, tour: "nav-visits" },
  { to: "/medications", label: "Meds", icon: Pill, tour: "nav-meds" },
  { to: "/profile", label: "Profile", icon: User, tour: "nav-profile" },
] as const;

export function MobileShell({
  children,
  showTracker = true,
  showSos = true,
  title,
}: {
  children: ReactNode;
  showTracker?: boolean;
  showSos?: boolean;
  title?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-border lg:bg-card lg:px-5 lg:py-6 lg:sticky lg:top-0 lg:h-screen">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandLogo variant="lockup" size={40} tagline />
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active =
              t.to === "/" ? pathname === "/" : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                data-tour={t.tour}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <Link
            to="/login"
            className="block rounded-xl border border-border bg-background px-3 py-2.5 text-center text-xs font-semibold text-foreground hover:bg-muted"
          >
            Switch role / Sign in
          </Link>
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-medium text-foreground">Need urgent help?</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Tap the SOS button anytime to alert responders.
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:min-h-0">
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto w-full max-w-5xl px-5 pt-[max(env(safe-area-inset-top),16px)] pb-3 lg:px-10 lg:pt-8">
            <div className="flex items-center gap-2 lg:hidden">
              <BrandLogo variant="mark" size={32} />
              <p className="text-sm font-semibold text-primary">SeHAT</p>
            </div>
            {title && (
              <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground lg:mt-0 lg:text-3xl">
                {title}
              </h1>
            )}
          </div>
          {showTracker && (
            <div className="mx-auto w-full max-w-5xl lg:px-10">
              <ProgressTracker />
            </div>
          )}
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-32 pt-4 lg:px-10 lg:pb-10">
          {children}
        </main>

        {showSos && <SosButton />}

        {/* Mobile bottom tabs */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
          <ul className="mx-auto grid max-w-md grid-cols-5 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active =
                t.to === "/" ? pathname === "/" : pathname.startsWith(t.to);
              return (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    data-tour={t.tour}
                    className="flex flex-col items-center gap-1 py-1.5 text-[10px] font-medium"
                  >
                    <Icon
                      className={
                        active
                          ? "h-5 w-5 text-primary"
                          : "h-5 w-5 text-muted-foreground"
                      }
                    />
                    <span
                      className={active ? "text-primary" : "text-muted-foreground"}
                    >
                      {t.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
