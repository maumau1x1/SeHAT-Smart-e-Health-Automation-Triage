import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Clock, User, CheckCircle2, Pill, Loader2 } from "lucide-react";
import { PortalShell } from "@/components/PortalShell";
import { useApp } from "@/lib/app-store";
import { dispenseReport } from "@/lib/pharmacy.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const stockBadge: Record<string, string> = {
  "In Stock": "bg-success/15 text-success",
  "Low Stock": "bg-warning/25 text-foreground",
  "Out of Stock": "bg-danger/15 text-danger",
};

export const Route = createFileRoute("/pharmacy")({
  component: PharmacyPage,
});

function PharmacyPage() {
  const { reports, updateReport, setStepStatus } = useApp();
  const [tab, setTab] = useState<"queue" | "dispensed">("queue");
  const [openId, setOpenId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const dispenseFn = useServerFn(dispenseReport);

  const queue = useMemo(
    () => reports.filter((r) => r.status === "mo_reviewed"),
    [reports],
  );
  const dispensed = useMemo(
    () => reports.filter((r) => r.status === "dispensed"),
    [reports],
  );

  const list = tab === "queue" ? queue : dispensed;
  const active = useMemo(
    () => reports.find((r) => r.id === openId) ?? null,
    [reports, openId],
  );
  const activeMeds = active?.moReview?.prescription ?? [];

  const verify = async () => {
    if (!active || submitting || activeMeds.length === 0) return;
    setSubmitting(true);
    try {
      const { dispensedAt } = await dispenseFn({
        data: {
          reportId: active.id,
          pharmacistName: "Pharm. Lee Wai Yee",
          counsellingNotes: "",
        },
      });
      updateReport(active.id, {
        status: "dispensed",
        dispensing: {
          pharmacistName: "Pharm. Lee Wai Yee",
          counsellingNotes: "",
          dispensedAt,
        },
      });
      setStepStatus("pharmacy", "completed");
      toast.success("Dispensed", {
        description: `Added ${activeMeds.length} medication${activeMeds.length === 1 ? "" : "s"} to ${active.patient.name}'s medical history.`,
      });
      setOpenId(null);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to verify dispensing", {
        description: e?.message?.slice(0, 200),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalShell
      title="Pharmacist Dashboard"
      subtitle={`${queue.length} to dispense · ${dispensed.length} dispensed today`}
    >
      <div className="inline-flex rounded-full border border-border bg-card p-0.5">
        <button
          onClick={() => setTab("queue")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
            tab === "queue" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Dispensing Queue ({queue.length})
        </button>
        <button
          onClick={() => setTab("dispensed")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
            tab === "dispensed" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Dispensed History ({dispensed.length})
        </button>
      </div>

      <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {list.map((r) => {
          const meds = r.moReview?.prescription ?? [];
          const summary = meds.map((m) => m.name).join(", ") || "—";
          const isDispensed = r.status === "dispensed";
          return (
            <li key={r.id}>
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {r.patient.name}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <User className="h-3 w-3" /> {r.patient.ic}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                    <Pill className="h-3 w-3" /> {meds.length} med
                    {meds.length === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-xs text-foreground">
                  <span className="font-medium">Rx:</span> {summary}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    MO:{" "}
                    <span className="font-medium text-foreground">
                      {r.moReview?.moName ?? "—"}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {r.moReview
                      ? new Date(r.moReview.reviewedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  {isDispensed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
                      <CheckCircle2 className="h-3 w-3" /> Dispensed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOpenId(r.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
                    >
                      Open
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
        {list.length === 0 && (
          <li className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nothing here yet.
          </li>
        )}
      </ul>

      <Dialog
        open={!!openId}
        onOpenChange={(o) => {
          if (!o && !submitting) setOpenId(null);
        }}
      >
        <DialogContent className="max-w-md">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.patient.name}</DialogTitle>
                <DialogDescription>
                  Ref {active.ref} · Prescribed by {active.moReview?.moName ?? "MO"}
                </DialogDescription>
              </DialogHeader>

              {active.moReview?.diagnosis && (
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    MO-Verified Diagnosis
                  </p>
                  <p className="mt-0.5 text-sm text-foreground">
                    {active.moReview.diagnosis}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-foreground">
                  Prescribed Medications
                </p>
                <ul className="mt-2 space-y-2">
                  {activeMeds.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-background p-3"
                    >
                      <Pill className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {m.name}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stockBadge[m.stock] ?? "bg-muted text-foreground"}`}
                          >
                            {m.stock}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {m.dosage} · {m.frequency} · {m.duration}
                        </p>
                      </div>
                    </li>
                  ))}
                  {activeMeds.length === 0 && (
                    <li className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                      No prescription items.
                    </li>
                  )}
                </ul>
              </div>

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  disabled={submitting}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={verify}
                  disabled={submitting || activeMeds.length === 0}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verify & Dispense
                    </>
                  )}
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
}