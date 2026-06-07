import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HeartPulse, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
        <HeartPulse className="h-5 w-5" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-foreground">Reset password</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        Enter your email and we'll send you a reset link.
      </p>
      {sent ? (
        <div className="mt-6 w-full rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-sm font-medium text-foreground">Check your inbox</p>
          <p className="mt-1 text-xs text-muted-foreground">
            If an account exists for {email}, a reset link is on the way.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 w-full space-y-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-card py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
              placeholder="you@email.com" />
          </div>
          {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>}
          <button type="submit" disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send reset link
          </button>
        </form>
      )}
      <Link to="/auth" className="mt-5 text-xs text-primary hover:underline">Back to sign in</Link>
    </div>
  );
}