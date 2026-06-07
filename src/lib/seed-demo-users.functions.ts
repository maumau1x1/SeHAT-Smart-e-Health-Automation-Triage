import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Role = "patient" | "medical_officer" | "pharmacist";

const DEMO_USERS: Array<{
  email: string;
  password: string;
  fullName: string;
  role: Role;
}> = [
  { email: "aiman@chat.com", password: "patient123", fullName: "Aiman (Patient Demo)", role: "patient" },
  { email: "drmizan@chat.com", password: "doctor123", fullName: "Dr. Mizan (Medical Officer Demo)", role: "medical_officer" },
  { email: "drmau@chat.com", password: "pharmacy123", fullName: "Dr. Mau (Pharmacist Demo)", role: "pharmacist" },
];

export const seedDemoUsers = createServerFn({ method: "POST" }).handler(async () => {
  const results: Array<{ email: string; created: boolean }> = [];

  const { data: existing, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) throw new Error(listErr.message);
  const byEmail = new Map<string, string>();
  for (const u of existing.users) {
    if (u.email) byEmail.set(u.email.toLowerCase(), u.id);
  }

  for (const demo of DEMO_USERS) {
    let userId = byEmail.get(demo.email.toLowerCase());
    let created = false;
    if (!userId) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: demo.email,
        password: demo.password,
        email_confirm: true,
        user_metadata: { full_name: demo.fullName },
      });
      if (error) {
        if (!String(error.message).toLowerCase().includes("already")) {
          throw new Error(`Failed to create ${demo.email}: ${error.message}`);
        }
      } else if (data.user) {
        userId = data.user.id;
        created = true;
      }
    } else {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: demo.password,
        email_confirm: true,
      });
    }

    if (!userId) continue;

    await supabaseAdmin
      .from("profiles")
      .upsert(
        { id: userId, email: demo.email, full_name: demo.fullName },
        { onConflict: "id" },
      );

    const { data: roleRows } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", demo.role)
      .limit(1);
    if (!roleRows || roleRows.length === 0) {
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: demo.role });
    }

    results.push({ email: demo.email, created });
  }

  return { ok: true, results };
});