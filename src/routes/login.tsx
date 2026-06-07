import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HeartPulse, Stethoscope, Pill, User } from "lucide-react";
import { useApp, Role } from "@/lib/app-store";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const roleOptions: {
  key: Role;
  label: string;
  desc: string;
  icon: typeof User;
  to: string;
  email: string;
  password: string;
}[] = [
  {
    key: "patient",
    label: "Patient",
    desc: "Track your care journey and AI consultations.",
    icon: User,
    to: "/",
    email: "aiman@chat.com",
    password: "patient123",
  },
  {
    key: "mo",
    label: "Medical Officer",
    desc: "Review AI-prepared cases and prescribe treatment.",
    icon: Stethoscope,
    to: "/mo",
    email: "drmizan@chat.com",
    password: "doctor123",
  },
  {
    key: "pharmacist",
    label: "Pharmacist",
    desc: "Dispense verified prescriptions and counsel patients.",
    icon: Pill,
    to: "/pharmacy",
    email: "drmau@chat.com",
    password: "pharmacy123",
  },
];

function LoginPage() {
  const { setRole } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Role>("patient");
  const current = roleOptions.find((r) => r.key === selected)!;

  const submit = () => {
    setRole(selected);
    const dest = roleOptions.find((r) => r.key === selected)!.to;
    navigate({ to: dest });
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-gradient-to-br from-primary to-accent p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <img src="/sehat-logo.png" alt="SeHAT logo" className="h-12 w-12 rounded-xl bg-white object-contain p-1" />
          <div>
            <p className="font-semibold leading-tight">SeHAT</p>
            <p className="text-[11px] uppercase tracking-wide text-primary-foreground/75">
              Smart e-Health Automation &amp; Triage
            </p>
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-semibold leading-tight">
            One connected
            <br />
            patient journey.
          </h2>
          <p className="mt-4 max-w-md text-sm text-primary-foreground/80">
            From AI symptom triage to clinician verification and pharmacist
            dispensing — every checkpoint, in one place.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/70">
          © 2026 SeHAT Health Network
        </p>
      </aside>

      <div className="flex items-center justify-center px-5 py-10 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <HeartPulse className="h-5 w-5" />
            </div>
            <p className="font-semibold text-foreground">CareCompanion</p>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose your role to continue.
          </p>

          <div className="mt-6 space-y-3" data-tour="login-roles">
            {roleOptions.map((r) => {
              const Icon = r.icon;
              const active = selected === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => setSelected(r.key)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {r.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.desc}
                    </p>
                  </div>
                  <span
                    className={`mt-1 grid h-5 w-5 place-items-center rounded-full border-2 ${
                      active
                        ? "border-primary bg-primary"
                        : "border-border bg-card"
                    }`}
                  >
                    {active && (
                      <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-3" data-tour="login-email">
            <input
              key={`email-${selected}`}
              defaultValue={current.email}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="Email"
            />
            <input
              type="text"
              key={`pw-${selected}`}
              defaultValue={current.password}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="Password"
            />
          </div>

          <button
            onClick={submit}
            data-tour="login-submit"
            className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            Continue as {roleOptions.find((r) => r.key === selected)!.label}
          </button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Demo build · no credentials required
          </p>
        </div>
      </div>
    </div>
  );
}