import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type Bucket = {
  plansGenerated: number;
  totalMeals: number;
  completedMeals: number;
  skippedMeals: number;
  avgAdherence: number;
  calorieTargetHitRate: number;
};

function toBucketOutput(b: Omit<Bucket, "avgAdherence" | "calorieTargetHitRate"> & {
  adherenceSum: number;
  calorieHitRateSum: number;
}): Bucket {
  return {
    plansGenerated: b.plansGenerated,
    totalMeals: b.totalMeals,
    completedMeals: b.completedMeals,
    skippedMeals: b.skippedMeals,
    avgAdherence:
      b.plansGenerated === 0 ? 0 : Math.round(b.adherenceSum / b.plansGenerated),
    calorieTargetHitRate:
      b.plansGenerated === 0
        ? 0
        : Math.round(b.calorieHitRateSum / b.plansGenerated),
  };
}

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const plans = await prisma.mealPlan.findMany({
      where: { userId: clerkUser.id },
      orderBy: { createdAt: "desc" },
      include: {
        days: {
          include: {
            items: {
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

    const monthly = new Map<
      string,
      {
        plansGenerated: number;
        totalMeals: number;
        completedMeals: number;
        skippedMeals: number;
        adherenceSum: number;
        calorieHitRateSum: number;
      }
    >();
    const yearly = new Map<
      string,
      {
        plansGenerated: number;
        totalMeals: number;
        completedMeals: number;
        skippedMeals: number;
        adherenceSum: number;
        calorieHitRateSum: number;
      }
    >();

    for (const plan of plans) {
      const d = new Date(plan.createdAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const yearKey = String(d.getFullYear());

      let totalMeals = 0;
      let completedMeals = 0;
      let skippedMeals = 0;
      let totalDays = 0;
      let hitDays = 0;

      for (const day of plan.days) {
        let dayCalories = 0;
        let dayMeals = 0;
        for (const item of day.items) {
          totalMeals += 1;
          dayMeals += 1;
          dayCalories += item.calories ?? 0;
          const status = item.logs[0]?.status;
          if (status === "completed") completedMeals += 1;
          if (status === "skipped") skippedMeals += 1;
        }
        if (dayMeals > 0 && (plan.calories ?? 0) > 0) {
          totalDays += 1;
          const target = plan.calories ?? 0;
          if (Math.abs(dayCalories - target) <= target * 0.15) {
            hitDays += 1;
          }
        }
      }

      const adherence =
        totalMeals === 0 ? 0 : Math.round((completedMeals / totalMeals) * 100);
      const calorieHitRate =
        totalDays === 0 ? 0 : Math.round((hitDays / totalDays) * 100);

      const m =
        monthly.get(monthKey) ??
        {
          plansGenerated: 0,
          totalMeals: 0,
          completedMeals: 0,
          skippedMeals: 0,
          adherenceSum: 0,
          calorieHitRateSum: 0,
        };
      m.plansGenerated += 1;
      m.totalMeals += totalMeals;
      m.completedMeals += completedMeals;
      m.skippedMeals += skippedMeals;
      m.adherenceSum += adherence;
      m.calorieHitRateSum += calorieHitRate;
      monthly.set(monthKey, m);

      const y =
        yearly.get(yearKey) ??
        {
          plansGenerated: 0,
          totalMeals: 0,
          completedMeals: 0,
          skippedMeals: 0,
          adherenceSum: 0,
          calorieHitRateSum: 0,
        };
      y.plansGenerated += 1;
      y.totalMeals += totalMeals;
      y.completedMeals += completedMeals;
      y.skippedMeals += skippedMeals;
      y.adherenceSum += adherence;
      y.calorieHitRateSum += calorieHitRate;
      yearly.set(yearKey, y);
    }

    const monthlyOutput = Object.fromEntries(
      [...monthly.entries()].map(([k, v]) => [k, toBucketOutput(v)])
    );
    const yearlyOutput = Object.fromEntries(
      [...yearly.entries()].map(([k, v]) => [k, toBucketOutput(v)])
    );

    return NextResponse.json({
      monthly: monthlyOutput,
      yearly: yearlyOutput,
      totals: {
        plansGenerated: plans.length,
      },
    });
  } catch (error) {
    console.error("Error fetching meal progress summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress summary." },
      { status: 500 }
    );
  }
}
