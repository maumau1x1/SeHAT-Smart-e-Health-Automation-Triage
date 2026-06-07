import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronUp, Stethoscope, Pill } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/visits")({
  component: VisitsPage,
});

function VisitsPage() {
  const { consultations } = useApp();
  const [open, setOpen] = useState<string | null>(consultations[0]?.id ?? null);

  return (
    <MobileShell title="Medical History">
      <p className="-mt-2 text-sm text-muted-foreground">
        {consultations.length} past visits on file
      </p>

      <ol data-tour="visits-list" className="relative mt-5 space-y-4 border-l-2 border-border pl-5">
        {consultations.map((v) => {
          const expanded = open === v.id;
          return (
            <li key={v.id} className="relative">
              <span className="absolute -left-[1.625rem] top-2 grid h-5 w-5 place-items-center rounded-full border-2 border-primary bg-card">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              <button
                onClick={() => setOpen(expanded ? null : v.id)}
                className="w-full rounded-2xl border border-border bg-card p-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <h3 className="mt-0.5 text-sm font-semibold text-foreground">
                      {v.clinic}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                      {v.chiefComplaint}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        v.status === "Completed"
                          ? "bg-success/15 text-success"
                          : "bg-primary-soft text-primary",
                      ].join(" ")}
                    >
                      {v.status}
                    </span>
                    {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {expanded && (
                  <div className="mt-4 space-y-3 border-t border-border pt-3 text-xs">
                    <Section title="AI Symptom Summary">
                      <ul className="list-inside list-disc space-y-0.5 text-foreground">
                        {v.symptoms.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </Section>
                    {v.diagnosis && (
                      <Section title="Doctor's Diagnosis" icon={<Stethoscope className="h-3.5 w-3.5" />}>
                        <p className="text-foreground">{v.diagnosis}</p>
                      </Section>
                    )}
                    {v.medications && (
                      <Section title="Medications Dispensed" icon={<Pill className="h-3.5 w-3.5" />}>
                        <ul className="space-y-1">
                          {v.medications.map((m, i) => (
                            <li key={i} className="rounded-md bg-muted px-2 py-1 text-foreground">
                              {m}
                            </li>
                          ))}
                        </ul>
                      </Section>
                    )}
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </MobileShell>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 inline-flex items-center gap-1 font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}