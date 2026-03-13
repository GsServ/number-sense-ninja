interface EstimationNumberLineProps {
  exact: number;
  low: number;
  high: number;
  studentAnswer: number;
}

export function EstimationNumberLine({ exact, low, high, studentAnswer }: EstimationNumberLineProps) {
  const inRange = studentAnswer >= low && studentAnswer <= high;
  const rangeWidth = high - low;
  const padding = rangeWidth * 0.5;
  const displayMin = Math.min(low - padding, studentAnswer - padding / 2);
  const displayMax = Math.max(high + padding, studentAnswer + padding / 2);
  const totalRange = displayMax - displayMin;

  const toPercent = (val: number) => ((val - displayMin) / totalRange) * 100;

  return (
    <div className="w-full max-w-sm mx-auto my-4">
      <div className="relative h-12 bg-gray-200 rounded-full overflow-hidden">
        {/* Green zone */}
        <div
          className="absolute h-full bg-[#22c55e]/30"
          style={{
            left: `${toPercent(low)}%`,
            width: `${toPercent(high) - toPercent(low)}%`,
          }}
        />

        {/* Exact answer marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-[#1e3a5f]"
          style={{ left: `${toPercent(exact)}%` }}
        >
          <div className="absolute -top-5 -translate-x-1/2 text-xs font-bold text-[#1e3a5f] whitespace-nowrap">
            {exact}
          </div>
        </div>

        {/* Student answer marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${Math.max(5, Math.min(95, toPercent(studentAnswer)))}%` }}
        >
          <div className={`w-6 h-6 rounded-full border-3 ${inRange ? 'bg-[#22c55e] border-[#16a34a]' : 'bg-[#ef4444] border-[#dc2626]'}`} />
          <div className={`absolute -bottom-6 -translate-x-1/3 text-xs font-bold whitespace-nowrap ${inRange ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
            {studentAnswer}
          </div>
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-400 mt-8 px-1">
        <span>{Math.round(low)}</span>
        <span className={`font-bold ${inRange ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
          {inRange ? '✅ In range!' : `❌ ${studentAnswer < low ? 'Too low' : 'Too high'}`}
        </span>
        <span>{Math.round(high)}</span>
      </div>
    </div>
  );
}
