import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon, MapPin, Stethoscope, Clock, Users } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { MobileShell } from "@/components/MobileShell";
import { useClinics } from "@/lib/use-clinics";
import { rankClinicsForSymptoms } from "@/lib/clinics-helpers";
import { aiChat } from "@/lib/ai.functions";
import {
  useApp,
  Consultation,
  ClinicalReport,
  AISeverity,
  RecommendedAction,
} from "@/lib/app-store";

export const Route = createFileRoute("/consultation")({
  component: ConsultationPage,
});

type Msg = { id: string; role: "ai" | "user"; text: string };

const MAX_TURNS = 5;
const SYSTEM_PROMPT = `You are an expert AI Clinical Intake Assistant for an AI Symptom Checker application. Your job is to conduct a safe, dynamic, and efficient medical history interview with a patient to gather context for a General Practitioner, and to produce an ESI (Emergency Severity Index) score.

### 1. LANGUAGE & GUARDRAILS
- You must ONLY communicate in Malay (Bahasa Malaysia) or English.
- Match the language the user starts with. If they switch languages, you may adapt. Do not use Indonesian terms.

### 2. INTERVIEW OBJECTIVE & STYLE
- Ask exactly ONE clear, concise question at a time.
- Dynamically follow up on onset/duration, severity (scale 1-10), precise location, and aggravating/alleviating factors or secondary symptoms.
- Be empathetic, professional, and reassuring.

### 3. CONVERSATION TERMINATION & ESI SCORING (CRITICAL)
You have a maximum budget of ${MAX_TURNS} patient turns, but stop earlier when the picture is clear.

When you have enough information, append a termination token AND an ESI block at the very end of your final response, EXACTLY in this format:

[TRIGGER_SUMMARY]
[ESI_JSON]{"level": <1-5>, "rationale": "<one short sentence>"}[/ESI_JSON]

ESI levels:
- 1 = Resuscitation (immediate life-threatening)
- 2 = Emergent (high risk, severe pain/distress, abnormal vitals)
- 3 = Urgent (needs multiple resources, stable)
- 4 = Less urgent (one resource expected)
- 5 = Non-urgent (no resources expected, self-care candidate)

### 4. SAFETY OVERRIDE (Red Flags)
If the user mentions any "Red Flag" symptoms (severe chest pain, difficulty breathing, signs of stroke, severe bleeding, suicidal thoughts), IMMEDIATELY stop the interview, advise emergency care, set ESI level 1 or 2, and trigger the summary.

Example final turn:
"Thank you. I've prepared a clinical summary for the doctor.
[TRIGGER_SUMMARY]
[ESI_JSON]{"level": 3, "rationale": "Persistent fever and cough, stable vitals, likely needs labs and one consultation."}[/ESI_JSON]"`;

