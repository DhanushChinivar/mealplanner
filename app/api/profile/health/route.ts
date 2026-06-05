import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { displayName: true, age: true, weightKg: true, heightCm: true, goal: true },
  });

  return NextResponse.json(profile ?? {});
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { displayName, age, weightKg, heightCm, goal } = await req.json();

  const profile = await prisma.profile.upsert({
    where: { userId },
    update: { displayName, age, weightKg, heightCm, goal },
    create: {
      userId,
      email: "",
      displayName,
      age,
      weightKg,
      heightCm,
      goal,
    },
    select: { displayName: true, age: true, weightKg: true, heightCm: true, goal: true },
  });

  return NextResponse.json(profile);
}
