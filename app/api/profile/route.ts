import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/profile - Fetches the single user profile (creates one if none exists)
export async function GET() {
  try {
    let profile: any = await prisma.userProfile.findFirst({
      include: {
        _count: {
          select: { reports: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ isNew: true });
    }

    const parsedLifestyle = typeof profile.lifestyle === "string" 
      ? JSON.parse(profile.lifestyle)
      : profile.lifestyle;

    return NextResponse.json({
      ...profile,
      lifestyle: parsedLifestyle,
      healthGoals: profile.healthGoals ? profile.healthGoals.split(",").map((g: string) => g.trim()) : [],
    });
  } catch (error: any) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile", details: error.message }, { status: 500 });
  }
}

// POST /api/profile - Updates or creates the user profile
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { age, sex, height, weight, activityLevel, lifestyle, healthGoals, medicalHistory } = body;

    const existingProfile = await prisma.userProfile.findFirst();

    const updateData = {
      age: Number(age),
      sex,
      height: Number(height),
      weight: Number(weight),
      activityLevel,
      lifestyle: JSON.stringify(lifestyle || {}),
      healthGoals: Array.isArray(healthGoals) ? healthGoals.join(", ") : healthGoals,
      medicalHistory: medicalHistory || "",
    };

    let profile;
    if (existingProfile) {
      profile = await prisma.userProfile.update({
        where: { id: existingProfile.id },
        data: updateData,
      });
    } else {
      profile = await prisma.userProfile.create({
        data: updateData,
      });
    }

    return NextResponse.json({
      ...profile,
      lifestyle: lifestyle || {},
      healthGoals: Array.isArray(healthGoals) ? healthGoals : (healthGoals ? healthGoals.split(",") : []),
    });
  } catch (error: any) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json({ error: "Failed to update profile", details: error.message }, { status: 500 });
  }
}
