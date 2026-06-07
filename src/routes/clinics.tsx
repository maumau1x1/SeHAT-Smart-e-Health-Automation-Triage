import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Navigation, Users, Clock, Stethoscope, X, Star } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useApp } from "@/lib/app-store";
import { ClinicsMap, type ClinicPoint } from "@/components/ClinicsMap";
import { useClinics } from "@/lib/use-clinics";
import type { Crowd } from "@/lib/clinics-helpers";
import clinicStock from "@/assets/clinic-stock.jpg";

export const Route = createFileRoute("/clinics")({
  component: ClinicsPage,
});

const crowdColor: Record<Crowd, string> = {
  Low: "bg-success/15 text-success",
  Moderate: "bg-warning/20 text-foreground",
  High: "bg-danger/15 text-danger",
};

type Doctor = {
  name: string;
  specialty: string;
  availability: string;
  rating: number;
  experience: string;
};

const SPECIALTIES = [
  "General Practitioner",
  "Family Medicine",
  "Internal Medicine",
  "Pediatrics",
  "Cardiology",
  "Dermatology",
  "Orthopedics",
  "ENT Specialist",
  "Obstetrics & Gynaecology",
  "Ophthalmology",
];

const DOCTOR_NAMES = [
  "Dr. Aisyah Rahman", "Dr. Tan Wei Ming", "Dr. Arjun Subramaniam",
  "Dr. Nurul Izzati", "Dr. Lim Chee Keong", "Dr. Priya Devi",
  "Dr. Hafiz Zulkifli", "Dr. Chong Mei Ling", "Dr. Faridah Hassan",
  "Dr. Ravi Kumar", "Dr. Siti Aminah", "Dr. Goh Jia Hao",
];

