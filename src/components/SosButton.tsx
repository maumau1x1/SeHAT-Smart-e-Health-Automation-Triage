import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Siren, AlertTriangle } from "lucide-react";

export function SosButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Emergency SOS"
        data-tour="sos-button"
        className="fixed bottom-24 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-danger text-white shadow-lg shadow-danger/40 ring-4 ring-danger/20 transition active:scale-95 lg:bottom-8 lg:right-8 lg:h-16 lg:w-16"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-danger/40" />
        <Siren className="relative h-6 w-6" />
        <span className="relative sr-only">SOS</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-start justify-center bg-black/50 px-6 pt-[max(env(safe-area-inset-top),24px)] animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-danger/10">
              <AlertTriangle className="h-7 w-7 text-danger" />
            </div>
            <h3 className="mt-4 text-center text-lg font-semibold text-foreground">
              Trigger Emergency SOS?
            </h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              This will alert emergency services, share your live location, and
              start a video call with a responder.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-border bg-card py-3 text-sm font-medium text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/sos" });
                }}
                className="rounded-xl bg-danger py-3 text-sm font-semibold text-white"
              >
                Confirm SOS
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
