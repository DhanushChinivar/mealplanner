import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { GroceryItem, Ingredient } from "@/types/mealplan";

const CATEGORY_ORDER: Ingredient["category"][] = [
  "proteins",
  "produce",
  "grains",
  "dairy",
  "spices",
  "other",
];

function normalizeCategory(value: string): Ingredient["category"] {
  if (CATEGORY_ORDER.includes(value as Ingredient["category"])) {
    return value as Ingredient["category"];
  }
  return "other";
}

function aggregateItems(
  mealDays: Array<{
    items: Array<{
      portionMultiplier: number;
      ingredients: Array<{
        name: string;
        amount: number;
        unit: string;
        category: string;
      }>;
    }>;
  }>
): GroceryItem[] {
  const aggregated = new Map<string, GroceryItem>();

  for (const day of mealDays) {
    for (const item of day.items) {
      const multiplier = item.portionMultiplier ?? 1;
      for (const ingredient of item.ingredients) {
        const category = normalizeCategory(ingredient.category);
        const key = `${ingredient.name.toLowerCase()}|${ingredient.unit}|${category}`;
        const adjustedAmount = ingredient.amount * multiplier;
        const existing = aggregated.get(key);

        if (existing) {
          existing.totalAmount += adjustedAmount;
          continue;
        }

        aggregated.set(key, {
          name: ingredient.name,
          totalAmount: adjustedAmount,
          unit: ingredient.unit,
          category,
        });
      }
    }
  }

  return [...aggregated.values()]
    .map((item) => ({
      ...item,
      totalAmount: Math.round(item.totalAmount * 100) / 100,
    }))
    .sort((a, b) => {
      const byCategory =
        CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
      if (byCategory !== 0) return byCategory;
      return a.name.localeCompare(b.name);
    });
}

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
          include: {
            items: {
              include: {
                ingredients: true,
              },
            },
          },
        },
      },
    });

    if (!latestPlan) {
      return NextResponse.json({ items: [], source: "none" });
    }

    const items = aggregateItems(latestPlan.days);
    return NextResponse.json({
      items,
      source: latestPlan.source ?? "provider",
      warning: latestPlan.warning ?? undefined,
      createdAt: latestPlan.createdAt,
    });
  } catch (error) {
    console.error("Error fetching grocery list:", error);
    return NextResponse.json(
      { error: "Failed to fetch grocery list." },
      { status: 500 }
    );
  }
}
