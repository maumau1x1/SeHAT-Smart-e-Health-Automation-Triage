import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { MessageSquareHeart, Stethoscope, Activity, MapPin, Clock } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useApp } from "@/lib/app-store";
import { useAuth } from "@/lib/auth-hook";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { patient, steps } = useApp();
  const { user } = useAuth();
  const activeStep = steps.find((s) => s.status === "in-progress");

  const profileName = patient && patient.name && patient.name !== "Guest" ? patient.name : null;
  const metaName = (user?.user_metadata as { full_name?: string } | undefined)?.full_name;
  const emailName = user?.email?.split("@")[0];
  const displayName = (profileName ?? metaName ?? emailName ?? "there").split(" ")[0];

  return (
    <MobileShell title={`Hello, ${displayName}`}>
      <p className="-mt-2 text-sm text-muted-foreground">
        How are you feeling today?
      </p>

      <Link
        to="/consultation"
        data-tour="home-consult"
        className="mt-5 block overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-lg shadow-primary/20"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide">
              <Activity className="h-3 w-3" /> AI Powered
            </div>
            <h2 className="mt-3 text-2xl font-semibold leading-tight">
              Start
              <br />
              Consultation
            </h2>
            <p className="mt-2 text-sm text-primary-foreground/80">
              Tell our AI about your symptoms and get matched to a clinician.
            </p>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <MessageSquareHeart className="h-7 w-7" />
          </div>
        </div>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium">
          Tap to begin →
        </div>
      </Link>

      {activeStep && (
        <Link
          to="/clinics"
          className="mt-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary-soft p-4"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-primary">Active visit</p>
            <p className="text-sm font-semibold text-foreground">
              Currently: {activeStep.label}
            </p>
          </div>
          <span className="text-primary">→</span>
        </Link>
      )}

      <div data-tour="home-quick" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link
          to="/clinics"
          className="rounded-2xl border border-border bg-card p-4"
        >
          <MapPin className="h-5 w-5 text-primary" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            Find Clinic
          </p>
          <p className="text-xs text-muted-foreground">Nearby & live queue</p>
        </Link>
        <Link
          to="/heatmap"
          className="rounded-2xl border border-border bg-card p-4"
        >
          <Activity className="h-5 w-5 text-primary" />
          <p className="mt-3 text-sm font-semibold text-foreground">Heatmap</p>
          <p className="text-xs text-muted-foreground">Crowd forecast</p>
        </Link>
        <Link
          to="/visits"
          className="rounded-2xl border border-border bg-card p-4"
        >
          <Clock className="h-5 w-5 text-primary" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            My Visits
          </p>
          <p className="text-xs text-muted-foreground">Medical timeline</p>
        </Link>
        <Link
          to="/medications"
          className="rounded-2xl border border-border bg-card p-4"
        >
          <Stethoscope className="h-5 w-5 text-primary" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            Medications
          </p>
          <p className="text-xs text-muted-foreground">Reminders & doses</p>
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Daily wellness tip
        </p>
        <p className="mt-2 text-sm text-foreground">
          Drink at least 8 glasses of water today and take short standing breaks
          every hour.
        </p>
      </div>
    </MobileShell>
  );
}
