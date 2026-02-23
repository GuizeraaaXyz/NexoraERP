import clsx from "clsx";

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      className={clsx("erp-button", variant, className)}
      {...props}
    />
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("erp-card", className)} {...props} />;
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        ) : null}
      </div>
      {children ? <div className="flex gap-2 flex-wrap">{children}</div> : null}
    </div>
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger" | "muted";
  children: React.ReactNode;
}) {
  return (
    <span className={clsx("erp-badge", `badge-${tone}`)}>{children}</span>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      {hint ? <div className="text-xs text-slate-400">{hint}</div> : null}
    </Card>
  );
}
