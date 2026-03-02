import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type MealStatus = "completed" | "skipped" | "pending";

interface DayAnalytics {
  dayName: string;
  completionRate: number;
  completedMeals: number;
  totalMeals: number;
  plannedCalories: number;
  plannedProtein: number;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const latestPlan = await prisma.mealPlan.findFirst({
      where: { userId: clerkUser.id },
      orderBy: { createdAt: "desc" },
      include: {
        days: {
          orderBy: { dayOrder: "asc" },
          include: {
            items: {
              orderBy: { sortOrder: "asc" },
              include: {
                logs: {
                  where: { userId: clerkUser.id },
                  select: { status: true },
                },
              },
            },
          },
        },
      },
    });

    if (!latestPlan) {
      return NextResponse.json({
        summary: {
          overallAdherence: 0,
          completedMeals: 0,
          skippedMeals: 0,
          totalMeals: 0,
          calorieTargetHitRate: 0,
          proteinConsistency: 0,
          currentDayStreak: 0,
        },
        days: [],
        heatmap: [],
      });
    }

    const dayAnalytics: DayAnalytics[] = [];
    const heatmap: Array<{
      dayName: string;
      breakfast: MealStatus;
      lunch: MealStatus;
      dinner: MealStatus;
      snacks: MealStatus;
    }> = [];

    let totalMeals = 0;
    let completedMeals = 0;
    let skippedMeals = 0;

    for (const day of latestPlan.days) {
      let dayTotal = 0;
      let dayCompleted = 0;
      let plannedCalories = 0;
      let plannedProtein = 0;
      const dayHeat = {
        dayName: day.dayName,
        breakfast: "pending" as MealStatus,
        lunch: "pending" as MealStatus,
        dinner: "pending" as MealStatus,
        snacks: "pending" as MealStatus,
      };

      for (const item of day.items) {
        const mealType = item.mealType.toLowerCase() === "snack" ? "snacks" : item.mealType.toLowerCase();
        const status = (item.logs[0]?.status ?? "pending") as MealStatus;
        if (mealType in dayHeat) {
          dayHeat[mealType as keyof typeof dayHeat] = status;
        }

        dayTotal += 1;
        totalMeals += 1;
        plannedCalories += item.calories ?? 0;
        plannedProtein += item.protein ?? 0;

        if (status === "completed") {
          dayCompleted += 1;
          completedMeals += 1;
        }
        if (status === "skipped") {
          skippedMeals += 1;
        }
      }

      dayAnalytics.push({
        dayName: day.dayName,
        completionRate: dayTotal === 0 ? 0 : Math.round((dayCompleted / dayTotal) * 100),
        completedMeals: dayCompleted,
        totalMeals: dayTotal,
        plannedCalories,
        plannedProtein,
      });
      heatmap.push(dayHeat);
    }

    const overallAdherence = totalMeals === 0 ? 0 : Math.round((completedMeals / totalMeals) * 100);
    const targetCalories = latestPlan.calories ?? 0;
    const calorieHitDays =
      targetCalories > 0
        ? dayAnalytics.filter((d) => Math.abs(d.plannedCalories - targetCalories) <= targetCalories * 0.1).length
        : 0;
    const calorieTargetHitRate =
      targetCalories > 0 && dayAnalytics.length > 0
        ? Math.round((calorieHitDays / dayAnalytics.length) * 100)
        : 0;

    const proteinValues = dayAnalytics.map((d) => d.plannedProtein).filter((v) => v > 0);
    const proteinAverage =
      proteinValues.length > 0
        ? proteinValues.reduce((sum, value) => sum + value, 0) / proteinValues.length
        : 0;
    const proteinConsistentDays =
      proteinAverage > 0
        ? dayAnalytics.filter(
            (d) => Math.abs(d.plannedProtein - proteinAverage) <= proteinAverage * 0.15
          ).length
        : 0;
    const proteinConsistency =
      proteinAverage > 0 && dayAnalytics.length > 0
        ? Math.round((proteinConsistentDays / dayAnalytics.length) * 100)
        : 0;

    const currentDayName = DAY_NAMES[new Date().getDay()];
    const currentIndex = dayAnalytics.findIndex((d) => d.dayName === currentDayName);
    let currentDayStreak = 0;
    if (currentIndex >= 0) {
      for (let i = currentIndex; i >= 0; i--) {
        if (dayAnalytics[i].completionRate === 100) {
          currentDayStreak += 1;
        } else {
          break;
        }
      }
    }

    return NextResponse.json({
      summary: {
        overallAdherence,
        completedMeals,
        skippedMeals,
        totalMeals,
        calorieTargetHitRate,
        proteinConsistency,
        currentDayStreak,
      },
      days: dayAnalytics,
      heatmap,
      source: latestPlan.source ?? "provider",
      warning: latestPlan.warning ?? undefined,
      createdAt: latestPlan.createdAt,
    });
  } catch (error) {
    console.error("Error fetching meal analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal analytics." },
      { status: 500 }
    );
  }
}
