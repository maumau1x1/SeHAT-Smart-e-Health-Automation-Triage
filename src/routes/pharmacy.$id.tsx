import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Pill, Loader2 } from "lucide-react";
import { PortalShell } from "@/components/PortalShell";
import { useApp } from "@/lib/app-store";
import { dispenseReport } from "@/lib/pharmacy.functions";

export const Route = createFileRoute("/pharmacy/$id")({
  component: PharmacyDetail,
});

const stockBadge: Record<string, string> = {
  "In Stock": "bg-success/15 text-success",
  "Low Stock": "bg-warning/25 text-foreground",
  "Out of Stock": "bg-danger/15 text-danger",
};

function PharmacyDetail() {
  const { id } = useParams({ from: "/pharmacy/$id" });
  const { reports, updateReport, setStepStatus } = useApp();
  const report = reports.find((r) => r.id === id);
  const [done, setDone] = useState(report?.status === "dispensed");
  const [submitting, setSubmitting] = useState(false);
  const dispenseFn = useServerFn(dispenseReport);

  if (!report) {
    return (
      <PortalShell title="Not found" back={{ to: "/pharmacy", label: "Back" }}>
        <p className="text-sm text-muted-foreground">Prescription not found.</p>
      </PortalShell>
    );
  }

  const meds = report.moReview?.prescription ?? [];

  const verify = async () => {
    if (submitting || meds.length === 0) return;
    setSubmitting(true);
    try {
      const { dispensedAt } = await dispenseFn({
        data: {
          reportId: report.id,
          pharmacistName: "Pharm. Lee Wai Yee",
          counsellingNotes: "",
        },
      });
      // Reflect locally so UI updates without a refetch
      updateReport(report.id, {
        status: "dispensed",
        dispensing: {
          pharmacistName: "Pharm. Lee Wai Yee",
          counsellingNotes: "",
          dispensedAt,
        },
      });
      setStepStatus("pharmacy", "completed");
      setDone(true);
    } catch (e) {
      console.error(e);
      alert("Failed to verify dispensing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <PortalShell title="Dispensing complete" back={{ to: "/pharmacy", label: "Back to queue" }}>
        <div className="mx-auto max-w-xl rounded-2xl border border-success/30 bg-success/10 p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success text-white">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Dispensing summary
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {meds.length} medication{meds.length === 1 ? "" : "s"} dispensed to{" "}
            <span className="font-medium text-foreground">{report.patient.name}</span>.
            This visit has been added to the patient's medical history.
          </p>
          <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left">
            {meds.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs"
              >
                <span className="font-medium text-foreground">{m.name}</span>
                <span className="text-muted-foreground">{m.dosage} · {m.duration}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/pharmacy"
            className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Back to queue
          </Link>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      title={report.patient.name}
      subtitle={`Ref ${report.ref} · Prescribed by ${report.moReview?.moName ?? "MO"}`}
      back={{ to: "/pharmacy", label: "Back to queue" }}
    >
      {/* MO verified summary */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">
          MO-Verified Diagnosis
        </h3>
        <p className="mt-1 text-sm text-foreground">
          {report.moReview?.diagnosis ?? "—"}
        </p>
        {report.moReview?.notes && (
          <p className="mt-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
            {report.moReview.notes}
          </p>
        )}
      </div>

      {/* Prescribed medications */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">
          Prescribed Medications
        </h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Review the prescription, then verify to dispense.
        </p>
        <ul className="mt-3 space-y-2">
          {meds.map((m) => (
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
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stockBadge[m.stock]}`}
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
          {meds.length === 0 && (
            <li className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
              No prescription items.
            </li>
          )}
        </ul>
      </div>

      <button
        onClick={verify}
        disabled={submitting || meds.length === 0}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" /> Verify & Dispense
          </>
        )}
      </button>
    </PortalShell>
  );
}