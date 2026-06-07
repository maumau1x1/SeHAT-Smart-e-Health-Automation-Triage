import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { useApp } from "@/lib/app-store";
import { ChevronRight, FileHeart, Shield, Bell, LogOut, Edit3 } from "lucide-react";
import { signOut } from "@/lib/auth-hook";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { patient, consultations } = useApp();
  const navigate = useNavigate();
  if (!patient) return null;

  const initials = patient.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <MobileShell title="Profile">
      <div data-tour="profile-card" className="flex items-center gap-4 rounded-2xl border border-border bg-gradient-to-br from-card to-primary-soft p-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-foreground">{patient.name}</h2>
          <p className="text-xs text-muted-foreground">IC {patient.ic}</p>
          <p className="text-xs text-muted-foreground">{patient.phone}</p>
        </div>
        <Link
          to="/onboarding"
          className="grid h-9 w-9 place-items-center rounded-full bg-card text-primary"
        >
          <Edit3 className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Personal Details
        </h3>
        <dl className="mt-3 space-y-2 text-sm">
          <Field label="Date of birth" value={patient.dob} />
          <Field label="Phone" value={patient.phone} />
          <Field label="Emergency contact" value={patient.emergencyName} />
          <Field label="Emergency phone" value={patient.emergencyPhone} />
        </dl>
      </div>

      <Link
        to="/visits"
        className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <FileHeart className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Medical History</p>
          <p className="text-xs text-muted-foreground">
            {consultations.length} visits on record
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <ul data-tour="profile-settings" className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        <Item icon={Bell} label="Notifications" />
        <Item icon={Shield} label="Privacy & Security" />
        <Item
          icon={LogOut}
          label="Sign out"
          danger
          onClick={async () => {
            try {
              await signOut();
              toast.success("Signed out");
              navigate({ to: "/auth" });
            } catch (e: any) {
              toast.error(e?.message ?? "Failed to sign out");
            }
          }}
        />
      </ul>
    </MobileShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function Item({
  icon: Icon,
  label,
  danger,
  onClick,
}: {
  icon: typeof Bell;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <li>
      <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <Icon className={`h-4 w-4 ${danger ? "text-danger" : "text-primary"}`} />
        <span className={`flex-1 text-sm font-medium ${danger ? "text-danger" : "text-foreground"}`}>
          {label}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </li>
  );
}