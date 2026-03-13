interface FractionGridProps {
  total: number;
  shaded: number;
  cols: number;
  rows: number;
}

export function FractionGrid({ total, shaded, cols, rows }: FractionGridProps) {
  const cells = Array.from({ length: total }, (_, i) => i < shaded);

  return (
    <div
      className="inline-grid gap-1 p-2 bg-white border-2 border-[#1e3a5f] rounded-lg"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {cells.map((isShaded, i) => (
        <div
          key={i}
          className={`w-10 h-10 rounded border-2 transition-colors ${
            isShaded
              ? 'bg-[#3b82f6] border-[#2563eb]'
              : 'bg-gray-100 border-gray-300'
          }`}
        />
      ))}
    </div>
  );
}
