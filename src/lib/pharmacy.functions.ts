import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const InputSchema = z.object({
  reportId: z.string().min(1).max(64),
  pharmacistName: z.string().min(1).max(120),
  counsellingNotes: z.string().max(2000).optional().default(""),
});

export const dispenseReport = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const dispensedAt = new Date().toISOString();

    // 1. Load report (need patient_user_id + prescription + diagnosis)
    const { data: report, error: loadErr } = await supabaseAdmin
      .from("clinical_reports")
      .select("*")
      .eq("id", data.reportId)
      .single();
    if (loadErr || !report) throw new Error("Report not found");

    const meds = ((report.mo_review as any)?.prescription ?? []) as Array<{
      name: string;
      dosage?: string;
    }>;
    const diagnosis = (report.mo_review as any)?.diagnosis ?? null;
    const clinic =
      report.forwarded_to_mo ?? (report.patient as any)?.clinic ?? "Clinic";

    // 2. Mark report dispensed
    const { error: updErr } = await supabaseAdmin
      .from("clinical_reports")
      .update({
        status: "dispensed",
        dispensing: {
          pharmacistName: data.pharmacistName,
          counsellingNotes: data.counsellingNotes ?? "",
          dispensedAt,
        },
      })
      .eq("id", data.reportId);
    if (updErr) throw new Error(updErr.message);

    // 3. Mirror into the patient's medical history if we know the user
    if (report.patient_user_id) {
      await supabaseAdmin.from("consultations").insert({
        user_id: report.patient_user_id,
        visit_date: dispensedAt.slice(0, 10),
        clinic,
        chief_complaint: report.chief_complaint,
        symptoms: ((report.symptoms as any) ?? []).map((s: any) =>
          typeof s === "string" ? s : s.name,
        ),
        severity:
          report.ai_severity === "Urgent"
            ? "Severe"
            : report.ai_severity === "Moderate"
              ? "Moderate"
              : "Mild",
        diagnosis,
        medications: meds.map((m) =>
          [m.name, m.dosage].filter(Boolean).join(" "),
        ),
        status: "Completed",
      });
    }

    return { ok: true, dispensedAt };
  });