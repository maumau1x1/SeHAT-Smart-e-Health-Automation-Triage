import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Clock, CalendarPlus, Loader2, CheckCircle2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { MobileShell } from "@/components/MobileShell";
import { useApp } from "@/lib/app-store";
import { syncMedicationToCalendar } from "@/lib/reminders.functions";
import { toast } from "sonner";
import googleCalendarIcon from "@/assets/google-calendar.svg";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/medications")({
  component: MedicationsPage,
});

function MedicationsPage() {
  const { medications, toggleMedication } = useApp();
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [busy, setBusy] = useState<Record<string, "cal" | null>>({});
  const [synced, setSynced] = useState<Record<string, boolean>>({});
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [dismissedSuggest, setDismissedSuggest] = useState(false);
  const syncCal = useServerFn(syncMedicationToCalendar);

  // Auto-open suggestion popup once meds are loaded
  useEffect(() => {
    if (!dismissedSuggest && medications.length >= 1) {
      setSuggestOpen(true);
    }
  }, [medications.length, dismissedSuggest]);

  const suggested = medications.slice(0, 2);

  const parseTimes = (med: { nextReminder: string; frequency: string }): string[] => {
    // Use nextReminder as the primary scheduled time; infer additional based on frequency.
    const base = med.nextReminder.match(/^\d{2}:\d{2}$/) ? med.nextReminder : "09:00";
    if (/6 hours/i.test(med.frequency)) {
      const [h] = base.split(":").map(Number);
      return [0, 6, 12, 18].map((o) => `${String((h + o) % 24).padStart(2, "0")}:00`);
    }
    if (/3x/i.test(med.frequency)) return ["08:00", "14:00", "20:00"];
    if (/2x/i.test(med.frequency)) return ["09:00", "21:00"];
    return [base];
  };

  const handleSync = async (m: typeof medications[number]) => {
    setBusy((b) => ({ ...b, [m.id]: "cal" }));
    try {
      const res = await syncCal({
        data: {
          name: m.name,
          dose: m.dosage,
          timesOfDay: parseTimes(m),
          instructions: m.frequency,
        },
      });
      setSynced((s) => ({ ...s, [m.id]: true }));
      toast.success("Added to Google Calendar", {
        description: res.htmlLink ? "Recurring reminder created" : undefined,
        action: res.htmlLink
          ? { label: "Open", onClick: () => window.open(res.htmlLink, "_blank") }
          : undefined,
      });
    } catch (e: any) {
      toast.error("Could not sync to Calendar", { description: e?.message?.slice(0, 200) });
    } finally {
      setBusy((b) => ({ ...b, [m.id]: null }));
    }
  };

  const handleSyncFromSuggest = async (m: typeof medications[number]) => {
    await handleSync(m);
  };

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i - 2);
    return d;
  });

  return (
    <MobileShell title="Medications">
      <Dialog
        open={suggestOpen}
        onOpenChange={(o) => {
          setSuggestOpen(o);
          if (!o) setDismissedSuggest(true);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-primary" />
              Add reminders to Google Calendar
            </DialogTitle>
            <DialogDescription>
              We picked {suggested.length} medication{suggested.length === 1 ? "" : "s"} you can
              sync to your calendar so you never miss a dose.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2">
            {suggested.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {m.name} {m.dosage}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.frequency} · Next {m.nextReminder}
                  </p>
                </div>
                <button
                  onClick={() => handleSyncFromSuggest(m)}
                  disabled={busy[m.id] === "cal" || synced[m.id]}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {busy[m.id] === "cal" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : synced[m.id] ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <CalendarPlus className="h-3.5 w-3.5" />
                  )}
                  {synced[m.id] ? "Added" : "Add"}
                </button>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <button
              onClick={() => {
                setSuggestOpen(false);
                setDismissedSuggest(true);
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              Maybe later
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="-mt-2 text-sm text-muted-foreground">
        {medications.filter((m) => m.enabled).length} active reminders
      </p>

      <div data-tour="meds-days" className="-mx-5 mt-4 overflow-x-auto px-5">
        <div className="flex gap-2">
          {days.map((d) => {
            const active = d.getDate() === selectedDay;
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelectedDay(d.getDate())}
                className={[
                  "flex w-14 shrink-0 flex-col items-center rounded-2xl border px-2 py-2.5",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground",
                ].join(" ")}
              >
                <span className={`text-[10px] font-medium ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {d.toLocaleDateString("en", { weekday: "short" })}
                </span>
                <span className="text-base font-semibold">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ul data-tour="meds-list" className="mt-5 space-y-3">
        {medications.map((m) => (
          <li key={m.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-1 items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                  <span className="text-base font-bold">{m.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {m.name} {m.dosage}
                  </h3>
                  <p className="text-xs text-muted-foreground">{m.frequency}</p>
                  <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                    <Clock className="h-3 w-3" /> Next: {m.nextReminder}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleMedication(m.id)}
                aria-label="Toggle reminder"
                className={[
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  m.enabled ? "bg-primary" : "bg-muted",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                    m.enabled ? "left-[1.375rem]" : "left-0.5",
                  ].join(" ")}
                />
              </button>
            </div>
            {m.enabled && (
              <>
                <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] text-success">
                  <Bell className="h-3 w-3" /> Push reminders on
                </p>
                <div className="mt-3">
                  <button
                    onClick={() => handleSync(m)}
                    disabled={busy[m.id] === "cal"}
                    aria-label="Add to Google Calendar"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
                  >
                    {busy[m.id] === "cal" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : synced[m.id] ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <img src={googleCalendarIcon} alt="" className="h-4 w-4" />
                    )}
                    {synced[m.id] ? "Synced" : "Add to Calendar"}
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </MobileShell>
  );
}