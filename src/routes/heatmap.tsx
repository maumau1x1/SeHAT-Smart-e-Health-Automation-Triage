import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { Activity, Users, Clock } from "lucide-react";
import { ClinicsMap, type ClinicPoint } from "@/components/ClinicsMap";
import { hourMultiplier, adjustedQueue } from "@/lib/clinics-helpers";
import { useClinics } from "@/lib/use-clinics";

export const Route = createFileRoute("/heatmap")({
  component: HeatmapPage,
});

function HeatmapPage() {
  const [hour, setHour] = useState(new Date().getHours());
  const { data: clinics = [] } = useClinics();

  const mult = hourMultiplier(hour);
  const points: ClinicPoint[] = clinics.map((c) => {
    const q = adjustedQueue(c.queue, hour);
    const crowd: "Low" | "Moderate" | "High" =
      q >= 15 ? "High" : q >= 7 ? "Moderate" : "Low";
    return {
      id: c.id,
      name: c.name,
      lat: c.lat,
      lng: c.lng,
      queue: q,
      wait: `${Math.max(3, q * 3)} min`,
      crowd,
    };
  });
  const busiest = [...points].sort((a, b) => b.queue - a.queue).slice(0, 3);

  return (
    <MobileShell title="Crowd Heatmap">
      <p className="-mt-2 text-sm text-muted-foreground">
        Predicted clinic congestion across your area.
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative h-[55vh] min-h-80 w-full">
          <ClinicsMap clinics={points} intensityScale={mult} />
          <div className="pointer-events-none absolute left-3 top-3 z-[400] inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow backdrop-blur">
            <Activity className="h-3 w-3 text-primary" />
            {hour.toString().padStart(2, "0")}:00 forecast · {clinics.length} locations
          </div>
        </div>
        <div className="flex items-center justify-around border-t border-border bg-card p-3 text-xs">
          <Legend color="bg-success" label="Low" />
          <Legend color="bg-warning" label="Moderate" />
          <Legend color="bg-danger" label="High" />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Time of day</p>
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
            {hour.toString().padStart(2, "0")}:00
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={23}
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className="mt-3 w-full accent-[color:var(--primary)]"
        />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Busiest right now</p>
        <ul className="mt-3 space-y-2">
          {busiest.map((b) => (
            <li key={b.id} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">{b.name}</p>
                <p className="mt-0.5 inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />#{b.queue}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{b.wait}</span>
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                b.crowd === "High" ? "bg-danger/15 text-danger" : b.crowd === "Moderate" ? "bg-warning/20 text-foreground" : "bg-success/15 text-success"
              }`}>{b.crowd}</span>
            </li>
          ))}
        </ul>
      </div>
    </MobileShell>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-foreground">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}