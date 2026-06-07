import { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, HeartPulse, Stethoscope, Pill } from "lucide-react";
import { useApp, Role } from "@/lib/app-store";
import { BrandLogo } from "./BrandLogo";

const roleMeta: Record<
  Role,
  { label: string; icon: typeof HeartPulse; home: string; tint: string }
> = {
  patient: {
    label: "Patient Portal",
    icon: HeartPulse,
    home: "/",
    tint: "bg-primary text-primary-foreground",
  },
  mo: {
    label: "Medical Officer Portal",
    icon: Stethoscope,
    home: "/mo",
    tint: "bg-primary text-primary-foreground",
  },
  pharmacist: {
    label: "Pharmacist Portal",
    icon: Pill,
    home: "/pharmacy",
    tint: "bg-primary text-primary-foreground",
  },
};

export function PortalShell({
  title,
  subtitle,
  children,
  back,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  back?: { to: string; label: string };
}) {
  const { role, setRole } = useApp();
  const meta = roleMeta[role];
  const Icon = meta.icon;
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const logout = () => {
    setRole("patient");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:border-r lg:border-border lg:bg-card lg:px-5 lg:py-6">
        <div className="flex items-center gap-3">
          <BrandLogo variant="mark" size={42} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">SeHAT</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {meta.label}
            </p>
          </div>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          <Link
            to={meta.home}
            className={`rounded-xl px-3 py-2.5 text-sm font-medium ${
              pathname === meta.home
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Dashboard
          </Link>
        </nav>
        <button
          onClick={logout}
          className="mt-auto inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          <LogOut className="h-4 w-4" /> Switch role
        </button>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-3 lg:px-10 lg:py-5">
            <div className="min-w-0">
              {back && (
                <Link
                  to={back.to}
                  className="mb-1 inline-flex items-center text-xs font-medium text-primary"
                >
                  ← {back.label}
                </Link>
              )}
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground lg:text-2xl">
                {title}
              </h1>
              {subtitle && (
                <p className="truncate text-xs text-muted-foreground lg:text-sm">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={logout}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground lg:hidden"
              aria-label="Switch role"
            >
              <LogOut className="h-3.5 w-3.5" /> Exit
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-5 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}