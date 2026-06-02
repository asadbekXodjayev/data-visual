"use client";

const ITEMS: { label: string; swatch: React.CSSProperties }[] = [
  { label: "Start", swatch: { background: "radial-gradient(circle at 50% 40%, #5BE8FF, #22D3EE)" } },
  { label: "End", swatch: { background: "radial-gradient(circle at 50% 40%, #FFD074, #FFB627)" } },
  { label: "Wall", swatch: { background: "rgba(255,255,255,0.18)" } },
  { label: "Visited", swatch: { background: "linear-gradient(135deg, #22D3EE, #7C3AED)" } },
  { label: "Path", swatch: { background: "#FFB627", boxShadow: "0 0 8px #FFB627" } },
];

export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-3 rounded-[3px] ring-1 ring-white/10"
            style={item.swatch}
          />
          <span className="text-[0.62rem] font-medium tracking-wide text-white/50 uppercase">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
