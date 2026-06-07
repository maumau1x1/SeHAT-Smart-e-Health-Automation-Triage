import { useEffect, useLayoutEffect, useState, useCallback } from "react";
import { useRouterState } from "@tanstack/react-router";

type Step = {
  id: string;
  title: string;
  body: string;
  selector: string;
};

type Tour = {
  key: string;
  storageKey: string;
  match: (pathname: string) => boolean;
  steps: Step[];
};

const TOURS: Tour[] = [
  {
    key: "login",
    storageKey: "sehat_tour_login_v1",
    match: (p) => p === "/login" || p.startsWith("/login"),
    steps: [
      {
        id: "login-roles",
        title: "Pick your role",
        body: "Sign in as a Patient, Medical Officer, or Pharmacist — each role opens a tailored dashboard.",
        selector: '[data-tour="login-roles"]',
      },
      {
        id: "login-email",
        title: "Email & password",
        body: "Demo credentials are pre-filled for you. Replace them with your own account in production.",
        selector: '[data-tour="login-email"]',
      },
      {
        id: "login-submit",
        title: "Continue",
        body: "Tap here to sign in and enter your dashboard.",
        selector: '[data-tour="login-submit"]',
      },
    ],
  },
  {
    key: "home",
    storageKey: "sehat_tour_home_v1",
    match: (p) => p === "/",
    steps: [
      {
        id: "home-consult",
        title: "Start a Consultation",
        body: "Tap here to describe your symptoms — our AI matches you to the right clinician.",
        selector: '[data-tour="home-consult"]',
      },
      {
        id: "home-quick",
        title: "Quick actions",
        body: "Jump straight into clinics, the live heatmap, your visits, or medications.",
        selector: '[data-tour="home-quick"]',
      },
      {
        id: "home-sos",
        title: "Emergency SOS",
        body: "Tap the SOS button anytime to alert responders with live tracking.",
        selector: '[data-tour="sos-button"]',
      },
    ],
  },
  {
    key: "clinics",
    storageKey: "sehat_tour_clinics_v1",
    match: (p) => p === "/clinics" || p.startsWith("/clinics"),
    steps: [
      {
        id: "clinics-map",
        title: "Live clinic map",
        body: "See nearby clinics with real-time crowd levels and estimated wait times.",
        selector: '[data-tour="clinics-map"]',
      },
      {
        id: "clinics-list",
        title: "Swipe through clinics",
        body: "Browse clinic cards to view doctors, queue length, and book a slot.",
        selector: '[data-tour="clinics-list"]',
      },
    ],
  },
  {
    key: "visits",
    storageKey: "sehat_tour_visits_v1",
    match: (p) => p === "/visits" || p.startsWith("/visits"),
    steps: [
      {
        id: "visits-list",
        title: "Your medical timeline",
        body: "Every past visit, AI assessment, and clinician note — tap a card to expand.",
        selector: '[data-tour="visits-list"]',
      },
    ],
  },
  {
    key: "meds",
    storageKey: "sehat_tour_meds_v1",
    match: (p) => p === "/medications" || p.startsWith("/medications"),
    steps: [
      {
        id: "meds-days",
        title: "Daily schedule",
        body: "Pick a day to see what you need to take.",
        selector: '[data-tour="meds-days"]',
      },
      {
        id: "meds-list",
        title: "Your medications",
        body: "Toggle reminders and sync doses to Google Calendar so you never miss one.",
        selector: '[data-tour="meds-list"]',
      },
    ],
  },
  {
    key: "profile",
    storageKey: "sehat_tour_profile_v1",
    match: (p) => p === "/profile" || p.startsWith("/profile"),
    steps: [
      {
        id: "profile-card",
        title: "Your profile",
        body: "View and edit your personal details, IC, and contact info.",
        selector: '[data-tour="profile-card"]',
      },
      {
        id: "profile-settings",
        title: "Settings & sign out",
        body: "Manage notifications, privacy, and sign out from here.",
        selector: '[data-tour="profile-settings"]',
      },
    ],
  },
];


const PAD = 8;

function findVisible(selector: string): HTMLElement | null {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(selector),
  );
  for (const n of nodes) {
    const r = n.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return n;
  }
  return nodes[0] ?? null;
}

