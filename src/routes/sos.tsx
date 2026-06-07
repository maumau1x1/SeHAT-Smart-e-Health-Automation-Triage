import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Siren, MapPin } from "lucide-react";

export const Route = createFileRoute("/sos")({
  component: SosPage,
});

function SosPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"alerting" | "connecting" | "live">("alerting");
  const [eta, setEta] = useState(8);
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("connecting"), 1800);
    const t2 = setTimeout(() => setPhase("live"), 4500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    const i = setInterval(() => setEta((e) => Math.max(1, e - 1)), 3000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="relative mx-auto min-h-screen max-w-md overflow-hidden bg-foreground text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(60,80,90,0.9),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(30,50,70,0.9),transparent_55%),linear-gradient(180deg,#0f172a,#020617)]" />

      <div className="relative flex min-h-screen flex-col p-5 pt-[max(env(safe-area-inset-top),20px)]">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-danger px-3 py-1.5 text-xs font-semibold">
            <Siren className="h-3.5 w-3.5" /> Emergency Active
          </div>
          <button
            onClick={() => navigate({ to: "/" })}
            className="rounded-full bg-white/10 px-3 py-1.5 text-xs"
          >
            Close
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/60">Ambulance ETA</p>
              <p className="text-2xl font-semibold">{eta} min</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-danger">
              <Siren className="h-5 w-5" />
            </div>
          </div>
          <div className="relative mt-3 h-24 overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 to-slate-800">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 80" preserveAspectRatio="none">
              <path
                d="M 10 60 Q 60 20 100 50 T 190 30"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 4"
              />
              <circle cx="10" cy="60" r="4" className="fill-emerald-400" />
              <circle cx="190" cy="30" r="5" className="fill-red-500 animate-pulse" />
            </svg>
            <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] backdrop-blur">
              <MapPin className="h-3 w-3 text-emerald-400" /> Your location
            </div>
          </div>
        </div>

        <div className="mt-4 flex-1">
          <div className="relative grid h-full place-items-center rounded-3xl border border-white/10 bg-black/30 backdrop-blur">
            {phase !== "live" ? (
              <div className="text-center">
                <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/10">
                  <span className="absolute inset-0 animate-ping rounded-full bg-white/20" />
                  <Phone className="h-8 w-8" />
                </div>
                <p className="mt-4 text-sm text-white/80">
                  {phase === "alerting"
                    ? "Alerting emergency services…"
                    : "Connecting to responder…"}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-3xl font-semibold">
                  R
                </div>
                <p className="mt-3 text-base font-semibold">Dr. Reza • Responder</p>
                <p className="text-xs text-white/70">Connected • 00:14</p>
              </div>
            )}

            <div className="absolute right-3 top-3 h-24 w-20 overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-slate-500 to-slate-700">
              {camOn ? (
                <div className="grid h-full place-items-center text-[10px] text-white/70">You</div>
              ) : (
                <div className="grid h-full place-items-center bg-black/60">
                  <VideoOff className="h-4 w-4 text-white/70" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 pb-[max(env(safe-area-inset-bottom),20px)]">
          <CallBtn onClick={() => setMuted(!muted)} active={!muted}>
            {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </CallBtn>
          <button
            onClick={() => navigate({ to: "/" })}
            className="grid h-16 w-16 place-items-center rounded-full bg-danger text-white shadow-lg"
            aria-label="End call"
          >
            <PhoneOff className="h-7 w-7" />
          </button>
          <CallBtn onClick={() => setCamOn(!camOn)} active={camOn}>
            {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </CallBtn>
        </div>
      </div>
    </div>
  );
}

function CallBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`grid h-12 w-12 place-items-center rounded-full ${active ? "bg-white/15 text-white" : "bg-white/40 text-foreground"}`}
    >
      {children}
    </button>
  );
}