import { HeartPulse, AlertCircle, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { ClinicalReport } from "@/lib/app-store";

const severityBadge: Record<string, string> = {
  Urgent: "bg-danger/15 text-danger",
  Moderate: "bg-warning/25 text-foreground",
  Low: "bg-success/15 text-success",
};

const actionBadge: Record<string, string> = {
  "Consult Doctor": "bg-primary-soft text-primary",
  "Urgent Referral": "bg-danger/15 text-danger",
  "Self-Care": "bg-success/15 text-success",
};

export function ReportDocument({ report }: { report: ClinicalReport }) {
  const ts = new Date(report.generatedAt);
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm print:rounded-none print:shadow-none">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/sehat-logo.png" alt="SeHAT logo" className="h-12 w-12 rounded-xl bg-white object-contain p-0.5 ring-1 ring-border" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                SeHAT — Smart e-Health Automation &amp; Triage
              </p>
              <h2 className="text-base font-semibold text-foreground lg:text-lg">
                AI Clinical Summary Report
              </h2>
            </div>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Ref:</span>{" "}
              {report.ref}
            </p>
            <p>Generated {ts.toLocaleString()}</p>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-6 py-6">
        <Section title="Patient Demographics">
          <Grid>
            <Field label="Full Name" value={report.patient.name} />
            <Field label="IC Number" value={report.patient.ic} />
            <Field label="Date of Birth" value={report.patient.dob} />
            <Field label="Contact" value={report.patient.phone} />
          </Grid>
        </Section>

        <Section title="Chief Complaint">
          <p className="text-sm text-foreground">{report.chiefComplaint}</p>
        </Section>

        <Section title="Symptom Breakdown">
          <ul className="divide-y divide-border rounded-xl border border-border">
            {report.symptoms.map((s, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span className="font-medium text-foreground">{s.name}</span>
                <span className="text-xs text-muted-foreground">
                  Duration: {s.duration} · Severity: {s.severity}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="AI Preliminary Assessment">
          <p className="rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed text-foreground">
            {report.aiAssessment}
          </p>
        </Section>

        <Section title="Recommended Action">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${actionBadge[report.recommendedAction]}`}>
              {report.recommendedAction}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityBadge[report.aiSeverity]}`}>
              {report.aiSeverity} Severity
            </span>
            {report.esiLevel != null && (
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                ESI Level {report.esiLevel}
              </span>
            )}
          </div>
          {report.esiRationale && (
            <p className="mt-2 text-xs text-muted-foreground">ESI rationale: {report.esiRationale}</p>
          )}
        </Section>

        {report.qrToken && (
          <Section title="Clinic Check-In QR">
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="rounded-lg bg-white p-2">
                <QRCodeSVG
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/checkin/${report.qrToken}`}
                  size={120}
                  level="M"
                />
              </div>
              <div className="min-w-0 flex-1 text-xs text-muted-foreground">
                <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <QrCode className="h-3 w-3" /> Show this at the clinic
                </p>
                <p className="mt-1.5 text-foreground">
                  {report.checkedInAt
                    ? `Checked in at ${report.checkedInClinic} · ${new Date(report.checkedInAt).toLocaleString()}`
                    : "Reception will scan this QR to check you in — no manual queue ticket needed."}
                </p>
              </div>
            </div>
          </Section>
        )}

        {report.moReview && (
          <Section title="Medical Officer Verification">
            <Grid>
              <Field label="Reviewing MO" value={report.moReview.moName} />
              <Field
                label="Confirmed Diagnosis"
                value={report.moReview.diagnosis}
              />
              <Field
                label="Action Taken"
                value={report.moReview.actionTaken}
              />
              <Field
                label="Reviewed At"
                value={new Date(report.moReview.reviewedAt).toLocaleString()}
              />
            </Grid>
            {report.moReview.notes && (
              <p className="mt-3 rounded-xl bg-muted px-4 py-3 text-sm text-foreground">
                {report.moReview.notes}
              </p>
            )}
            {report.moReview.prescription.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Medication</th>
                      <th className="px-3 py-2 font-medium">Dosage</th>
                      <th className="px-3 py-2 font-medium">Frequency</th>
                      <th className="px-3 py-2 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {report.moReview.prescription.map((p) => (
                      <tr key={p.id}>
                        <td className="px-3 py-2 font-medium text-foreground">
                          {p.name}
                        </td>
                        <td className="px-3 py-2 text-foreground">{p.dosage}</td>
                        <td className="px-3 py-2 text-foreground">
                          {p.frequency}
                        </td>
                        <td className="px-3 py-2 text-foreground">
                          {p.duration}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        )}
      </div>

      <footer className="border-t border-dashed border-border bg-muted/50 px-6 py-4">
        <div className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            This document is AI-generated based on patient-reported symptoms and
            is pending clinician verification. It does not constitute a medical
            diagnosis. Refer to your attending Medical Officer for clinical
            decisions.
          </p>
        </div>
      </footer>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</dl>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}