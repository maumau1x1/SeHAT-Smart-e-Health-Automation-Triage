import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HeartPulse, ArrowRight, ArrowLeft } from "lucide-react";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { patient, setPatient } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: patient?.name ?? "",
    ic: patient?.ic ?? "",
    dob: patient?.dob ?? "",
    phone: patient?.phone ?? "",
    emergencyName: patient?.emergencyName ?? "",
    emergencyPhone: patient?.emergencyPhone ?? "",
  });

  const steps = [
    {
      title: "What's your name?",
      desc: "We'll use this on your medical records.",
      fields: [{ key: "name", label: "Full name", placeholder: "Jane Doe" }],
    },
    {
      title: "Identity & date of birth",
      desc: "Used for clinic registration.",
      fields: [
        { key: "ic", label: "IC number", placeholder: "920514-10-5678" },
        { key: "dob", label: "Date of birth", placeholder: "YYYY-MM-DD", type: "date" },
      ],
    },
    {
      title: "How can we reach you?",
      desc: "For appointment alerts and reminders.",
      fields: [{ key: "phone", label: "Phone number", placeholder: "+60 12-345 6789" }],
    },
    {
      title: "Emergency contact",
      desc: "Someone we can reach in an emergency.",
      fields: [
        { key: "emergencyName", label: "Contact name", placeholder: "Hassan Rahman" },
        { key: "emergencyPhone", label: "Contact phone", placeholder: "+60 13-987 6543" },
      ],
    },
  ];

  const current = steps[step];
  const canNext = current.fields.every((f) => (form as any)[f.key]?.trim?.());

  const finish = () => {
    setPatient(form);
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background px-6 pb-10 pt-[max(env(safe-area-inset-top),24px)]">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <HeartPulse className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold text-foreground">Helia Health</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Step {step + 1} of {steps.length}
        </span>
      </div>

      <div className="mt-5 flex gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      <div className="mt-8 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{current.title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{current.desc}</p>

        <div className="mt-6 space-y-4">
          {current.fields.map((f: any) => (
            <label key={f.key} className="block">
              <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
              <input
                type={f.type ?? "text"}
                value={(form as any)[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}
        <button
          disabled={!canNext}
          onClick={() => (step === steps.length - 1 ? finish() : setStep(step + 1))}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {step === steps.length - 1 ? "Finish" : "Continue"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}