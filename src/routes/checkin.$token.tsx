import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, ShieldCheck, AlertCircle, MapPin } from "lucide-react";
import { lookupCheckIn, confirmCheckIn } from "@/lib/checkin.functions";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/checkin/$token")({
  component: CheckInPage,
});

type ReportInfo = {
  id: string;
  ref: string;
  patientName: string;
  chiefComplaint: string;
  aiSeverity: string;
  esiLevel: number | null;
  status: string;
  checkedInAt: string | null;
  checkedInClinic: string | null;
  generatedAt: string;
};

const esiClass: Record<number, string> = {
  1: "bg-danger text-white",
  2: "bg-danger/20 text-danger",
  3: "bg-warning/25 text-foreground",
  4: "bg-success/15 text-success",
  5: "bg-success/15 text-success",
};

function CheckInPage() {
  const { token } = Route.useParams();
  const lookup = useServerFn(lookupCheckIn);
  const confirm = useServerFn(confirmCheckIn);
  const [report, setReport] = useState<ReportInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "done" | "notfound" | "error">("loading");
  const [clinic, setClinic] = useState("Klinik Kesihatan Bandar");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await lookup({ data: { token } });
        if (!res.found) return setStatus("notfound");
        setReport(res.report);
        if (res.report.checkedInAt) {
          setClinic(res.report.checkedInClinic ?? clinic);
          setStatus("done");
        } else {
          setStatus("ready");
        }
      } catch (e) {
        console.error(e);
        setStatus("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onConfirm = async () => {
    setBusy(true);
    try {
      const res = await confirm({ data: { token, clinic } });
      setReport((r) => (r ? { ...r, checkedInAt: res.checkedInAt, checkedInClinic: res.checkedInClinic } : r));
      setStatus("done");
    } catch (e) {
      console.error(e);
      setStatus("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background px-5 pb-10 pt-[max(env(safe-area-inset-top),24px)]">
      <BrandLogo variant="lockup" tagline />

      <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <ShieldCheck className="h-3.5 w-3.5" /> Clinic Check-In
        </div>

        {status === "loading" && (
          <p className="mt-4 text-sm text-muted-foreground">Verifying QR token…</p>
        )}

        {status === "notfound" && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 text-danger" />
            <p>This QR code is invalid or has expired. Please ask the patient to regenerate their report.</p>
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 text-danger" />
            <p>Something went wrong. Please try scanning again.</p>
          </div>
        )}

        {report && (status === "ready" || status === "done") && (
          <>
            <h2 className="mt-3 text-lg font-semibold text-foreground">{report.patientName}</h2>
            <p className="text-xs text-muted-foreground">Ref {report.ref}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {report.esiLevel != null && (
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${esiClass[report.esiLevel] ?? "bg-muted text-foreground"}`}>
                  ESI {report.esiLevel}
                </span>
              )}
              <span className="rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold text-primary">
                {report.aiSeverity}
              </span>
            </div>

            <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
              <span className="font-medium">Chief complaint:</span> {report.chiefComplaint}
            </p>

            {status === "ready" && (
              <div className="mt-5 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Check in at clinic
                  </span>
                  <input
                    value={clinic}
                    onChange={(e) => setClinic(e.target.value.slice(0, 200))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </label>
                <button
                  onClick={onConfirm}
                  disabled={busy || !clinic.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" /> {busy ? "Checking in…" : "Confirm check-in"}
                </button>
              </div>
            )}

            {status === "done" && report.checkedInAt && (
              <div className="mt-5 rounded-2xl border border-success/30 bg-success/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-success" /> Patient checked in
                </div>
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {report.checkedInClinic}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {new Date(report.checkedInAt).toLocaleString()}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  The MO queue has been updated. The patient can take a seat — no manual queue ticket required.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
