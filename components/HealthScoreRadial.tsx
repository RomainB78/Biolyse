"use client";

import React from "react";

interface HealthScoreRadialProps {
  score: number;
  classification: string;
  baselineScore?: number;
  baselineDateText?: string;
}

export default function HealthScoreRadial({
  score,
  classification,
  baselineScore,
  baselineDateText = "janv. 2023",
}: HealthScoreRadialProps) {
  // SVG Circle Calculations
  const radius = 60;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine stroke color based on classification
  let strokeColor = "#1b5e20"; // Excellent/Good (Green)
  if (classification === "Moderate") strokeColor = "#b57c1e"; // Yellow
  if (classification === "At risk") strokeColor = "#b71c1c"; // Red

  const delta = baselineScore !== undefined ? score - baselineScore : 0;
  const isPositive = delta > 0;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-[#EAE6E1]">
      <div className="relative flex items-center justify-center">
        {/* SVG Circle */}
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            stroke="#F0EDE9"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Active progress circle */}
          <circle
            stroke={strokeColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset, transition: "stroke-dashoffset 0.8s ease-in-out" }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        
        {/* Score overlay */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="mono-text text-4xl font-semibold tracking-tighter text-[#2B2520]">{score}</span>
          <span className="text-[10px] text-[#857d77] uppercase tracking-wider">/ 100</span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <h3 className="text-xs uppercase tracking-wider text-[#857d77] font-semibold">
          Score Métabolique
        </h3>
        <p className="text-sm font-semibold text-[#2B2520] mt-0.5">{classification}</p>
        
        {baselineScore !== undefined && delta !== 0 && (
          <div className="mt-3 flex flex-col items-center gap-0.5">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isPositive 
                  ? "bg-[#E8F5E9] text-[#1b5e20]" 
                  : "bg-[#FFEBEE] text-[#b71c1c]"
              }`}
            >
              {isPositive ? "+" : ""}{delta} depuis {baselineDateText}
            </span>
            <span className="text-[10px] text-[#857d77] mono-text">
              {baselineScore} → {score}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
