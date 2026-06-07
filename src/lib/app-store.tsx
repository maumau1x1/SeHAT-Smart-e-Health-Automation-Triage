import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hook";

export type Patient = {
  name: string;
  ic: string;
  dob: string;
  phone: string;
  emergencyName: string;
  emergencyPhone: string;
};

export type StepStatus = "pending" | "in-progress" | "completed";
export type ProgressStep = {
  key: string;
  label: string;
  status: StepStatus;
};

export type Consultation = {
  id: string;
  date: string;
  clinic: string;
  chiefComplaint: string;
  symptoms: string[];
  severity: "Mild" | "Moderate" | "Severe";
  diagnosis?: string;
  medications?: string[];
  status: "Completed" | "Active";
};

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  nextReminder: string;
  enabled: boolean;
};

export type Role = "patient" | "mo" | "pharmacist";

export type AISeverity = "Urgent" | "Moderate" | "Low";
export type RecommendedAction =
  | "Consult Doctor"
  | "Urgent Referral"
  | "Self-Care";

export type SymptomEntry = {
  name: string;
  duration: string;
  severity: string;
};

export type PrescriptionItem = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  stock: "In Stock" | "Low Stock" | "Out of Stock";
  dispensed?: boolean;
};

export type ReportStatus =
  | "submitted"
  | "mo_reviewed"
  | "dispensed"
  | "revision_requested";

export type ClinicalReport = {
  id: string;
  dbId?: string;
  ref: string;
  generatedAt: string;
  patient: Patient;
  patientUserId?: string | null;
  chiefComplaint: string;
  symptoms: SymptomEntry[];
  aiAssessment: string;
  recommendedAction: RecommendedAction;
  aiSeverity: AISeverity;
  esiLevel?: number | null;
  esiRationale?: string | null;
  qrToken?: string | null;
  checkedInAt?: string | null;
  checkedInClinic?: string | null;
  status: ReportStatus;
  forwardedToMO?: string;
  forwardedToPharmacist?: string;
  moReview?: {
    moName: string;
    diagnosis: string;
    notes: string;
    actionTaken: string;
    prescription: PrescriptionItem[];
    reviewedAt: string;
  };
  dispensing?: {
    pharmacistName: string;
    counsellingNotes: string;
    dispensedAt: string;
  };
};

type AppState = {
  patient: Patient | null;
  setPatient: (p: Patient) => void;
  steps: ProgressStep[];
  setStepStatus: (key: string, status: StepStatus) => void;
  resetSteps: () => void;
  consultations: Consultation[];
  addConsultation: (c: Consultation) => Promise<void> | void;
  medications: Medication[];
  toggleMedication: (id: string) => Promise<void> | void;
  addMedication: (m: Medication) => Promise<void> | void;
  activeConsultation: Consultation | null;
  setActiveConsultation: (c: Consultation | null) => void;
  role: Role;
  setRole: (r: Role) => void;
  reports: ClinicalReport[];
  addReport: (r: ClinicalReport) => Promise<void> | void;
  updateReport: (id: string, patch: Partial<ClinicalReport>) => Promise<void> | void;
  loading: boolean;
};

const defaultSteps: ProgressStep[] = [
  { key: "registration", label: "Registration", status: "pending" },
  { key: "assessment", label: "Assessment", status: "pending" },
  { key: "consultation", label: "Consultation", status: "pending" },
  { key: "pharmacy", label: "Pharmacy", status: "pending" },
];

const AppCtx = createContext<AppState | null>(null);

const fallbackPatient: Patient = {
  name: "Guest",
  ic: "—",
  dob: "—",
  phone: "—",
  emergencyName: "—",
  emergencyPhone: "—",
};

type ReportRow = {
  id: string;
  ref: string;
  generated_at: string;
  patient: Patient;
  patient_user_id: string | null;
  chief_complaint: string;
  symptoms: ClinicalReport["symptoms"];
  ai_assessment: string;
  recommended_action: RecommendedAction;
  ai_severity: AISeverity;
  esi_level: number | null;
  esi_rationale: string | null;
  qr_token: string | null;
  checked_in_at: string | null;
  checked_in_clinic: string | null;
  status: ReportStatus;
  forwarded_to_mo: string | null;
  forwarded_to_pharmacist: string | null;
  mo_review: ClinicalReport["moReview"] | null;
  dispensing: ClinicalReport["dispensing"] | null;
};

