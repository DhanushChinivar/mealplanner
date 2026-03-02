// app/api/generate-mealplan/route.ts

import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { parseMealToStructured } from "@/types/mealplan";

const API_KEY = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;

function createOpenRouterClient(apiKey: string) {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "mealplanner",
    },
  });
}

const MODELS = (
  process.env.OPENROUTER_MODELS ??
  "meta-llama/llama-3.2-3b-instruct:free,mistralai/mistral-7b-instruct:free"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

const MAX_RETRIES_PER_MODEL = 2;
const BASE_RETRY_DELAY_MS = 900;

interface ProviderError {
  status?: number;
  code?: number | string;
  message?: string;
  error?: { message?: string };
}

interface DailyMealPlan {
  Breakfast?: string;
  Lunch?: string;
  Dinner?: string;
  Snacks?: string;
}

interface MealPlanRequest {
  dietType?: string;
  calories?: number | string;
  allergies?: string;
  cuisine?: string;
  snacks?: boolean;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
const DAY_ORDER: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};
const MEAL_ORDER: Record<string, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snacks: 3,
};

const FALLBACK_MEALS = {
  Breakfast: [
    "Overnight oats with berries and chia",
    "Veggie omelet with whole-grain toast",
    "Greek yogurt bowl with fruit and nuts",
    "Protein smoothie with spinach and banana",
  ],
  Lunch: [
    "Quinoa bowl with roasted vegetables and chickpeas",
    "Grilled chicken salad with olive oil dressing",
    "Turkey and avocado whole-grain wrap",
    "Lentil soup with side salad",
  ],
  Dinner: [
    "Baked salmon with sweet potato and greens",
    "Tofu stir-fry with brown rice",
    "Lean beef and vegetable skillet",
    "Whole-wheat pasta with tomato sauce and vegetables",
  ],
  Snacks: [
    "Apple slices with peanut butter",
    "Hummus with carrot and cucumber sticks",
    "Cottage cheese with berries",
    "Mixed nuts and a piece of fruit",
  ],
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function getProviderErrorDetails(error: unknown): {
  status: number | undefined;
  message: string;
} {
  const err = error as ProviderError;
  const status =
    typeof err?.status === "number"
      ? err.status
      : typeof err?.code === "number"
      ? err.code
      : undefined;

  const message =
    err?.error?.message ?? err?.message ?? "Unknown provider error.";

  return { status, message };
}

function shouldRetry(status: number | undefined): boolean {
  return status === 429 || status === 408 || status === 502 || status === 503;
}

function asCalories(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 2000;
}

function buildFallbackMealPlan({
  dietType,
  calories,
  allergies,
  cuisine,
  snacks,
}: MealPlanRequest): { [day: string]: DailyMealPlan } {
  const targetCalories = Math.max(1200, Math.min(4000, asCalories(calories)));
  const breakfastCalories = Math.round(targetCalories * 0.25);
  const lunchCalories = Math.round(targetCalories * 0.35);
  const dinnerCalories = Math.round(targetCalories * 0.35);
  const snackCalories = Math.max(
    80,
    targetCalories - (breakfastCalories + lunchCalories + dinnerCalories)
  );
  const preferenceNote = [
    dietType?.trim() ? `diet: ${dietType.trim()}` : "",
    cuisine?.trim() ? `cuisine: ${cuisine.trim()}` : "",
    allergies?.trim() ? `avoid ${allergies.trim()}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const suffix = preferenceNote ? ` (${preferenceNote})` : "";
  const plan: { [day: string]: DailyMealPlan } = {};

  for (let i = 0; i < DAYS.length; i++) {
    const day = DAYS[i];
    const meal: DailyMealPlan = {
      Breakfast: `${FALLBACK_MEALS.Breakfast[i % FALLBACK_MEALS.Breakfast.length]} - ~${breakfastCalories} calories${suffix}`,
      Lunch: `${FALLBACK_MEALS.Lunch[i % FALLBACK_MEALS.Lunch.length]} - ~${lunchCalories} calories${suffix}`,
      Dinner: `${FALLBACK_MEALS.Dinner[i % FALLBACK_MEALS.Dinner.length]} - ~${dinnerCalories} calories${suffix}`,
    };

    if (snacks) {
      meal.Snacks = `${FALLBACK_MEALS.Snacks[i % FALLBACK_MEALS.Snacks.length]} - ~${snackCalories} calories${suffix}`;
    }

    plan[day] = meal;
  }

  return plan;
}

function normalizeDayMealPlan(plan?: DailyMealPlan & {
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snacks?: string;
}): {
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snacks?: string;
} {
  if (!plan) return {};
  return {
    breakfast: plan.Breakfast ?? plan.breakfast,
    lunch: plan.Lunch ?? plan.lunch,
    dinner: plan.Dinner ?? plan.dinner,
    snacks: plan.Snacks ?? plan.snacks,
  };
}

function normalizeWeeklyMealPlanForDb(weeklyPlan: {
  [day: string]: DailyMealPlan;
}) {
  return Object.entries(weeklyPlan)
    .map(([dayName, dayPlan]) => {
      const normalized = normalizeDayMealPlan(dayPlan);
      const items = Object.entries(normalized)
        .filter(([, description]) => Boolean(description))
        .map(([mealType, description]) => ({
          mealType,
          description: String(description),
          sortOrder: MEAL_ORDER[mealType] ?? 99,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(({ mealType, description }, mealIndex) => {
          const normalizedMealType = mealType.toLowerCase();
          const parseType =
            normalizedMealType === "snacks" ? "snack" : normalizedMealType;
          const structuredMeal = parseMealToStructured(
            description,
            parseType as "breakfast" | "lunch" | "dinner" | "snack",
            DAY_ORDER[dayName] ?? 99,
            mealIndex
          );

          return {
            mealType,
            sortOrder: MEAL_ORDER[mealType] ?? 99,
            name: structuredMeal.name,
            description,
            calories: structuredMeal.macros.calories,
            protein: structuredMeal.macros.protein,
            carbs: structuredMeal.macros.carbs,
            fats: structuredMeal.macros.fats,
            fiber: structuredMeal.macros.fiber ?? null,
            prepTime: structuredMeal.prepTime ?? null,
            selected: structuredMeal.selected !== false,
            portionMultiplier: structuredMeal.portionMultiplier ?? 1,
            ingredients: structuredMeal.ingredients,
          };
        });

      return {
        dayName,
        dayOrder: DAY_ORDER[dayName] ?? 99,
        items,
      };
    })
    .sort((a, b) => a.dayOrder - b.dayOrder);
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

async function persistMealPlan({
  userId,
  input,
  mealPlan,
  source,
  warning,
}: {
  userId: string;
  input: MealPlanRequest;
  mealPlan: { [day: string]: DailyMealPlan };
  source: "provider" | "fallback";
  warning?: string;
}) {
  const days = normalizeWeeklyMealPlanForDb(mealPlan);
  if (days.length === 0) return;

  await prisma.mealPlan.create({
    data: {
      userId,
      dietType: input.dietType ?? null,
      calories: asCalories(input.calories),
      allergies: input.allergies ?? null,
      cuisine: input.cuisine ?? null,
      snacks: Boolean(input.snacks),
      source,
      warning: warning ?? null,
      days: {
        create: days.map((day) => ({
          dayName: day.dayName,
          dayOrder: day.dayOrder,
          items: {
            create: day.items.map((item) => ({
              mealType: item.mealType,
              sortOrder: item.sortOrder,
              name: item.name,
              description: item.description,
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fats: item.fats,
              fiber: item.fiber,
              prepTime: item.prepTime,
              selected: item.selected,
              portionMultiplier: item.portionMultiplier,
              ingredients: {
                create: item.ingredients.map((ingredient) => ({
                  name: ingredient.name,
                  amount: ingredient.amount,
                  unit: ingredient.unit,
                  category: ingredient.category,
                })),
              },
            })),
          },
        })),
      },
    },
  });
}

async function safePersistMealPlan(
  args: Parameters<typeof persistMealPlan>[0]
): Promise<void> {
  try {
    await persistMealPlan(args);
  } catch (error) {
    console.error("Error persisting meal plan:", error);
  }
}

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const latest = await prisma.mealPlan.findFirst({
      where: { userId: clerkUser.id },
      orderBy: { createdAt: "desc" },
      include: {
        days: {
          orderBy: { dayOrder: "asc" },
          include: { items: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    if (!latest) {
      return NextResponse.json({ mealPlan: null, source: "none" });
    }

    return NextResponse.json({
      mealPlan: buildWeeklyMealPlanFromDb(latest.days),
      source: latest.source ?? "provider",
      warning: latest.warning ?? undefined,
      createdAt: latest.createdAt,
    });
  } catch (error) {
    console.error("Error fetching latest meal plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest meal plan." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    const userId = clerkUser?.id;

    // Extract parameters from the request body
    const input: MealPlanRequest = await request.json();
    const {
      dietType,
      calories,
      allergies,
      cuisine,
      snacks = false,
    } = input;

    const fallbackPlan = buildFallbackMealPlan({
      dietType,
      calories,
      allergies,
      cuisine,
      snacks,
    });

    if (!API_KEY) {
      if (userId) {
        await safePersistMealPlan({
          userId,
          input,
          mealPlan: fallbackPlan,
          source: "fallback",
          warning:
            "Missing OpenRouter API key. Returned a locally generated meal plan.",
        });
      }
      return NextResponse.json({
        mealPlan: fallbackPlan,
        source: "fallback",
        warning:
          "Missing OpenRouter API key. Returned a locally generated meal plan.",
      });
    }
    const openai = createOpenRouterClient(API_KEY);

    const prompt = `
      You are a professional nutritionist. Create a 7-day meal plan for an individual following a ${dietType} diet aiming for ${calories} calories per day.
      
      Allergies or restrictions: ${allergies || "none"}.
      Preferred cuisine: ${cuisine || "no preference"}.
      Snacks included: ${snacks ? "yes" : "no"}.
      
      For each day, provide:
        - Breakfast
        - Lunch
        - Dinner
        ${snacks ? "- Snacks" : ""}
      
      Use simple ingredients and provide brief instructions. Include approximate calorie counts for each meal.
      
      Structure the response as a JSON object where each day is a key, and each meal (breakfast, lunch, dinner, snacks) is a sub-key. Example:
      
      {
        "Monday": {
          "Breakfast": "Oatmeal with fruits - 350 calories",
          "Lunch": "Grilled chicken salad - 500 calories",
          "Dinner": "Steamed vegetables with quinoa - 600 calories",
          "Snacks": "Greek yogurt - 150 calories"
        },
        "Tuesday": {
          "Breakfast": "Smoothie bowl - 300 calories",
          "Lunch": "Turkey sandwich - 450 calories",
          "Dinner": "Baked salmon with asparagus - 700 calories",
          "Snacks": "Almonds - 200 calories"
        }
        // ...and so on for each day
      }

      Return just the json with no extra commentaries and no backticks.
    `;

    let aiContent = "";
    let lastProviderStatus: number | undefined;
    let lastProviderMessage = "Provider request failed.";

    // Try preferred models in order. Retries handle transient provider/rate-limit failures.
    modelLoop: for (const model of MODELS) {
      for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
        try {
          const response = await openai.chat.completions.create({
            model,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 1500,
          });

          aiContent = response.choices?.[0]?.message?.content?.trim() ?? "";
          break modelLoop;
        } catch (error) {
          const { status, message } = getProviderErrorDetails(error);
          lastProviderStatus = status;
          lastProviderMessage = message;
          const hasMoreRetries = attempt < MAX_RETRIES_PER_MODEL;

          if (hasMoreRetries && shouldRetry(status)) {
            const waitMs = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
            await sleep(waitMs);
            continue;
          }

          // Non-retryable error (or retries exhausted): try next model.
          break;
        }
      }
    }

    if (!aiContent) {
      if (userId) {
        await safePersistMealPlan({
          userId,
          input,
          mealPlan: fallbackPlan,
          source: "fallback",
          warning: `Provider request failed (${lastProviderStatus ?? "unknown"}): ${lastProviderMessage}`,
        });
      }
      return NextResponse.json(
        {
          mealPlan: fallbackPlan,
          source: "fallback",
          warning: `Provider request failed (${lastProviderStatus ?? "unknown"}): ${lastProviderMessage}`,
        },
        { status: 200 }
      );
    }

    let parsedMealPlan: { [day: string]: DailyMealPlan };
    try {
      parsedMealPlan = JSON.parse(aiContent);
    } catch (parseError) {
      console.error("Error parsing AI response as JSON:", parseError);
      if (userId) {
        await safePersistMealPlan({
          userId,
          input,
          mealPlan: fallbackPlan,
          source: "fallback",
          warning:
            "Provider returned invalid JSON. Returned a locally generated meal plan.",
        });
      }
      return NextResponse.json(
        {
          mealPlan: fallbackPlan,
          source: "fallback",
          warning:
            "Provider returned invalid JSON. Returned a locally generated meal plan.",
        },
        { status: 200 }
      );
    }

    if (typeof parsedMealPlan !== "object" || parsedMealPlan === null) {
      throw new Error("Invalid meal plan format received from AI.");
    }

    if (userId) {
      await safePersistMealPlan({
        userId,
        input,
        mealPlan: parsedMealPlan,
        source: "provider",
      });
    }

    return NextResponse.json({ mealPlan: parsedMealPlan, source: "provider" });
  } catch (error) {
    console.error("Error generating meal plan:", error);
    const { status, message } = getProviderErrorDetails(error);
    const fallbackPlan = buildFallbackMealPlan({});
    const clerkUser = await currentUser();
    if (clerkUser?.id) {
      await safePersistMealPlan({
        userId: clerkUser.id,
        input: {},
        mealPlan: fallbackPlan,
        source: "fallback",
        warning: `Unexpected error (${status ?? 500}): ${message}`,
      });
    }
    return NextResponse.json(
      {
        mealPlan: fallbackPlan,
        source: "fallback",
        warning: `Unexpected error (${status ?? 500}): ${message}`,
      },
      { status: 200 }
    );
  }
}
