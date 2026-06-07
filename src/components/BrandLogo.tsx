import logoUrl from "@/assets/sehat-logo.png";

type Variant = "mark" | "lockup" | "stacked";

export function BrandLogo({
  variant = "lockup",
  className = "",
  size = 36,
  tagline = false,
  invert = false,
}: {
  variant?: Variant;
  className?: string;
  size?: number;
  tagline?: boolean;
  invert?: boolean;
}) {
  const img = (
    <img
      src={logoUrl}
      alt="SeHAT logo"
      width={size}
      height={size}
      className="shrink-0 rounded-xl bg-white object-contain p-0.5 ring-1 ring-border"
      style={{ width: size, height: size }}
    />
  );

  if (variant === "mark") {
    return <span className={className}>{img}</span>;
  }

  const nameClasses = invert
    ? "text-sm font-semibold leading-tight text-primary-foreground"
    : "text-sm font-semibold leading-tight text-primary";
  const subClasses = invert
    ? "text-[10px] uppercase tracking-wide text-primary-foreground/70"
    : "text-[10px] uppercase tracking-wide text-muted-foreground";

  if (variant === "stacked") {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        {img}
        <div className="text-center">
          <p className={nameClasses}>SeHAT</p>
          {tagline && (
            <p className={subClasses}>Smart e-Health Automation &amp; Triage</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {img}
      <div className="min-w-0">
        <p className={nameClasses}>SeHAT</p>
        <p className={subClasses}>
          {tagline ? "Smart e-Health Automation & Triage" : "e-Health Automation"}
        </p>
      </div>
    </div>
  );
}
