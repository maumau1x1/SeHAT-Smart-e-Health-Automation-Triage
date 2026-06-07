# Move dummy data into Supabase

Right now all "data" lives in React state inside `src/lib/app-store.tsx` (patient, consultations, medications, clinical reports) and `src/lib/clinics-data.ts` (clinics). The `medications` / `profiles` / `med_reminders` Supabase tables exist but are not wired to the UI. This plan makes Supabase the single source of truth.

## New / updated tables

- `clinics` — id, name, distance, queue, wait, crowd, best_time, lat, lng. Public read, no writes from app.
- `consultations` — patient-scoped visit history (date, clinic, chief_complaint, symptoms[], severity, diagnosis, medications[], status). RLS: per `user_id`.
- `clinical_reports` — AI-generated reports with nested `patient` snapshot, `symptoms` (jsonb), `mo_review` (jsonb), `dispensing` (jsonb), and lifecycle `status`. Visible to: report owner, MOs, pharmacists (role-gated via a `user_roles` table).
- `user_roles` + `app_role` enum (`patient`, `mo`, `pharmacist`) + `has_role()` SECURITY DEFINER function — required so MO/pharmacist views can see all reports without recursive RLS.
- `medications` — already exists; UI will start using it instead of the local seed.
- `profiles` — already exists; the active "patient" profile reads from here.

All tables get RLS enabled and standard `updated_at` triggers.

## Seed data

Insert the existing seeds (clinics, sample consultations, three demo reports, three medications) so the app looks identical on first load.

## App wiring

- Replace the in-memory arrays in `src/lib/app-store.tsx` with React Query hooks that fetch from Supabase via thin `*.functions.ts` server functions (auth-gated for user data, admin/public for clinics).
- `medications` page: list / toggle / add now persist to the `medications` table.
- `consultation` flow: writes new rows to `consultations`.
- `mo` / `pharmacy` portals: read/update `clinical_reports`.
- `clinics` / `heatmap`: read the `clinics` table; keep the hour-multiplier helper local.
- Keep step progress + role selector in local state (UI-only).

## Auth requirement

CRUD on user-scoped tables requires a signed-in user. Auth (email/password + Google) is already wired from earlier; users land on `/auth` if not logged in.

## Out of scope

- Real-time queue updates for clinics (kept static-from-DB for now).
- Migrating the dummy `forwardedToMO` string into a real MO assignment table.

## Technical notes

```text
src/lib/
  app-store.tsx           -> thin context, just for role + steps
  data/
    clinics.functions.ts        (public read)
    consultations.functions.ts  (requireSupabaseAuth)
    medications.functions.ts    (requireSupabaseAuth)
    reports.functions.ts        (requireSupabaseAuth + role check)
```

Reads use `useQuery` + `queryOptions`; mutations use `useMutation` + `queryClient.invalidateQueries`. Server functions only — no direct admin client usage from components.