function reportFromRow(r: ReportRow): ClinicalReport {
  return {
    id: r.id,
    dbId: r.id,
    ref: r.ref,
    generatedAt: r.generated_at,
    patient: r.patient,
    patientUserId: r.patient_user_id,
    chiefComplaint: r.chief_complaint,
    symptoms: r.symptoms ?? [],
    aiAssessment: r.ai_assessment,
    recommendedAction: r.recommended_action,
    aiSeverity: r.ai_severity,
    esiLevel: r.esi_level,
    esiRationale: r.esi_rationale,
    qrToken: r.qr_token,
    checkedInAt: r.checked_in_at,
    checkedInClinic: r.checked_in_clinic,
    status: r.status,
    forwardedToMO: r.forwarded_to_mo ?? undefined,
    forwardedToPharmacist: r.forwarded_to_pharmacist ?? undefined,
    moReview: r.mo_review ?? undefined,
    dispensing: r.dispensing ?? undefined,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [patient, setPatientState] = useState<Patient | null>(fallbackPatient);
  const [steps, setSteps] = useState<ProgressStep[]>(defaultSteps);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [reports, setReports] = useState<ClinicalReport[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);
  const [role, setRole] = useState<Role>("patient");
  const [loading, setLoading] = useState(true);

  // Profile (per-user)
  useEffect(() => {
    if (!user) {
      setPatientState(fallbackPatient);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setPatientState({
          name: data.full_name || user.email?.split("@")[0] || "Patient",
          ic: data.ic_number ?? "—",
          dob: data.dob ?? "—",
          phone: data.phone ?? "—",
          emergencyName: data.emergency_contact_name ?? "—",
          emergencyPhone: data.emergency_contact_phone ?? "—",
        });
      } else {
        setPatientState({
          name: user.email?.split("@")[0] ?? "Patient",
          ic: "—",
          dob: "—",
          phone: "—",
          emergencyName: "—",
          emergencyPhone: "—",
        });
      }
    })();
  }, [user]);

  // Consultations (per-user)
  useEffect(() => {
    if (!user) { setConsultations([]); return; }
    (async () => {
      const { data } = await supabase
        .from("consultations")
        .select("*")
        .order("visit_date", { ascending: false });
      let rows = data ?? [];
      // Seed 3 demo medical records for a fresh user so the
      // history / MO / pharmacy flows feel populated on day one.
      if (rows.length === 0) {
        const seed = [
          {
            user_id: user.id,
            visit_date: "2026-04-12",
            clinic: "Klinik Kesihatan Bandar",
            chief_complaint: "Persistent cough and fever for 4 days",
            symptoms: ["Cough", "Fever", "Fatigue"],
            severity: "Moderate",
            diagnosis: "Acute viral pharyngitis",
            medications: ["Paracetamol 500mg", "Dextromethorphan syrup"],
            status: "Completed",
          },
          {
            user_id: user.id,
            visit_date: "2026-02-03",
            clinic: "Klinik Mediviron",
            chief_complaint: "Migraine and light sensitivity",
            symptoms: ["Headache", "Nausea", "Light sensitivity"],
            severity: "Mild",
            diagnosis: "Tension-type migraine",
            medications: ["Ibuprofen 400mg"],
            status: "Completed",
          },
          {
            user_id: user.id,
            visit_date: "2025-11-21",
            clinic: "Hospital Selayang",
            chief_complaint: "Sprained right ankle from a fall",
            symptoms: ["Swelling", "Bruising", "Limited mobility"],
            severity: "Moderate",
            diagnosis: "Grade II lateral ankle sprain",
            medications: ["Naproxen 250mg", "Topical diclofenac"],
            status: "Completed",
          },
        ];
        const { data: inserted } = await supabase
          .from("consultations")
          .insert(seed)
          .select();
        rows = inserted ?? [];
      }
      setConsultations(
        rows.map((c: any) => ({
          id: c.id,
          date: c.visit_date,
          clinic: c.clinic,
          chiefComplaint: c.chief_complaint,
          symptoms: c.symptoms ?? [],
          severity: c.severity,
          diagnosis: c.diagnosis ?? undefined,
          medications: c.medications ?? undefined,
          status: c.status,
        })),
      );
    })();
  }, [user]);

  // Medications (per-user)
  useEffect(() => {
    if (!user) { setMedications([]); return; }
    (async () => {
      const { data } = await supabase
        .from("medications")
        .select("*")
        .order("created_at", { ascending: false });
      setMedications(
        (data ?? []).map((m: any) => ({
          id: m.id,
          name: m.name,
          dosage: m.dose ?? "",
          frequency: m.instructions ?? "",
          nextReminder: (m.times_of_day && m.times_of_day[0]) || "09:00",
          enabled: m.email_reminders ?? true,
        })),
      );
    })();
  }, [user]);

  // Clinical reports (shared / demo)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("clinical_reports")
        .select("*")
        .order("generated_at", { ascending: false });
      setReports((data ?? []).map((r) => reportFromRow(r as unknown as ReportRow)));
      setLoading(false);
    })();
  }, [user]);

  const setPatient = async (p: Patient) => {
    setPatientState(p);
    if (!user) return;
    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: p.name,
      ic_number: p.ic,
      dob: p.dob && p.dob !== "—" ? p.dob : null,
      phone: p.phone,
      emergency_contact_name: p.emergencyName,
      emergency_contact_phone: p.emergencyPhone,
    });
  };

  const setStepStatus = (key: string, status: StepStatus) => {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, status } : s)));
  };
  const resetSteps = () => setSteps(defaultSteps);

  const addConsultation = async (c: Consultation) => {
    setConsultations((prev) => [c, ...prev]);
    if (!user) return;
    await supabase.from("consultations").insert({
      user_id: user.id,
      visit_date: c.date,
      clinic: c.clinic,
      chief_complaint: c.chiefComplaint,
      symptoms: c.symptoms,
      severity: c.severity,
      diagnosis: c.diagnosis,
      medications: c.medications ?? [],
      status: c.status,
    });
  };

  const toggleMedication = async (id: string) => {
    const target = medications.find((m) => m.id === id);
    if (!target) return;
    const next = !target.enabled;
    setMedications((prev) => prev.map((m) => (m.id === id ? { ...m, enabled: next } : m)));
    if (!user) return;
    await supabase.from("medications").update({ email_reminders: next }).eq("id", id);
  };

  const addMedication = async (m: Medication) => {
    if (!user) {
      setMedications((prev) => [m, ...prev]);
      return;
    }
    const { data } = await supabase
      .from("medications")
      .insert({
        user_id: user.id,
        name: m.name,
        dose: m.dosage,
        instructions: m.frequency,
        times_of_day: [m.nextReminder],
        email_reminders: m.enabled,
      })
      .select()
      .single();
    if (data) {
      setMedications((prev) => [
        { ...m, id: data.id },
        ...prev,
      ]);
    }
  };

  const addReport = async (r: ClinicalReport) => {
    const qrToken =
      r.qrToken ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "")
        : Math.random().toString(36).slice(2) + Date.now().toString(36));
    const local: ClinicalReport = { ...r, qrToken };
    // Optimistically add so navigation to /report/<id> finds it immediately,
    // regardless of whether the DB insert succeeds (e.g. guest / RLS).
    setReports((prev) => [local, ...prev]);
    try {
      const { data } = await supabase
        .from("clinical_reports")
        .insert({
          ref: r.ref,
          generated_at: r.generatedAt,
          patient_user_id: user?.id ?? null,
          patient: r.patient as any,
          chief_complaint: r.chiefComplaint,
          symptoms: r.symptoms as any,
          ai_assessment: r.aiAssessment,
          recommended_action: r.recommendedAction,
          ai_severity: r.aiSeverity,
          esi_level: r.esiLevel ?? null,
          esi_rationale: r.esiRationale ?? null,
          qr_token: qrToken,
          status: r.status,
          forwarded_to_mo: r.forwardedToMO ?? null,
          forwarded_to_pharmacist: r.forwardedToPharmacist ?? null,
        })
        .select()
        .single();
      if (data) {
        const created = reportFromRow(data as unknown as ReportRow);
        // Replace the optimistic local row with the DB row, keeping the
        // original local id so any in-flight navigation still resolves,
        // but stash the real DB uuid in dbId for future updates.
        setReports((prev) =>
          prev.map((p) =>
            p.id === local.id ? { ...created, id: local.id, dbId: data.id } : p,
          ),
        );
      }
    } catch {
      // Keep optimistic row on failure.
    }
  };

  const updateReport = async (id: string, patch: Partial<ClinicalReport>) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const target = reports.find((r) => r.id === id);
    const dbId = target?.dbId ?? (id.match(/^[0-9a-f-]{36}$/i) ? id : null);
    const payload: any = {};
    if (patch.status !== undefined) payload.status = patch.status;
    if (patch.forwardedToMO !== undefined) payload.forwarded_to_mo = patch.forwardedToMO;
    if (patch.forwardedToPharmacist !== undefined)
      payload.forwarded_to_pharmacist = patch.forwardedToPharmacist;
    if (patch.moReview !== undefined) payload.mo_review = patch.moReview as any;
    if (patch.dispensing !== undefined) payload.dispensing = patch.dispensing as any;
    if (dbId && Object.keys(payload).length > 0) {
      await supabase.from("clinical_reports").update(payload).eq("id", dbId);
    }
  };

  const value = useMemo(
    () => ({
      patient,
      setPatient,
      steps,
      setStepStatus,
      resetSteps,
      consultations,
      addConsultation,
      medications,
      toggleMedication,
      addMedication,
      activeConsultation,
      setActiveConsultation,
      role,
      setRole,
      reports,
      addReport,
      updateReport,
      loading,
    }),
    [patient, steps, consultations, medications, reports, activeConsultation, role, loading, user],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
