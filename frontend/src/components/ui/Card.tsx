export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
      {hint && <div className="mt-1.5 text-xs font-medium text-slate-400">{hint}</div>}
    </Card>
  );
}
