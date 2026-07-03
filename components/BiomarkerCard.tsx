"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Info } from "lucide-react";

interface BiomarkerCardProps {
  name: string;
  category: string;
  rawValue: number;
  rawUnit: string;
  valG_L: number | null;
  valMmol_L: number | null;
  refMin: number | null;
  refMax: number | null;
  flag: "green" | "blue" | "yellow" | "orange" | "red";
  explanation?: string;
  historyValues?: number[]; // past values for sparkline
  changePct?: number; // percentage change compared to previous
}

export default function BiomarkerCard({
  name,
  category,
  rawValue,
  rawUnit,
  valG_L,
  valMmol_L,
  refMin,
  refMax,
  flag,
  explanation,
  historyValues = [],
  changePct,
}: BiomarkerCardProps) {
  const [displayUnit, setDisplayUnit] = useState<"default" | "alt">(
    valMmol_L && rawUnit !== "mmol/L" ? "default" : "default"
  );

  // Determine label and style based on flag
  let badgeText = "Optimal";
  let badgeStyle = "bg-[#E8F5E9] text-[#1b5e20]";
  let borderStyle = "border-[#E8F5E9]";

  if (flag === "blue") {
    badgeText = "Excellent";
    badgeStyle = "bg-blue-50 text-blue-800";
    borderStyle = "border-blue-100";
  } else if (flag === "yellow") {
    badgeText = "À surveiller";
    badgeStyle = "bg-[#FFF8E1] text-[#b57c1e]";
    borderStyle = "border-[#FFF8E1]";
  } else if (flag === "orange") {
    badgeText = "Hors plage";
    badgeStyle = "bg-[#FFEBEE] text-[#b71c1c]";
    borderStyle = "border-[#FFEBEE]";
  } else if (flag === "red") {
    badgeText = "Critique";
    badgeStyle = "bg-[#FFEBEE] text-red-900 border border-red-200 animate-pulse";
    borderStyle = "border-red-200";
  }

  // Unit and value formatting
  const showMmol = displayUnit === "alt" && valMmol_L !== null;
  const displayValue = showMmol ? valMmol_L : rawValue;
  const displayUnitText = showMmol ? "mmol/L" : rawUnit;
  const secondaryValue = !showMmol && valMmol_L ? `${valMmol_L} mmol/L` : null;

  // Render a tiny SVG sparkline path
  const renderSparkline = () => {
    if (historyValues.length < 2) return null;

    const width = 120;
    const height = 30;
    const padding = 2;

    const min = Math.min(...historyValues);
    const max = Math.max(...historyValues);
    const range = max - min === 0 ? 1 : max - min;

    const points = historyValues
      .map((val, idx) => {
        const x = padding + (idx / (historyValues.length - 1)) * (width - padding * 2);
        // Invert Y because SVG 0 is top
        const y = padding + (1 - (val - min) / range) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");

    // Stroke color matches the trend
    const isImproving = changePct !== undefined ? changePct < 0 : true; // default green for lower
    const sparkColor = flag === "green" || flag === "blue" ? "#3A7D44" : flag === "yellow" ? "#C17D11" : "#B23A3A";

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={sparkColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* Draw a tiny dot on the last point */}
        {historyValues.length > 0 && (
          <circle
            cx={padding + (width - padding * 2)}
            cy={padding + (1 - (historyValues[historyValues.length - 1] - min) / range) * (height - padding * 2)}
            r="3"
            fill={sparkColor}
          />
        )}
      </svg>
    );
  };

  // Horizontal range slider representation
  const renderRangeBar = () => {
    if (refMin === null || refMax === null) return null;
    
    // We normalize the raw value to a percentage position on the bar
    // Let's establish a window of [0.5 * refMin, 1.5 * refMax]
    const windowMin = refMin * 0.5;
    const windowMax = refMax * 1.5;
    const windowRange = windowMax - windowMin;
    
    const percentage = Math.max(0, Math.min(100, ((rawValue - windowMin) / windowRange) * 100));
    const refMinPct = ((refMin - windowMin) / windowRange) * 100;
    const refMaxPct = ((refMax - windowMin) / windowRange) * 100;

    const isOutOfRange = rawValue < refMin || rawValue > refMax;

    return (
      <div className="mt-4">
        {/* The line itself */}
        <div className="relative h-1.5 w-full rounded-full bg-[#F0EDE9] overflow-hidden">
          {/* Normal range highlight */}
          <div 
            className="absolute h-full bg-[#E8F5E9] opacity-80"
            style={{ left: `${refMinPct}%`, right: `${100 - refMaxPct}%` }}
          />
          {/* Pointer dot */}
          <div 
            className={`absolute -translate-x-1/2 top-0 h-1.5 w-1.5 rounded-full ${
              isOutOfRange ? "bg-[#C62828]" : "bg-[#2E7D32]"
            }`}
            style={{ left: `${percentage}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-[#857d77] mono-text">
          <span>Min {refMin}</span>
          <span>Max {refMax}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col justify-between p-5 bg-white rounded-2xl border border-[#EAE6E1] hover-card-effect`}>
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-base text-[#2B2520] tracking-tight">{name}</h3>
            <span className="text-[10.5px] text-[#857d77] capitalize tracking-wide">{category}</span>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${badgeStyle}`}>
            {badgeText}
          </span>
        </div>

        {/* Big numbers & Sparkline */}
        <div className="mt-4 flex items-end justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span 
                className="mono-text text-3xl font-semibold tracking-tighter text-[#2B2520] cursor-pointer hover:underline"
                onClick={() => valMmol_L && setDisplayUnit(displayUnit === "default" ? "alt" : "default")}
                title={valMmol_L ? "Cliquez pour changer d'unité" : ""}
              >
                {displayValue}
              </span>
              <span className="text-xs text-[#857d77] mono-text">{displayUnitText}</span>
            </div>
            
            {secondaryValue && (
              <span className="text-[10px] text-[#857d77] mono-text mt-0.5">
                {secondaryValue}
              </span>
            )}
          </div>

          {/* Sparkline display */}
          <div className="pb-1">
            {renderSparkline()}
          </div>
        </div>

        {/* Trend Indicator */}
        {changePct !== undefined && changePct !== 0 && (
          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold">
            {changePct < 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[#1b5e20]">
                <ArrowDown size={12} strokeWidth={3} /> {Math.abs(changePct)}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[#b71c1c]">
                <ArrowUp size={12} strokeWidth={3} /> +{changePct}%
              </span>
            )}
            <span className="text-[#857d77] font-normal">depuis le précédent</span>
          </div>
        )}

        {/* Mini Range visualizer */}
        {renderRangeBar()}
      </div>

      {explanation && (
        <div className="mt-4 pt-3 border-t border-[#FBFAF8] flex gap-1.5 items-start">
          <Info size={13} className="text-[#857d77] shrink-0 mt-0.5" />
          <p className="text-[11.5px] leading-relaxed text-[#857d77] italic line-clamp-2">
            {explanation}
          </p>
        </div>
      )}

      <div className="mt-3 text-right">
        <Link 
          href={`/biomarkers/${encodeURIComponent(name)}`}
          className="text-[10.5px] font-semibold text-[#b57c1e] hover:underline"
        >
          Voir l'analyse détaillée →
        </Link>
      </div>
    </div>
  );
}
