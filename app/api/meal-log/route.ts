import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type MealStatus = "completed" | "skipped";

interface LogRequestBody {
  dayName?: string;
  mealType?: string;
  status?: MealStatus | "pending";
  planId?: string;
}

interface StatusMap {
  [dayName: string]: {
    breakfast?: MealStatus;
    lunch?: MealStatus;
    dinner?: MealStatus;
    snacks?: MealStatus;
  };
}

const MEAL_KEYS = ["breakfast", "lunch", "dinner", "snacks"] as const;

function normalizeMealType(value: string | undefined): string {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "snack") return "snacks";
  return normalized;
}

function buildStatusAndSummary(
  latestPlan: {
    id: string;
    days: Array<{
      dayName: string;
      items: Array<{ id: string; mealType: string }>;
    }>;
  },
  logs: Array<{ mealItemId: string; status: string }>
) {
  const logByMealItemId = new Map(logs.map((log) => [log.mealItemId, log.status]));
  const statuses: StatusMap = {};

  let totalMeals = 0;
  let completedMeals = 0;
  let skippedMeals = 0;

  for (const day of latestPlan.days) {
    if (!statuses[day.dayName]) statuses[day.dayName] = {};
    for (const item of day.items) {
      const mealKey = normalizeMealType(item.mealType);
      if (!MEAL_KEYS.includes(mealKey as (typeof MEAL_KEYS)[number])) continue;
      totalMeals += 1;
      const status = logByMealItemId.get(item.id);
      if (status === "completed") completedMeals += 1;
      if (status === "skipped") skippedMeals += 1;
      if (status === "completed" || status === "skipped") {
        statuses[day.dayName][mealKey as keyof StatusMap[string]] = status;
      }
    }
  }

  const adherence = totalMeals === 0 ? 0 : Math.round((completedMeals / totalMeals) * 100);

  return {
    statuses,
    summary: {
      totalMeals,
      completedMeals,
      skippedMeals,
      adherence,
    },
  };
}

async function getPlanForUser(userId: string, planId?: string | null) {
  return prisma.mealPlan.findFirst({
    where: { userId, ...(planId ? { id: planId } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      days: {
        orderBy: { dayOrder: "asc" },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, mealType: true },
          },
        },
      },
    },
  });
}

export async function GET(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");
    const latestPlan = await getPlanForUser(clerkUser.id, planId);
    if (!latestPlan) {
      return NextResponse.json({
        statuses: {},
        summary: { totalMeals: 0, completedMeals: 0, skippedMeals: 0, adherence: 0 },
      });
    }

    const logs = await prisma.mealLog.findMany({
      where: { userId: clerkUser.id, mealPlanId: latestPlan.id },
      select: { mealItemId: true, status: true },
    });

    return NextResponse.json(buildStatusAndSummary(latestPlan, logs));
  } catch (error) {
    console.error("Error getting meal logs:", error);
    return NextResponse.json(
      { error: "Failed to get meal logs." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { dayName, mealType, status, planId }: LogRequestBody =
      await request.json();
    const normalizedDay = (dayName ?? "").trim();
    const normalizedMeal = normalizeMealType(mealType);

    if (!normalizedDay || !MEAL_KEYS.includes(normalizedMeal as (typeof MEAL_KEYS)[number])) {
      return NextResponse.json(
        { error: "Invalid dayName or mealType." },
        { status: 400 }
      );
    }

    if (status !== "completed" && status !== "skipped" && status !== "pending") {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const latestPlan = await getPlanForUser(clerkUser.id, planId);
    if (!latestPlan) {
      return NextResponse.json(
        { error: "No meal plan found for user." },
        { status: 404 }
      );
    }

    const matchedDay = latestPlan.days.find(
      (day) => day.dayName.toLowerCase() === normalizedDay.toLowerCase()
    );
    if (!matchedDay) {
      return NextResponse.json({ error: "Day not found in meal plan." }, { status: 404 });
    }

    const matchedItem = matchedDay.items.find((item) => {
      const itemMealType = normalizeMealType(item.mealType);
      return itemMealType === normalizedMeal;
    });
    if (!matchedItem) {
      return NextResponse.json({ error: "Meal not found in day plan." }, { status: 404 });
    }

    if (status === "pending") {
      await prisma.mealLog.deleteMany({
        where: { userId: clerkUser.id, mealItemId: matchedItem.id },
      });
    } else {
      await prisma.mealLog.upsert({
        where: {
          userId_mealItemId: {
            userId: clerkUser.id,
            mealItemId: matchedItem.id,
          },
        },
        update: { status, mealPlanId: latestPlan.id },
        create: {
          userId: clerkUser.id,
          mealPlanId: latestPlan.id,
          mealItemId: matchedItem.id,
          status,
        },
      });
    }

    const logs = await prisma.mealLog.findMany({
      where: { userId: clerkUser.id, mealPlanId: latestPlan.id },
      select: { mealItemId: true, status: true },
    });

    return NextResponse.json(buildStatusAndSummary(latestPlan, logs));
  } catch (error) {
    console.error("Error updating meal log:", error);
    return NextResponse.json(
      { error: "Failed to update meal log." },
      { status: 500 }
    );
  }
}
