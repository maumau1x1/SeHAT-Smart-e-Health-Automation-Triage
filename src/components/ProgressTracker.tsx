import { Check, ClipboardList, Stethoscope, Pill, UserCheck } from "lucide-react";
import { useApp } from "@/lib/app-store";

const icons: Record<string, typeof Check> = {
  registration: UserCheck,
  assessment: ClipboardList,
  consultation: Stethoscope,
  pharmacy: Pill,
};

export function ProgressTracker() {
  const { steps } = useApp();
  const anyActive = steps.some((s) => s.status !== "pending");

  if (!anyActive) return null;

  return (
    <div className="border-y border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          const Icon = icons[s.key] ?? Check;
          const done = s.status === "completed";
          const active = s.status === "in-progress";
          return (
            <div key={s.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={[
                    "relative grid h-9 w-9 place-items-center rounded-full border-2 transition-colors",
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : active
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-card text-muted-foreground",
                  ].join(" ")}
                >
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  {active && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                  )}
                </div>
                <span
                  className={[
                    "text-[10px] font-medium leading-tight",
                    done || active ? "text-foreground" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={[
                    "mx-1 mb-4 h-0.5 flex-1 rounded",
                    done ? "bg-primary" : "bg-border",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
