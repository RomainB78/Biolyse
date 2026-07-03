import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/trends - Computes history and trends for all biomarkers
export async function GET() {
  try {
    const profile = await prisma.userProfile.findFirst();
    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Fetch reports in chronological order
    const reports = await prisma.bloodReport.findMany({
      where: { userId: profile.id },
      include: {
        biomarkers: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    if (reports.length === 0) {
      return NextResponse.json({ trends: {}, reports: [] });
    }

    // Structure history by biomarker
    const trends: {
      [biomarkerName: string]: {
        name: string;
        category: string;
        history: {
          reportId: string;
          date: string;
          rawValue: number;
          rawUnit: string;
          valG_L: number | null;
          valMmol_L: number | null;
          refMin: number | null;
          refMax: number | null;
          base100Value: number; // Value relative to the baseline (first report) as 100
          flag: string;
        }[];
      };
    } = {};

    // First, compile history for all biomarkers
    for (const report of reports) {
      const dateStr = report.date.toISOString().split("T")[0];
      for (const bio of report.biomarkers) {
        if (!trends[bio.name]) {
          trends[bio.name] = {
            name: bio.name,
            category: bio.category,
            history: [],
          };
        }

        // Determine baseline value for base 100 normalization
        let baselineVal = bio.rawValue;
        if (trends[bio.name].history.length > 0) {
          baselineVal = trends[bio.name].history[0].rawValue;
        }

        const base100Value = baselineVal > 0 
          ? Number(((bio.rawValue / baselineVal) * 100).toFixed(1))
          : 100;

        trends[bio.name].history.push({
          reportId: report.id,
          date: dateStr,
          rawValue: bio.rawValue,
          rawUnit: bio.rawUnit,
          valG_L: bio.valG_L,
          valMmol_L: bio.valMmol_L,
          refMin: bio.refMin,
          refMax: bio.refMax,
          base100Value,
          flag: bio.flag,
        });
      }
    }

    return NextResponse.json({
      trends,
      reports: reports.map(r => ({
        id: r.id,
        date: r.date.toISOString().split("T")[0],
        healthScore: r.healthScore,
        scoreClass: r.scoreClass,
        labName: r.labName,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/trends error:", error);
    return NextResponse.json({ error: "Failed to fetch trends", details: error.message }, { status: 500 });
  }
}
