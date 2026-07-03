import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reports - Fetches all blood reports sorted by date descending
export async function GET() {
  try {
    const profile = await prisma.userProfile.findFirst();
    if (!profile) {
      return NextResponse.json([]);
    }

    const reports = await prisma.bloodReport.findMany({
      where: { userId: profile.id },
      include: {
        biomarkers: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Failed to fetch reports", details: error.message }, { status: 500 });
  }
}

// DELETE /api/reports - Deletes a specific blood report
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing report ID" }, { status: 400 });
    }

    await prisma.bloodReport.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Report deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/reports error:", error);
    return NextResponse.json({ error: "Failed to delete report", details: error.message }, { status: 500 });
  }
}
