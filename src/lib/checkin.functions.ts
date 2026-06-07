import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TokenSchema = z.object({ token: z.string().min(8).max(128).regex(/^[a-zA-Z0-9_-]+$/) });
const CheckInSchema = TokenSchema.extend({ clinic: z.string().min(1).max(200) });

export const lookupCheckIn = createServerFn({ method: "POST" })
  .inputValidator((input) => TokenSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("clinical_reports")
      .select("id, ref, patient, chief_complaint, ai_severity, esi_level, status, checked_in_at, checked_in_clinic, generated_at")
      .eq("qr_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { found: false as const };
    return {
      found: true as const,
      report: {
        id: row.id,
        ref: row.ref,
        patientName: (row.patient as any)?.name ?? "Patient",
        chiefComplaint: row.chief_complaint,
        aiSeverity: row.ai_severity,
        esiLevel: row.esi_level,
        status: row.status,
        checkedInAt: row.checked_in_at,
        checkedInClinic: row.checked_in_clinic,
        generatedAt: row.generated_at,
      },
    };
  });

export const confirmCheckIn = createServerFn({ method: "POST" })
  .inputValidator((input) => CheckInSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("clinical_reports")
      .update({ checked_in_at: new Date().toISOString(), checked_in_clinic: data.clinic })
      .eq("qr_token", data.token)
      .select("id, checked_in_at, checked_in_clinic")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Invalid check-in token");
    return { checkedInAt: row.checked_in_at, checkedInClinic: row.checked_in_clinic };
  });