function ConsultationPage() {
  const { patient, setStepStatus, addConsultation, setActiveConsultation, addReport } =
    useApp();
  const navigate = useNavigate();
  const { data: clinics = [] } = useClinics();
  const chatFn = useServerFn(aiChat);
  const [messages, setMessages] = useState<Msg[]>([
    { id: "m0", role: "ai", text: "Hi, I'm your AI health assistant. Please describe your main symptom." },
  ]);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [summaryReady, setSummaryReady] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [esi, setEsi] = useState<{ level: number; rationale: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [messages, summaryReady, thinking]);

  const send = async () => {
    if (!input.trim() || thinking) return;
    const userMsg: Msg = { id: `u${Date.now()}`, role: "user", text: input.trim() };
    const nextAnswers = [...answers, input.trim()];
    const nextMessages = [...messages, userMsg];
    setAnswers(nextAnswers);
    setInput("");
    setMessages(nextMessages);
    setThinking(true);

    try {
      const history = nextMessages.map((m) => ({
        role: m.role === "ai" ? ("assistant" as const) : ("user" as const),
        content: m.text,
      }));
      const { content } = await chatFn({
        data: {
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
        },
      });
      const hasTrigger = content.includes("[TRIGGER_SUMMARY]");
      const isReady = hasTrigger || nextAnswers.length >= MAX_TURNS;
      const esiMatch = content.match(/\[ESI_JSON\]([\s\S]*?)\[\/ESI_JSON\]/);
      if (esiMatch) {
        try {
          const parsed = JSON.parse(esiMatch[1].trim());
          if (parsed && typeof parsed.level === "number") {
            setEsi({ level: Math.min(5, Math.max(1, Math.round(parsed.level))), rationale: String(parsed.rationale ?? "") });
          }
        } catch {/* ignore malformed */}
      }
      const cleaned = content
        .replace(/\[TRIGGER_SUMMARY\]/g, "")
        .replace(/\[ESI_JSON\][\s\S]*?\[\/ESI_JSON\]/g, "")
        .trim();
      const reply =
        cleaned ||
        (isReady
          ? "Thank you. I've prepared a clinical summary below based on what you shared."
          : "Could you tell me a bit more?");
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: "ai", text: reply }]);
      if (isReady) setSummaryReady(true);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: `a${Date.now()}`,
          role: "ai",
          text: "Sorry, I'm having trouble reaching the AI service. Please try again.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const severity: "Mild" | "Moderate" | "Severe" = (() => {
    const n = parseInt(answers[2] ?? "5", 10);
    if (n >= 7) return "Severe";
    if (n >= 4) return "Moderate";
    return "Mild";
  })();

  const { specialty: suggestedSpecialty, results: suggestedClinics } = (() => {
    if (!summaryReady || clinics.length === 0) {
      return { specialty: "", results: [] as ReturnType<typeof rankClinicsForSymptoms>["results"] };
    }
    const { specialty, results } = rankClinicsForSymptoms(clinics, answers, { esiLevel: esi?.level });
    return { specialty, results: results.slice(0, 3) };
  })();

  const submit = (chosenClinic: string) => {
    if (!patient) return;
    const consultation: Consultation = {
      id: `v${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      clinic: chosenClinic,
      chiefComplaint: answers[0] ?? "Symptoms reported",
      symptoms: answers,
      severity,
      status: "Active",
    };
    addConsultation(consultation);
    setActiveConsultation(consultation);
    setStepStatus("registration", "completed");
    setStepStatus("assessment", "in-progress");

    const aiSeverity: AISeverity = esi
      ? esi.level <= 2 ? "Urgent" : esi.level === 3 ? "Moderate" : "Low"
      : severity === "Severe" ? "Urgent" : severity === "Moderate" ? "Moderate" : "Low";
    const recommendedAction: RecommendedAction =
      aiSeverity === "Urgent"
        ? "Urgent Referral"
        : aiSeverity === "Moderate"
          ? "Consult Doctor"
          : "Self-Care";
    const reportId = `r${Date.now()}`;
    const report: ClinicalReport = {
      id: reportId,
      ref: `AIR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      generatedAt: new Date().toISOString(),
      patient,
      chiefComplaint: answers[0] ?? "Symptoms reported",
      symptoms: [
        { name: answers[0] ?? "Primary symptom", duration: answers[1] ?? "—", severity: `${answers[2] ?? "—"}/10` },
        ...(answers[3] ? [{ name: `Location: ${answers[3]}`, duration: answers[1] ?? "—", severity: `${answers[2] ?? "—"}/10` }] : []),
        ...(answers[4] ? [{ name: `Associated: ${answers[4]}`, duration: "—", severity: "—" }] : []),
      ],
      aiAssessment: `Booked at ${chosenClinic}. Based on reported ${answers[0] ?? "symptoms"} of ${answers[1] ?? "recent onset"} with severity ${answers[2] ?? "moderate"}/10, the AI suggests ${recommendedAction.toLowerCase()}. Clinician verification is required to confirm diagnosis and management.${esi ? ` ESI level ${esi.level}: ${esi.rationale}` : ""}`,
      recommendedAction,
      aiSeverity,
      esiLevel: esi?.level ?? null,
      esiRationale: esi?.rationale ?? null,
      status: "submitted",
      forwardedToMO: "Dr. Tan Chee Keong",
      forwardedToPharmacist: "Pharm. Lee Wai Yee",
    };
    Promise.resolve(addReport(report)).then(() => {
      navigate({ to: "/report/$id", params: { id: report.id } });
    });
  };

  return (
    <MobileShell title="AI Symptom Checker" showTracker={false}>
      <div
        ref={scrollRef}
        className="-mx-5 max-h-[calc(100vh-22rem)] overflow-y-auto px-5"
      >
        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "ai" && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={
                  m.role === "ai"
                    ? "max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm text-foreground"
                    : "max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                }
              >
                {m.text}
              </div>
              {m.role === "user" && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                  <UserIcon className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {thinking && (
            <div className="flex gap-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                Thinking…
              </div>
            </div>
          )}

          {summaryReady && suggestedClinics.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  Recommended clinics
                </p>
                <span className="ml-auto rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  {suggestedSpecialty}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Matched to your symptoms and nearest to you.
              </p>
              {suggestedClinics.map(({ clinic, matchedDoctor }) => (
                <div
                  key={clinic.id}
                  className="rounded-2xl border border-border bg-card p-3.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {clinic.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {clinic.distance}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {clinic.wait} wait
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" /> #{clinic.queue}
                        </span>
                      </div>
                      {matchedDoctor ? (
                        <p className="mt-2 text-[11px] text-foreground">
                          <span className="font-semibold">{matchedDoctor.name}</span>{" "}
                          <span className="text-primary">· {matchedDoctor.specialty}</span>
                        </p>
                      ) : (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          General consultation available
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                      {matchedDoctor ? "Specialist" : "GP"}
                    </span>
                  </div>
                  <button
                    onClick={() => submit(clinic.name)}
                    className="mt-3 w-full rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground"
                  >
                    Book at this clinic
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!summaryReady && (
        <div className="fixed bottom-20 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-border bg-background px-5 py-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card pl-4 pr-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type your reply…"
              className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={send}
              className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
