
DROP POLICY IF EXISTS "Reports are publicly insertable (demo)" ON public.clinical_reports;
DROP POLICY IF EXISTS "Reports are publicly readable (demo)" ON public.clinical_reports;
DROP POLICY IF EXISTS "Reports are publicly updatable (demo)" ON public.clinical_reports;

CREATE POLICY "Patients view own reports"
  ON public.clinical_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_user_id);

CREATE POLICY "Patients insert own reports"
  ON public.clinical_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_user_id);

CREATE POLICY "Staff view all reports"
  ON public.clinical_reports FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'medical_officer'::app_role)
    OR public.has_role(auth.uid(), 'pharmacist'::app_role)
  );

CREATE POLICY "Staff update all reports"
  ON public.clinical_reports FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'medical_officer'::app_role)
    OR public.has_role(auth.uid(), 'pharmacist'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'medical_officer'::app_role)
    OR public.has_role(auth.uid(), 'pharmacist'::app_role)
  );
