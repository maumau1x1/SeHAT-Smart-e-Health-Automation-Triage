// Hourly multiplier (0..1.4) — peaks around 10am and 7pm, low overnight.
export function hourMultiplier(hour: number): number {
  const morning = Math.exp(-Math.pow((hour - 10) / 2.5, 2));
  const evening = Math.exp(-Math.pow((hour - 19) / 2.5, 2));
  const base = 0.15;
  return base + 1.25 * Math.max(morning, evening);
}

export function adjustedQueue(baseQueue: number, hour: number): number {
  return Math.max(0, Math.round(baseQueue * hourMultiplier(hour)));
}

export type Crowd = "Low" | "Moderate" | "High";

export type Clinic = {
  id: string;
  name: string;
  distance: string;
  queue: number;
  wait: string;
  crowd: Crowd;
  bestTime: string;
  lat: number;
  lng: number;
};

export type Doctor = {
  name: string;
  specialty: string;
  availability: string;
  rating: number;
  experience: string;
};

export const SPECIALTIES = [
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
  "Neurology",
  "Endocrinology",
  "Gastroenterology",
  "Pulmonology",
  "Rheumatology",
];

const DOCTOR_NAMES = [
  "Dr. Aisyah Rahman", "Dr. Tan Wei Ming", "Dr. Arjun Subramaniam",
  "Dr. Nurul Izzati", "Dr. Lim Chee Keong", "Dr. Priya Devi",
  "Dr. Hafiz Zulkifli", "Dr. Chong Mei Ling", "Dr. Faridah Hassan",
  "Dr. Ravi Kumar", "Dr. Siti Aminah", "Dr. Goh Jia Hao",
];

export function doctorsForClinic(clinicId: string): Doctor[] {
  let seed = 0;
  for (let i = 0; i < clinicId.length; i++) seed = (seed * 31 + clinicId.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const count = 3 + Math.floor(rand() * 2);
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

// Map symptom keywords → recommended specialist.
const SPECIALTY_RULES: Array<{ keywords: string[]; specialty: string }> = [
  { keywords: ["chest pain", "palpitation", "shortness of breath", "heart"], specialty: "Cardiology" },
  { keywords: ["blood sugar", "thirst", "diabetes", "fatigue"], specialty: "Endocrinology" },
  { keywords: ["joint", "swelling", "stiffness", "arthritis"], specialty: "Rheumatology" },
  { keywords: ["headache", "dizzy", "dizziness", "memory", "migraine", "numb"], specialty: "Neurology" },
  { keywords: ["rash", "itch", "skin", "redness", "acne"], specialty: "Dermatology" },
  { keywords: ["cough", "wheez", "breathless", "asthma", "lung"], specialty: "Pulmonology" },
  { keywords: ["stomach", "nausea", "vomit", "diarrhea", "abdomen", "abdominal"], specialty: "Gastroenterology" },
  { keywords: ["eye", "vision", "blurred"], specialty: "Ophthalmology" },
  { keywords: ["ear", "hearing", "sore throat", "throat", "sinus"], specialty: "ENT Specialist" },
  { keywords: ["bone", "fracture", "back pain", "knee"], specialty: "Orthopedics" },
  { keywords: ["pregnan", "menstr", "period"], specialty: "Obstetrics & Gynaecology" },
  { keywords: ["child", "infant", "baby"], specialty: "Pediatrics" },
  { keywords: ["fever", "infection", "flu", "cold"], specialty: "General Practitioner" },
];

export function recommendSpecialty(symptoms: string[]): string {
  const blob = symptoms.join(" ").toLowerCase();
  for (const rule of SPECIALTY_RULES) {
    if (rule.keywords.some((k) => blob.includes(k))) return rule.specialty;
  }
  return "General Practitioner";
}

function parseDistanceKm(d: string): number {
  const m = d.match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : 999;
}

export function rankClinicsForSymptoms(
  clinics: Clinic[],
  symptoms: string[],
  opts?: { esiLevel?: number; nowHour?: number },
) {
  const specialty = recommendSpecialty(symptoms);
  const esi = opts?.esiLevel ?? 3;
  const hour = opts?.nowHour ?? new Date().getHours();
  const crowdWeight: Record<Crowd, number> = { Low: 0, Moderate: 1.5, High: 3 };
  const scored = clinics.map((c) => {
    const docs = doctorsForClinic(c.id);
    const match = docs.find((d) => d.specialty === specialty);
    const km = parseDistanceKm(c.distance);
    const liveQueue = adjustedQueue(c.queue, hour);
    // Lower score = better. Urgent cases (ESI 1-2) heavily penalize crowded
    // clinics; low-acuity cases (ESI 4-5) lean on proximity.
    const urgencyFactor = esi <= 2 ? 2.5 : esi === 3 ? 1.2 : 0.4;
    const score =
      km * 1.0 +
      crowdWeight[c.crowd] * urgencyFactor +
      liveQueue * 0.05 * urgencyFactor +
      (match ? -1.5 : 0);
    return { clinic: c, specialty, matchedDoctor: match ?? null, distanceKm: km, liveQueue, score };
  });
  scored.sort((a, b) => {
    if (!!a.matchedDoctor !== !!b.matchedDoctor) return a.matchedDoctor ? -1 : 1;
    return a.score - b.score;
  });
  return { specialty, results: scored };
}