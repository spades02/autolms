const BUCKET_LABELS = ["0–20", "20–40", "40–60", "60–80", "80–100"];

export default function HistogramBar({
  buckets,
  height = 80,
}: {
  buckets: number[];
  height?: number;
}) {
  const max = Math.max(1, ...buckets);
  return (
    <div className="grid grid-cols-5 gap-1 items-end" style={{ height }}>
      {buckets.map((count, idx) => {
        const pct = max === 0 ? 0 : (count / max) * 100;
        return (
          <div key={idx} className="flex flex-col items-center gap-1 h-full">
            <div className="flex-1 w-full flex items-end">
              <div
                className="w-full rounded-t bg-blue-500/70 dark:bg-blue-500/60 transition-all"
                style={{ height: `${pct}%`, minHeight: count > 0 ? 4 : 0 }}
                title={`${count} attempt${count === 1 ? "" : "s"}`}
              />
            </div>
            <div className="text-[10px] text-muted-foreground leading-none">
              {BUCKET_LABELS[idx]}
            </div>
            <div className="text-[10px] text-muted-foreground leading-none">
              {count}
            </div>
          </div>
        );
      })}
    </div>
  );
}
