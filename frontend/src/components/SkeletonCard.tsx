"use client";

interface SkeletonCardProps {
  lines?: number;
  className?: string;
  height?: string;
}

export function SkeletonLine({ width = "w-full", delay = 0 }: { width?: string; delay?: number }) {
  return (
    <div
      className={`h-4 rounded ${width} bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] bg-[length:200%_100%] animate-shimmer`}
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

export default function SkeletonCard({ lines = 4, className = "", height }: SkeletonCardProps) {
  const widths = ["w-full", "w-5/6", "w-4/5", "w-2/3", "w-3/4", "w-full", "w-5/6"];

  return (
    <div
      className={`bg-[#111111] rounded-xl p-6 border border-[#222222] ${className}`}
      style={height ? { height } : undefined}
    >
      <div className="flex flex-col gap-3">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine key={i} width={widths[i % widths.length]} delay={i * 0.08} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonAnalyze() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="bg-[#111111] rounded-xl p-8 border border-[#222222] flex items-center gap-8">
        <div className="w-[140px] h-[140px] rounded-full bg-[#222222] animate-pulse shrink-0" />
        <div className="flex-1 space-y-3">
          <SkeletonLine width="w-2/3" />
          <SkeletonLine width="w-1/2" />
          <SkeletonLine width="w-3/4" />
          <SkeletonLine width="w-2/5" />
        </div>
      </div>
      {/* Three columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={6} />
      </div>
    </div>
  );
}
