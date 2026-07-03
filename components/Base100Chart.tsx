"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface Base100ChartProps {
  trendsData: {
    [biomarkerName: string]: {
      name: string;
      history: {
        date: string;
        rawValue: number;
        rawUnit: string;
        base100Value: number;
      }[];
    };
  };
}

export default function Base100Chart({ trendsData }: Base100ChartProps) {
  // Extract and align data chronologically
  const trigHistory = trendsData["Triglycérides"]?.history || [];
  const hdlHistory = trendsData["Cholestérol HDL"]?.history || [];
  const ldlHistory = trendsData["Cholestérol LDL"]?.history || [];

  if (trigHistory.length === 0 && hdlHistory.length === 0 && ldlHistory.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-[#EAE6E1] bg-white text-sm text-[#857d77]">
        Pas assez de données pour afficher l'évolution.
      </div>
    );
  }

  // Combine into Recharts-friendly data format
  // Find all unique dates
  const allDates = Array.from(
    new Set([
      ...trigHistory.map((h) => h.date),
      ...hdlHistory.map((h) => h.date),
      ...ldlHistory.map((h) => h.date),
    ])
  ).sort();

  const chartData = allDates.map((dateStr) => {
    // Format date from YYYY-MM-DD to MM/YY for X-Axis
    const parts = dateStr.split("-");
    const formattedDate = parts.length === 3 ? `${parts[1]}/${parts[0].slice(2)}` : dateStr;

    // Helper to format full date for Tooltip (e.g. "25 JUIN 2026")
    let fullDateText = dateStr;
    if (parts.length === 3) {
      const d = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
      fullDateText = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
    }

    const trigPoint = trigHistory.find((h) => h.date === dateStr);
    const hdlPoint = hdlHistory.find((h) => h.date === dateStr);
    const ldlPoint = ldlHistory.find((h) => h.date === dateStr);

    return {
      date: formattedDate,
      fullDate: fullDateText,
      // Base 100 values
      trigBase100: trigPoint ? trigPoint.base100Value : null,
      hdlBase100: hdlPoint ? hdlPoint.base100Value : null,
      ldlBase100: ldlPoint ? ldlPoint.base100Value : null,
      // Raw values for custom tooltip display
      trigRaw: trigPoint ? `${trigPoint.rawValue} ${trigPoint.rawUnit}` : null,
      hdlRaw: hdlPoint ? `${hdlPoint.rawValue} ${hdlPoint.rawUnit}` : null,
      ldlRaw: ldlPoint ? `${ldlPoint.rawValue} ${ldlPoint.rawUnit}` : null,
    };
  });

  // Custom Tooltip component to match the premium French layout in the screenshot
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl border border-[#EAE6E1] shadow-xl text-xs flex flex-col gap-2 min-w-[200px]">
          <span className="mono-text font-bold text-[#857d77]">{data.fullDate}</span>
          <div className="flex flex-col gap-1.5 mt-1 border-t border-[#FBFAF8] pt-2">
            {data.trigRaw && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#2b2520]">
                  <span className="h-2 w-2 rounded-full bg-[#2E7D32]" />
                  Triglycérides
                </span>
                <span className="mono-text font-semibold text-[#2b2520]">{data.trigRaw}</span>
              </div>
            )}
            {data.hdlRaw && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#2b2520]">
                  <span className="h-2 w-2 rounded-full bg-[#8E704F]" />
                  Bon cholestérol (HDL)
                </span>
                <span className="mono-text font-semibold text-[#2b2520]">{data.hdlRaw}</span>
              </div>
            )}
            {data.ldlRaw && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#2b2520]">
                  <span className="h-2 w-2 rounded-full bg-[#C62828]" />
                  Mauvais cholestérol (LDL)
                </span>
                <span className="mono-text font-semibold text-[#2b2520]">{data.ldlRaw}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white p-6 rounded-2xl border border-[#EAE6E1]">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="serif-heading text-lg font-bold text-[#2B2520]">
            Trois courbes qui se croisent
          </h3>
          <p className="text-xs text-[#857d77] leading-relaxed mt-1">
            Les trois cholestérols ramenés à une base 100 (leur valeur de départ en 2023). <br className="hidden sm:inline" />
            On voit d'un coup l'histoire : les triglycérides plongent, le bon cholestérol remonte, et le mauvais file dans l'autre sens.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-semibold text-[#857d77] mono-text uppercase bg-[#FBFAF8] px-2.5 py-1 rounded-full border border-[#EAE6E1]">
          Base 100 = 2023
        </div>
      </div>

      {/* Chart Legend matching the exact color schema of the screenshot */}
      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium border-b border-[#FBFAF8] pb-4">
        <span className="flex items-center gap-1.5 text-[#2E7D32]">
          <span className="h-2 w-2 rounded-full bg-[#2E7D32]" />
          Triglycérides ↓
        </span>
        <span className="flex items-center gap-1.5 text-[#8E704F]">
          <span className="h-2 w-2 rounded-full bg-[#8E704F]" />
          Bon cholestérol (HDL) ↑
        </span>
        <span className="flex items-center gap-1.5 text-[#C62828]">
          <span className="h-2 w-2 rounded-full bg-[#C62828]" />
          Mauvais cholestérol (LDL) ↑
        </span>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE9" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#857d77"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
              className="mono-text"
            />
            <YAxis
              stroke="#857d77"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              dx={-5}
              className="mono-text"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#EAE6E1", strokeWidth: 1 }} />
            
            {/* Base 100 line reference */}
            <ReferenceLine y={100} stroke="#857d77" strokeDasharray="3 3" opacity={0.5} />

            {/* Triglycerides - Green */}
            <Line
              type="monotone"
              dataKey="trigBase100"
              stroke="#2E7D32"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 1, fill: "#2E7D32" }}
              activeDot={{ r: 5 }}
            />
            
            {/* HDL - Brown */}
            <Line
              type="monotone"
              dataKey="hdlBase100"
              stroke="#8E704F"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 1, fill: "#8E704F" }}
              activeDot={{ r: 5 }}
            />

            {/* LDL - Red */}
            <Line
              type="monotone"
              dataKey="ldlBase100"
              stroke="#C62828"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 1, fill: "#C62828" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
