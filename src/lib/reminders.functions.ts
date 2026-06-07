import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CAL_GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";
const RESEND_GATEWAY = "https://connector-gateway.lovable.dev/resend";
const TIMEZONE = "Asia/Kuala_Lumpur";

function gatewayHeaders(connectionKey: string) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  if (!connectionKey) throw new Error("Connector API key not configured");
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": connectionKey,
    "Content-Type": "application/json",
  };
}

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

function nextStartFor(hhmm: string): { startISO: string; endISO: string } {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  const start = new Date(now);
  start.setHours(h, m, 0, 0);
  if (start.getTime() <= now.getTime()) start.setDate(start.getDate() + 1);
  const end = new Date(start.getTime() + 15 * 60 * 1000);
  // Format as local time without Z so timeZone applies
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;
  return { startISO: fmt(start), endISO: fmt(end) };
}

export const syncMedicationToCalendar = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().min(1).max(120),
        dose: z.string().max(120).optional(),
        instructions: z.string().max(500).optional(),
        timesOfDay: z.array(z.string().regex(timeRegex)).min(1).max(8),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env.GOOGLE_CALENDAR_API_KEY;
    if (!key) throw new Error("Google Calendar connector not configured");
    const { startISO, endISO } = nextStartFor(data.timesOfDay[0]);
    const byHour = data.timesOfDay.map((t) => Number(t.split(":")[0])).join(",");
    const byMin = data.timesOfDay.map((t) => Number(t.split(":")[1])).join(",");
    const rrule =
      data.timesOfDay.length > 1
        ? `RRULE:FREQ=DAILY;BYHOUR=${byHour};BYMINUTE=${byMin}`
        : `RRULE:FREQ=DAILY`;
    const body = {
      summary: `💊 ${data.name}${data.dose ? ` (${data.dose})` : ""}`,
      description: `Medication reminder from SeHAT\n\nDose: ${data.dose ?? "—"}\nTimes: ${data.timesOfDay.join(", ")}${data.instructions ? `\n\nInstructions: ${data.instructions}` : ""}`,
      start: { dateTime: startISO, timeZone: TIMEZONE },
      end: { dateTime: endISO, timeZone: TIMEZONE },
      recurrence: [rrule],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 0 },
          { method: "email", minutes: 10 },
        ],
      },
    };
    const res = await fetch(`${CAL_GATEWAY}/calendars/primary/events`, {
      method: "POST",
      headers: gatewayHeaders(key),
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        `Calendar API error [${res.status}]: ${JSON.stringify(json).slice(0, 300)}`,
      );
    }
    return {
      eventId: json.id as string,
      htmlLink: json.htmlLink as string | undefined,
    };
  });

export const sendMedicationReminderEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        to: z.string().email(),
        name: z.string().min(1).max(120),
        dose: z.string().max(120).optional(),
        time: z.string().regex(timeRegex),
        patientName: z.string().max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("Resend connector not configured");
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#ffffff;color:#111">
        <div style="background:#0d9488;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
          <h2 style="margin:0;font-size:20px">💊 Medication reminder</h2>
          <p style="margin:6px 0 0;opacity:.9">SeHAT</p>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px">
          <p style="margin:0 0 12px">Hi ${data.patientName ?? "there"},</p>
          <p style="margin:0 0 16px">It's time to take your medication:</p>
          <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:16px 18px;margin:0 0 16px">
            <div style="font-size:18px;font-weight:700;color:#0f766e">${data.name}${data.dose ? ` · ${data.dose}` : ""}</div>
            <div style="margin-top:4px;color:#475569">Scheduled for ${data.time}</div>
          </div>
          <p style="margin:0;color:#64748b;font-size:13px">You can manage your reminders any time in the SeHAT app.</p>
        </div>
      </div>`;
    const res = await fetch(`${RESEND_GATEWAY}/emails`, {
      method: "POST",
      headers: gatewayHeaders(key),
      body: JSON.stringify({
        from: "SeHAT <onboarding@resend.dev>",
        to: [data.to],
        subject: `💊 Time for your ${data.name}`,
        html,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        `Resend API error [${res.status}]: ${JSON.stringify(json).slice(0, 300)}`,
      );
    }
    return { id: json.id as string | undefined };
  });