export function SpotlightTour() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tour = TOURS.find((t) => t.match(pathname));

  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [vw, setVw] = useState(0);

  // First-time check whenever the active tour changes
  useEffect(() => {
    if (typeof window === "undefined" || !tour) {
      setActive(false);
      return;
    }
    try {
      if (window.localStorage.getItem(tour.storageKey)) {
        setActive(false);
        return;
      }
    } catch {
      return;
    }
    setIndex(0);
    const t = window.setTimeout(() => setActive(true), 600);
    return () => window.clearTimeout(t);
  }, [tour]);

  const finish = useCallback(() => {
    if (!tour) return;
    try {
      window.localStorage.setItem(tour.storageKey, "1");
    } catch {}
    setActive(false);
  }, [tour]);

  const measure = useCallback(() => {
    if (!active || !tour) return;
    const step = tour.steps[index];
    if (!step) return;
    const el = findVisible(step.selector);
    setVw(window.innerWidth);
    if (el) {
      el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
      window.requestAnimationFrame(() => {
        setRect(el.getBoundingClientRect());
      });
    } else {
      setRect(null);
    }
  }, [active, index, tour]);

  useLayoutEffect(() => {
    if (!active) return;
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const interval = window.setInterval(measure, 400);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.clearInterval(interval);
    };
  }, [active, measure]);

  if (!active || !tour) return null;

  const step = tour.steps[index];
  const steps = tour.steps;
  const isLast = index === steps.length - 1;

  const box = rect
    ? {
        top: Math.max(rect.top - PAD, 0),
        left: Math.max(rect.left - PAD, 0),
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;

  const tooltipW = Math.min(320, vw - 32);
  let tooltipTop = 24;
  let tooltipLeft = (vw - tooltipW) / 2;
  if (box) {
    const above = box.top - 16 - 180;
    const below = box.top + box.height + 16;
    if (above >= 24) {
      tooltipTop = box.top - 16 - 8;
    } else {
      tooltipTop = below;
    }
    tooltipLeft = Math.min(
      Math.max(box.left + box.width / 2 - tooltipW / 2, 16),
      vw - tooltipW - 16,
    );
  }
  const tooltipAbove = box ? box.top - 16 - 180 >= 24 : false;

  return (
    <div
      className="fixed inset-0 z-[100] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`Onboarding step ${index + 1} of ${steps.length}`}
    >
      {box ? (
        <>
          <div
            className="absolute bg-foreground/70 backdrop-blur-[1px] transition-all duration-300"
            style={{ top: 0, left: 0, right: 0, height: box.top }}
          />
          <div
            className="absolute bg-foreground/70 backdrop-blur-[1px] transition-all duration-300"
            style={{ top: box.top, left: 0, width: box.left, height: box.height }}
          />
          <div
            className="absolute bg-foreground/70 backdrop-blur-[1px] transition-all duration-300"
            style={{
              top: box.top,
              left: box.left + box.width,
              right: 0,
              height: box.height,
            }}
          />
          <div
            className="absolute bg-foreground/70 backdrop-blur-[1px] transition-all duration-300"
            style={{ top: box.top + box.height, left: 0, right: 0, bottom: 0 }}
          />
          <div
            className="pointer-events-none absolute rounded-2xl ring-2 ring-primary transition-all duration-300"
            style={{
              top: box.top,
              left: box.left,
              width: box.width,
              height: box.height,
              boxShadow:
                "0 0 0 4px rgba(93,173,226,0.35), 0 0 40px 12px rgba(93,173,226,0.45)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-foreground/70 backdrop-blur-[1px]" />
      )}

      <div
        className="absolute animate-scale-in rounded-2xl border border-border bg-card p-5 shadow-2xl"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
          width: tooltipW,
          transform: tooltipAbove && box ? "translateY(-100%)" : undefined,
        }}
      >
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Step {index + 1} of {steps.length}
          </span>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === index ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
        <h3 className="mt-3 text-base font-semibold text-foreground">
          {step.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={finish}
            className="rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isLast) finish();
                else setIndex((i) => i + 1);
              }}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {isLast ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
