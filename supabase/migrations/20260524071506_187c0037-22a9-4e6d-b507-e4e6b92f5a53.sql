-- ESI triage scoring + QR check-in fields on clinical_reports
ALTER TABLE public.clinical_reports
  ADD COLUMN IF NOT EXISTS esi_level integer CHECK (esi_level BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS esi_rationale text,
  ADD COLUMN IF NOT EXISTS qr_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_in_clinic text;

-- Backfill qr_token for existing rows
UPDATE public.clinical_reports SET qr_token = encode(gen_random_bytes(16), 'hex') WHERE qr_token IS NULL;

-- Staff (MO + Pharmacist) need to view patient context for unified record
CREATE POLICY "Staff view all consultations"
  ON public.consultations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'medical_officer'::app_role) OR public.has_role(auth.uid(), 'pharmacist'::app_role));

CREATE POLICY "Staff view all medications"
  ON public.medications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'medical_officer'::app_role) OR public.has_role(auth.uid(), 'pharmacist'::app_role));

CREATE POLICY "Staff view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'medical_officer'::app_role) OR public.has_role(auth.uid(), 'pharmacist'::app_role));
