import { useEffect, useRef } from "react";

export type ClinicPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  queue: number;
  wait: string;
  crowd: "Low" | "Moderate" | "High";
  distance?: string;
  bestTime?: string;
};

type Props = {
  clinics: ClinicPoint[];
  center?: [number, number];
  zoom?: number;
  onSelect?: (id: string) => void;
  intensityScale?: number;
  showMarkers?: boolean;
  focusId?: string;
};

const crowdHex: Record<ClinicPoint["crowd"], string> = {
  Low: "#22c55e",
  Moderate: "#f59e0b",
  High: "#ef4444",
};

export function ClinicsMap({ clinics, center = [3.139, 101.6869], zoom = 12, onSelect, intensityScale = 1, showMarkers = true, focusId }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!focusId || !mapRef.current) return;
    const c = clinics.find((x) => x.id === focusId);
    if (!c) return;
    mapRef.current.flyTo([c.lat, c.lng], 15, { duration: 0.8 });
    const m = markersRef.current[focusId];
    if (m) {
      // open popup once the flyTo animation settles
      setTimeout(() => m.openPopup(), 850);
    }
  }, [focusId, clinics]);

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.heat");
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: "&copy; OpenStreetMap &copy; CARTO",
          maxZoom: 19,
        },
      ).addTo(map);

      // Weight each point by its absolute patient queue, then normalize
      // against TOTAL crowd across all clinics — so a clinic's heat
      // intensity reflects its share of overall patient load, not just
      // its rank among clinics.
      const totalQueue = clinics.reduce((s, c) => s + c.queue, 0);
      const heatPoints = clinics.map(
        (c) => [c.lat, c.lng, c.queue * intensityScale] as [number, number, number],
      );
      // Scale spread with total crowd: more patients overall → wider, softer bloom.
      const crowdFactor = Math.min(1.6, 0.6 + totalQueue / 120);
      // @ts-expect-error plugin augments L
      const heat = L.heatLayer(heatPoints, {
        radius: Math.round(35 * crowdFactor),
        blur: Math.round(28 * crowdFactor),
        max: Math.max(totalQueue, 1),
        maxZoom: 17,
        minOpacity: 0.35,
        gradient: {
          0.2: "#22c55e",
          0.5: "#f59e0b",
          0.8: "#ef4444",
        },
      }).addTo(map);

      if (showMarkers) clinics.forEach((c) => {
        const icon = L.divIcon({
          className: "clinic-pin",
          html: `<div style="position:relative;width:28px;height:28px;">
              <span style="position:absolute;inset:0;border-radius:9999px;background:${crowdHex[c.crowd]};opacity:0.35;animation:pulse 2s infinite;"></span>
              <span style="position:absolute;inset:4px;border-radius:9999px;background:${crowdHex[c.crowd]};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:9px;font-weight:700;font-family:Inter,system-ui,sans-serif;">${c.queue}</span>
            </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const m = L.marker([c.lat, c.lng], { icon }).addTo(map);
        const crowdBg = `${crowdHex[c.crowd]}1f`;
        const crowdFg = crowdHex[c.crowd];
        m.bindPopup(
          `<div style="font-family:Inter,system-ui,sans-serif;width:240px;padding:4px 2px;">
            <div style="display:flex;gap:6px;margin-bottom:10px;">
              <span style="padding:4px 10px;border-radius:9999px;background:${crowdBg};color:${crowdFg};font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">${c.crowd} crowd</span>
              <span style="padding:4px 10px;border-radius:9999px;background:#0ea5e91f;color:#0ea5e9;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">Open</span>
            </div>
            <div style="font-weight:700;font-size:15px;color:#0f172a;line-height:1.2;">${c.name}</div>
            <div style="margin-top:6px;font-size:12px;color:#64748b;line-height:1.45;">${c.queue} patients in queue · approx ${c.wait} wait${c.bestTime ? ` · best time ${c.bestTime}` : ""}.</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;">
              <span style="color:#ef4444;font-weight:800;font-size:18px;">#${c.queue}</span>
              ${c.distance ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#f1f5f9;color:#0f172a;font-size:11px;font-weight:600;padding:4px 10px;border-radius:9999px;">📍 ${c.distance}</span>` : ""}
            </div>
          </div>`,
          { offset: [0, -6], closeButton: true, autoPan: true, className: "clinic-popup" },
        );
        markersRef.current[c.id] = m;
        if (onSelect) m.on("click", () => onSelect(c.id));
        m.on("mouseover", () => m.openPopup());
      });

      // Ensure map fits container after layout
      setTimeout(() => map.invalidateSize(), 50);

      cleanup = () => {
        map.removeLayer(heat);
        map.remove();
        mapRef.current = null;
        markersRef.current = {};
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinics]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ background: "#e8f0f2" }}
    />
  );
}