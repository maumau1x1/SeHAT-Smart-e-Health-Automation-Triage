import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Clock,
  User,
  ChevronRight,
  CheckCircle2,
  Eye,
  ShieldCheck,
  Activity,
  Stethoscope,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { PortalShell } from "@/components/PortalShell";
import { useApp, AISeverity, ClinicalReport } from "@/lib/app-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/mo")({
  component: MOPage,
});

const severityRank: Record<AISeverity, number> = {
  Urgent: 0,
  Moderate: 1,
  Low: 2,
};

const severityBadge: Record<AISeverity, string> = {
  Urgent: "bg-danger/15 text-danger",
  Moderate: "bg-warning/25 text-foreground",
  Low: "bg-success/15 text-success",
};

function MOPage() {
  const { reports, updateReport } = useApp();
  const [tab, setTab] = useState<"queue" | "completed">("queue");
  const [viewing, setViewing] = useState<ClinicalReport | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const verifyNow = async (r: ClinicalReport) => {
    setVerifyingId(r.id);
    try {
      await updateReport(r.id, {
        status: "mo_reviewed",
        forwardedToPharmacist: "Pharm. Lee Wai Yee",
        moReview: {
          moName: "Dr. Tan Chee Keong",
          diagnosis: r.aiAssessment?.split(".")[0] ?? "Pending clinician notes",
          notes: "Verified from triage queue. Detailed notes to follow.",
          actionTaken: "Prescribe Medication",
          prescription: r.moReview?.prescription ?? [],
          reviewedAt: new Date().toISOString(),
        },
      });
      if (viewing?.id === r.id) setViewing(null);
    } finally {
      setVerifyingId(null);
    }
  };


  const queue = useMemo(
    () =>
      reports
        .filter((r) => r.status === "submitted" || r.status === "revision_requested")
        .sort(
          (a, b) =>
            severityRank[a.aiSeverity] - severityRank[b.aiSeverity] ||
            a.generatedAt.localeCompare(b.generatedAt),
        ),
    [reports],
  );
  const completed = useMemo(
    () =>
      reports
        .filter((r) => r.status === "mo_reviewed" || r.status === "dispensed")
        .sort((a, b) =>
          (b.moReview?.reviewedAt ?? "").localeCompare(a.moReview?.reviewedAt ?? ""),
        ),
    [reports],
  );

  return (
    <PortalShell
      title="Medical Officer Dashboard"
      subtitle={`${queue.length} pending review · ${completed.length} completed today`}
    >
      <div className="inline-flex rounded-full border border-border bg-card p-0.5">
        <button
          onClick={() => setTab("queue")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
            tab === "queue" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Queue ({queue.length})
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
            tab === "completed" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Completed ({completed.length})
        </button>
      </div>

      <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {(tab === "queue" ? queue : completed).map((r) => (
          <li key={r.id}>
            <div className="block rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {r.patient.name}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <User className="h-3 w-3" /> {r.patient.ic}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${severityBadge[r.aiSeverity]}`}
                >
                  {r.aiSeverity}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-foreground">
                <span className="font-medium">Chief complaint:</span>{" "}
                {r.chiefComplaint}
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(r.generatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {tab === "completed" ? (
                  <span className="inline-flex items-center gap-1 text-success">
                    <CheckCircle2 className="h-3 w-3" />
                    Reviewed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 font-medium text-primary">
                    AI summary ready <ChevronRight className="h-3 w-3" />
                  </span>
                )}
              </div>
              {tab === "queue" ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setViewing(r)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  <Link
                    to="/mo/$id"
                    params={{ id: r.id }}
                    search={{ panel: "verify" } as never}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40"
                  >
                    <FileText className="h-3.5 w-3.5" /> Open
                  </Link>
                  <button
                    onClick={() => verifyNow(r)}
                    disabled={verifyingId === r.id}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {verifyingId === r.id ? "…" : "Verify"}
                  </button>
                </div>

              ) : (
                <div className="mt-3">
                  <button
                    onClick={() => setViewing(r)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/40"
                  >
                    <Eye className="h-3.5 w-3.5" /> View report
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
        {(tab === "queue" ? queue : completed).length === 0 && (
          <li className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No cases in this tab.
          </li>
        )}
      </ul>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      AI Clinical Summary
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      Ref {viewing.ref} ·{" "}
                      {new Date(viewing.generatedAt).toLocaleString()}
                    </DialogDescription>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${severityBadge[viewing.aiSeverity]}`}
                  >
                    {viewing.aiSeverity}
                  </span>
                </div>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <section className="rounded-xl border border-border bg-card p-3">
                  <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <User className="h-3 w-3" /> Patient
                  </p>
                  <p className="font-semibold text-foreground">
                    {viewing.patient.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    IC {viewing.patient.ic} · DOB {viewing.patient.dob} ·{" "}
                    {viewing.patient.phone}
                  </p>
                </section>

                <section>
                  <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Stethoscope className="h-3 w-3" /> Chief complaint
                  </p>
                  <p className="text-foreground">{viewing.chiefComplaint}</p>
                </section>

                <section>
                  <p className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Activity className="h-3 w-3" /> Reported symptoms
                  </p>
                  <ul className="space-y-1.5">
                    {viewing.symptoms.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
                      >
                        <span className="font-medium text-foreground">{s.name}</span>
                        <span className="text-muted-foreground">
                          {s.duration} · {s.severity}
                        </span>
                      </li>
                    ))}
                    {viewing.symptoms.length === 0 && (
                      <li className="text-xs text-muted-foreground">No symptoms recorded.</li>
                    )}
                  </ul>
                </section>

                <section className="rounded-xl border border-primary/30 bg-primary-soft/40 p-3">
                  <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    <AlertTriangle className="h-3 w-3" /> AI assessment
                  </p>
                  <p className="whitespace-pre-line text-foreground">
                    {viewing.aiAssessment}
                  </p>
                  <p className="mt-2 text-xs">
                    <span className="font-semibold text-foreground">Recommended action: </span>
                    <span className="text-foreground">{viewing.recommendedAction}</span>
                  </p>
                </section>
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <button
                  onClick={() => setViewing(null)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Close
                </button>
                <button
                  onClick={() => verifyNow(viewing)}
                  disabled={verifyingId === viewing.id}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {verifyingId === viewing.id ? "Verifying…" : "Verify & forward"}
                </button>

              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
}