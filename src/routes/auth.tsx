import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HeartPulse, Mail, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import myDigitalIdLogo from "@/assets/mydigitalid-logo.jpg";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-gradient-to-br from-primary to-primary/80 p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
            <HeartPulse className="h-5 w-5" />
          </div>
          <p className="font-semibold">CareCompanion</p>
        </div>
        <div>
          <h2 className="text-4xl font-semibold leading-tight">
            Your medications,
            <br />reminded everywhere.
          </h2>
          <p className="mt-4 max-w-md text-sm text-primary-foreground/80">
            Get medication reminders in your inbox and on your Google Calendar —
            so you never miss a dose.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/70">© 2026 CareCompanion Health Network</p>
      </aside>

      <div className="flex items-center justify-center px-5 py-10 lg:p-12">
        <form onSubmit={submit} className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <img src="/sehat-logo.png" alt="SeHAT logo" className="h-11 w-11 rounded-xl bg-white object-contain p-0.5 ring-1 ring-border" />
            <div>
              <p className="font-semibold text-primary leading-tight">SeHAT</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Smart e-Health Automation &amp; Triage</p>
            </div>
          </div>

          <div className="inline-flex rounded-full border border-border bg-card p-0.5 text-xs">
            <button type="button" onClick={() => setMode("signin")}
              className={`rounded-full px-4 py-1.5 font-medium ${mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              Sign in
            </button>
            <button type="button" onClick={() => setMode("signup")}
              className={`rounded-full px-4 py-1.5 font-medium ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              Create account
            </button>
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
            {mode === "signin" ? "Welcome back" : "Get started"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to manage your care journey." : "Create an account to track medications and reminders."}
          </p>

          <div className="mt-6 space-y-3">
            {mode === "signup" && (
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Full name</span>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} required
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="Jane Doe" />
              </label>
            )}
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Email</span>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full rounded-xl border border-border bg-card py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
                  placeholder="you@email.com" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Password</span>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                  className="w-full rounded-xl border border-border bg-card py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
                  placeholder="At least 8 characters" />
              </div>
            </label>
          </div>

          {error && <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>}

          <button type="submit" disabled={loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>

          {mode === "signin" && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              <Link to="/forgot-password" className="font-medium text-primary hover:underline">Forgot password?</Link>
            </p>
          )}

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {mode === "signin" ? "or log masuk dengan" : "or daftar dengan"}
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={() => toast.info("MyDigital ID sign-in coming soon", { description: "Integration with the national digital identity is being set up." })}
            className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            <img
              src={myDigitalIdLogo}
              alt="MyDigital ID"
              className="h-5 w-auto"
              loading="lazy"
            />
            <span>{mode === "signin" ? "Sign in with MyDigital ID" : "Sign up with MyDigital ID"}</span>
          </button>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            Khas untuk kegunaan warganegara Malaysia
          </p>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Looking for the clinician demo?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Switch role</Link>
          </p>
        </form>
      </div>
    </div>
  );
}