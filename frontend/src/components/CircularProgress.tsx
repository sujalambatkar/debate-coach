"use client";

import { useEffect, useState } from "react";

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  color?: string;
}

function getStrengthLabel(value: number): { label: string; color: string } {
  if (value >= 8) return { label: "Strong", color: "#22c55e" };
  if (value >= 5) return { label: "Moderate", color: "#f59e0b" };
  return { label: "Weak", color: "#ef4444" };
}

export default function CircularProgress({
  value,
  max = 10,
  size = 140,
  strokeWidth = 12,
  label,
  color = "#7c3aed",
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (value / max) * circumference);
    }, 100);
    return () => clearTimeout(timer);
  }, [value, max, circumference]);

  const { label: strengthLabel, color: strengthColor } = getStrengthLabel(value);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#222222"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)",
            transform: `rotate(-90deg)`,
            transformOrigin: `${center}px ${center}px`,
          }}
        />
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          fill="white"
          fontSize="30"
          fontWeight="bold"
          fontFamily="Inter, sans-serif"
        >
          {value}
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          fill="#666"
          fontSize="12"
          fontFamily="Inter, sans-serif"
        >
          / {max}
        </text>
      </svg>
      {label !== undefined ? (
        <span className="text-sm font-semibold" style={{ color: strengthColor }}>
          {label}
        </span>
      ) : (
        <span className="text-sm font-semibold" style={{ color: strengthColor }}>
          {strengthLabel}
        </span>
      )}
    </div>
  );
}