function doctorsForClinic(clinicId: string): Doctor[] {
  // Deterministic pseudo-random based on clinic id, so it stays stable per clinic
  let seed = 0;
  for (let i = 0; i < clinicId.length; i++) seed = (seed * 31 + clinicId.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const count = 3 + Math.floor(rand() * 2); // 3 or 4 doctors
  const used = new Set<number>();
  const usedSpec = new Set<number>();
  const list: Doctor[] = [];
  for (let i = 0; i < count; i++) {
    let ni = Math.floor(rand() * DOCTOR_NAMES.length);
    while (used.has(ni)) ni = (ni + 1) % DOCTOR_NAMES.length;
    used.add(ni);
    let si = Math.floor(rand() * SPECIALTIES.length);
    while (usedSpec.has(si)) si = (si + 1) % SPECIALTIES.length;
    usedSpec.add(si);
    const avail = ["Available today", "Next slot 2:30 PM", "Next slot 4:00 PM", "Available tomorrow"][Math.floor(rand() * 4)];
    const rating = Math.round((4.3 + rand() * 0.6) * 10) / 10;
    const years = 5 + Math.floor(rand() * 20);
    list.push({
      name: DOCTOR_NAMES[ni],
      specialty: SPECIALTIES[si],
      availability: avail,
      rating,
      experience: `${years} yrs experience`,
    });
  }
  return list;
}

function ClinicsPage() {
  const { setStepStatus, activeConsultation } = useApp();
  const { data: clinics = [] } = useClinics();
  const [activeIdx, setActiveIdx] = useState(0);
  const [doctorsClinicId, setDoctorsClinicId] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const checkIn = () => {
    setStepStatus("assessment", "completed");
    setStepStatus("consultation", "in-progress");
    setTimeout(() => {
      setStepStatus("consultation", "completed");
      setStepStatus("pharmacy", "in-progress");
    }, 4000);
  };

  const mapPoints: ClinicPoint[] = clinics.map((c) => ({
    id: c.id,
    name: c.name,
    lat: c.lat,
    lng: c.lng,
    queue: c.queue,
    wait: c.wait,
    crowd: c.crowd,
    distance: c.distance,
    bestTime: c.bestTime,
  }));

  const active = clinics[activeIdx];

  const scrollToIdx = (idx: number) => {
    const clamped = Math.max(0, Math.min(clinics.length - 1, idx));
    setActiveIdx(clamped);
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.children[clamped] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 1;
    const gap = 12;
    const idx = Math.round(el.scrollLeft / (cardWidth + gap));
    if (idx !== activeIdx) setActiveIdx(idx);
  };

  const openDirections = (lat: number, lng: number) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank",
    );
  };

  const doctorsClinic = clinics.find((c) => c.id === doctorsClinicId) ?? null;
  const doctors = doctorsClinic ? doctorsForClinic(doctorsClinic.id) : [];

  return (
    <MobileShell title="Select Your Clinic" showTracker={false}>
      <div className="-mx-5 -mt-4 lg:-mx-10">
        <div data-tour="clinics-map" className="relative overflow-hidden rounded-none border-y border-border bg-card lg:mx-0 lg:rounded-2xl lg:border">
          <div className="relative h-[58vh] min-h-[400px] w-full">
            <ClinicsMap
              clinics={mapPoints}
              focusId={active?.id}
              onSelect={(id) => {
                const idx = clinics.findIndex((c) => c.id === id);
                if (idx >= 0) scrollToIdx(idx);
              }}
            />
            {active && (
              <div className="pointer-events-none absolute left-3 top-3 z-[400] inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-medium text-foreground shadow backdrop-blur">
                <Navigation className="h-3 w-3 text-primary" />
                {clinics.length} clinics nearby
              </div>
            )}
            <button
              onClick={() => scrollToIdx(activeIdx - 1)}
              disabled={activeIdx === 0}
              aria-label="Previous clinic"
              className="absolute left-2 top-1/2 z-[400] grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-foreground shadow backdrop-blur disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollToIdx(activeIdx + 1)}
              disabled={activeIdx >= clinics.length - 1}
              aria-label="Next clinic"
              className="absolute right-2 top-1/2 z-[400] grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-foreground shadow backdrop-blur disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Bottom card carousel */}
          <div className="relative z-[450] -mt-20 pb-4">
            <div
              ref={scrollerRef}
              onScroll={onScroll}
              data-tour="clinics-list"
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-5 pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {clinics.map((c, i) => (
                <article
                  key={c.id}
                  className={`snap-center shrink-0 basis-[88%] overflow-hidden rounded-2xl border bg-card shadow-lg transition sm:basis-[60%] lg:basis-[420px] ${
                    i === activeIdx ? "border-primary/50 ring-2 ring-primary/30" : "border-border"
                  }`}
                >
                  <div className="relative h-32 w-full overflow-hidden bg-muted">
                    <img
                      src={clinicStock}
                      alt={c.name}
                      loading="lazy"
                      width={1024}
                      height={640}
                      className="h-full w-full object-cover"
                    />
                    <span className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur ${crowdColor[c.crowd]}`}>
                      {c.crowd}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                      <p className="shrink-0 text-sm font-semibold text-primary">{c.distance}</p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium text-success">Open</span>
                        <span className="text-border">|</span>
                        <Clock className="h-3 w-3" /> {c.wait} wait
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" /> #{c.queue}
                      </span>
                      <button
                        onClick={() => openDirections(c.lat, c.lng)}
                        className="ml-auto text-[11px] font-medium text-foreground underline-offset-2 hover:underline"
                      >
                        Get Direction
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setDoctorsClinicId(c.id);
                      }}
                      className="mt-3 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
                    >
                      Select This Clinic
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-2 flex justify-center gap-1.5">
              {clinics.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIdx ? "w-5 bg-primary" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {doctorsClinic && (
        <div
          className="fixed inset-0 z-[600] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
          onClick={() => setDoctorsClinicId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Specialist doctors</p>
                <h2 className="mt-0.5 text-lg font-semibold text-foreground">{doctorsClinic.name}</h2>
                <p className="text-xs text-muted-foreground">{doctors.length} doctors available today</p>
              </div>
              <button
                onClick={() => setDoctorsClinicId(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 max-h-[55vh] space-y-2.5 overflow-y-auto pr-1">
              {doctors.map((d) => (
                <div key={d.name} className="rounded-2xl border border-border bg-background p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-sm font-semibold text-foreground">{d.name}</h3>
                        <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-foreground">
                          <Star className="h-3 w-3 fill-warning text-warning" /> {d.rating}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-primary">{d.specialty}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{d.experience}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                          <Clock className="h-2.5 w-2.5" /> {d.availability}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}