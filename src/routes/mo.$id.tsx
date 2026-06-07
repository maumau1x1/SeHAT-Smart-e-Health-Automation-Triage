import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, CheckCircle2, RotateCcw, ArrowLeft } from "lucide-react";
import { PortalShell } from "@/components/PortalShell";
import { ReportDocument } from "@/components/ReportDocument";
import { useApp, PrescriptionItem } from "@/lib/app-store";

export const Route = createFileRoute("/mo/$id")({
  component: MOReviewPage,
});

const actionOptions = [
  "Prescribe Medication",
  "Refer to Specialist",
  "Discharge",
  "Further Tests Required",
];

function MOReviewPage() {
  const { id } = useParams({ from: "/mo/$id" });
  const { reports, updateReport } = useApp();
  const report = reports.find((r) => r.id === id);
  const navigate = useNavigate();

  const [diagnosis, setDiagnosis] = useState(report?.moReview?.diagnosis ?? "");
  const [notes, setNotes] = useState(report?.moReview?.notes ?? "");
  const [action, setAction] = useState(
    report?.moReview?.actionTaken ?? actionOptions[0],
  );
  const [items, setItems] = useState<PrescriptionItem[]>(
    report?.moReview?.prescription ?? [],
  );
  const [draft, setDraft] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
  });
  const [confirmed, setConfirmed] = useState(false);

  if (!report) {
    return (
      <PortalShell title="Case not found" back={{ to: "/mo", label: "Back to queue" }}>
        <p className="text-sm text-muted-foreground">This case is unavailable.</p>
      </PortalShell>
    );
  }

  const addItem = () => {
    if (!draft.name.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: `p${Date.now()}`,
        name: draft.name.trim(),
        dosage: draft.dosage.trim() || "—",
        frequency: draft.frequency.trim() || "—",
        duration: draft.duration.trim() || "—",
        stock: "In Stock",
      },
    ]);
    setDraft({ name: "", dosage: "", frequency: "", duration: "" });
  };

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((p) => p.id !== id));

  const verify = () => {
    updateReport(report.id, {
      status: "mo_reviewed",
      forwardedToPharmacist: "Pharm. Lee Wai Yee",
      moReview: {
        moName: "Dr. Tan Chee Keong",
        diagnosis: diagnosis || "Pending",
        notes,
        actionTaken: action,
        prescription: items,
        reviewedAt: new Date().toISOString(),
      },
    });
    setConfirmed(true);
  };

  const requestRevision = () => {
    updateReport(report.id, { status: "revision_requested" });
    navigate({ to: "/mo" });
  };

  if (confirmed) {
    return (
      <PortalShell title="Review complete" back={{ to: "/mo", label: "Back to queue" }}>
        <div className="mx-auto max-w-xl rounded-2xl border border-success/30 bg-success/10 p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success text-white">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Verified and forwarded
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The verified report and locked prescription have been sent to{" "}
            <span className="font-medium text-foreground">Pharm. Lee Wai Yee</span>{" "}
            for dispensing.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link
              to="/mo"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Back to queue
            </Link>
          </div>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      title={`Reviewing ${report.patient.name}`}
      subtitle={`Ref ${report.ref} · ${report.aiSeverity} severity`}
      back={{ to: "/mo", label: "Back to queue" }}
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <ReportDocument report={report} />

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">Review Panel</h3>
            <p className="text-xs text-muted-foreground">
              Complete clinician verification before forwarding.
            </p>

            <div className="mt-4 space-y-3">
              <Field label="Confirmed Diagnosis">
                <input
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute viral pharyngitis"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </Field>
              <Field label="Additional Notes">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Clinical notes, observations, follow-up plan…"
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </Field>
              <Field label="Action Taken">
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  {actionOptions.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">
              Prescription Builder
            </h3>
            <ul className="mt-3 space-y-2">
              {items.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start justify-between gap-2 rounded-xl border border-border bg-background p-3"
                >
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="text-sm font-semibold text-foreground">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-muted-foreground">
                      {p.dosage} · {p.frequency} · {p.duration}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(p.id)}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-danger"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {items.length === 0 && (
                <li className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                  No medications added yet.
                </li>
              )}
            </ul>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Medication"
                className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <input
                value={draft.dosage}
                onChange={(e) => setDraft({ ...draft, dosage: e.target.value })}
                placeholder="Dosage (e.g. 500mg)"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <input
                value={draft.frequency}
                onChange={(e) => setDraft({ ...draft, frequency: e.target.value })}
                placeholder="Frequency"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <input
                value={draft.duration}
                onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
                placeholder="Duration"
                className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={addItem}
                className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-soft py-2 text-xs font-semibold text-primary"
              >
                <Plus className="h-4 w-4" /> Add medication
              </button>
            </div>
          </div>

          <div className="sticky bottom-0 flex gap-2 rounded-2xl border border-border bg-background p-3">
            <button
              onClick={requestRevision}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground"
            >
              <RotateCcw className="h-4 w-4" /> Request Revision
            </button>
            <button
              onClick={verify}
              className="inline-flex flex-[1.4] items-center justify-center gap-1.5 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              <CheckCircle2 className="h-4 w-4" /> Verify & Forward to Pharmacy
            </button>
          </div>
        </div>
      </div>

      <Link
        to="/mo"
        className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground lg:hidden"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>
    </PortalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}