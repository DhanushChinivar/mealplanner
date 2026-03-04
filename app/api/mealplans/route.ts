import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface DailyMealPlan {
  Breakfast?: string;
  Lunch?: string;
  Dinner?: string;
  Snacks?: string;
}

function buildWeeklyMealPlanFromDb(days: Array<{
  dayName: string;
  items: Array<{ mealType: string; description: string }>;
}>): { [day: string]: DailyMealPlan } {
  const mealPlan: { [day: string]: DailyMealPlan } = {};

  for (const day of days) {
    const daily: DailyMealPlan = {};
    for (const item of day.items) {
      const key = item.mealType.toLowerCase();
      if (key === "breakfast") daily.Breakfast = item.description;
      if (key === "lunch") daily.Lunch = item.description;
      if (key === "dinner") daily.Dinner = item.description;
      if (key === "snacks" || key === "snack") daily.Snacks = item.description;
    }
    mealPlan[day.dayName] = daily;
  }

  return mealPlan;
}

export async function GET(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("planId");

    const plans = await prisma.mealPlan.findMany({
      where: { userId: clerkUser.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        source: true,
        warning: true,
        dietType: true,
        calories: true,
        servingCount: true,
      },
    });

    if (!planId) {
      return NextResponse.json({ plans });
    }

    const selected = await prisma.mealPlan.findFirst({
      where: { id: planId, userId: clerkUser.id },
      include: {
        days: {
          orderBy: { dayOrder: "asc" },
          include: { items: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    if (!selected) {
      return NextResponse.json({ error: "Meal plan not found." }, { status: 404 });
    }

    return NextResponse.json({
      plans,
      selected: {
        id: selected.id,
        createdAt: selected.createdAt,
        source: selected.source ?? "provider",
        warning: selected.warning ?? undefined,
        servingCount: selected.servingCount ?? 1,
        mealPlan: buildWeeklyMealPlanFromDb(selected.days),
      },
    });
  } catch (error) {
    console.error("Error fetching meal plan history:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal plan history." },
      { status: 500 }
    );
  }
}
