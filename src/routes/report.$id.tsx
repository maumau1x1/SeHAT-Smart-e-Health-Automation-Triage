import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Send, CheckCircle2, FileText } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { ReportDocument } from "@/components/ReportDocument";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/report/$id")({
  component: ReportPage,
});

function ReportPage() {
  const { id } = useParams({ from: "/report/$id" });
  const { reports, updateReport, setStepStatus } = useApp();
  const report = reports.find((r) => r.id === id);
  const [sent, setSent] = useState(
    report?.status !== "submitted" && report?.status !== undefined,
  );

  if (!report) {
    return (
      <MobileShell title="Report not found" showTracker={false}>
        <p className="text-sm text-muted-foreground">
          This report no longer exists.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-primary">
          ← Back home
        </Link>
      </MobileShell>
    );
  }

  const onDownload = () => {
    if (typeof window !== "undefined") window.print();
  };
  const onSend = () => {
    updateReport(report.id, {
      forwardedToMO: report.forwardedToMO ?? "Dr. Tan Chee Keong",
      forwardedToPharmacist: "Pharm. Lee Wai Yee",
    });
    setStepStatus("assessment", "completed");
    setStepStatus("consultation", "in-progress");
    setSent(true);
  };

  return (
    <MobileShell title="AI Clinical Summary" showTracker>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        Document preview · {report.ref}
      </div>

      <div className="mt-3">
        <ReportDocument report={report} />
      </div>

      {sent ? (
        <div className="mt-5 rounded-2xl border border-success/30 bg-success/10 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <p className="text-sm font-semibold text-foreground">
              Document forwarded
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Sent to{" "}
            <span className="font-medium text-foreground">
              {report.forwardedToMO ?? "Dr. Tan Chee Keong"}
            </span>{" "}
            (Medical Officer) and{" "}
            <span className="font-medium text-foreground">
              {report.forwardedToPharmacist ?? "Pharm. Lee Wai Yee"}
            </span>{" "}
            (Pharmacist).
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={onDownload}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-xs font-semibold text-foreground"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>
            <Link
              to="/visits"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground"
            >
              View my visits
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={onDownload}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground"
          >
            <Download className="h-4 w-4" /> Download as PDF
          </button>
          <button
            onClick={onSend}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            <Send className="h-4 w-4" /> Send to Medical Officer
          </button>
        </div>
      )}
    </MobileShell>
  );
}