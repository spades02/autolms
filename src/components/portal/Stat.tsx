export default function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1 leading-tight">{value}</div>
      {hint ? (
        <div className="text-xs text-muted-foreground mt-1">{hint}</div>
      ) : null}
    </div>
  );
}
