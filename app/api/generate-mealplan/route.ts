// app/api/generate-mealplan/route.ts

import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { parseMealToStructured } from "@/types/mealplan";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_PROVIDER =
  (process.env.AI_PROVIDER ?? "").trim().toLowerCase() ||
  (OPENAI_API_KEY ? "openai" : "openrouter");
const OPENAI_MODEL = (process.env.OPENAI_MODEL ?? "gpt-4o-mini").trim();

function createOpenAIClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

function createOpenRouterClient(apiKey: string) {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "mealsforge",
    },
  });
}

const OPENROUTER_MODELS = (
  process.env.OPENROUTER_MODELS ??
  "meta-llama/llama-3.2-3b-instruct:free"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

const MODELS =
  AI_PROVIDER === "openai" ? [OPENAI_MODEL] : OPENROUTER_MODELS;

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
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snacks?: string;
}

interface MealPlanRequest {
  dietType?: string;
  calories?: number | string;
  allergies?: string;
  cuisine?: string;
  snacks?: boolean;
  servingCount?: number;
  swapDay?: string;
  swapMealType?: string;
  baseMealPlan?: { [day: string]: DailyMealPlan };
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

function toUserWarning(status: number | undefined, message: string): string {
  const msg = message.toLowerCase();
  if (status === 404 && msg.includes("no endpoints found")) {
    return "AI provider model is temporarily unavailable. A backup meal plan was generated.";
  }
  if (status === 429) {
    return "AI provider is busy right now. A backup meal plan was generated.";
  }
  if (status && status >= 500) {
    return "AI provider had a temporary issue. A backup meal plan was generated.";
  }
  return "AI provider is currently unavailable. A backup meal plan was generated.";
}

function asCalories(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 2000;
}

function normalizeServingCount(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 1;
  return Math.max(1, Math.min(8, Math.round(value)));
}

function normalizeMealTypeForSwap(value: string | undefined): string {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "snack") return "snacks";
  return normalized;
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

function applySwapToWeeklyPlan({
  baseMealPlan,
  candidateMealPlan,
  swapDay,
  swapMealType,
}: {
  baseMealPlan?: { [day: string]: DailyMealPlan };
  candidateMealPlan: { [day: string]: DailyMealPlan };
  swapDay?: string;
  swapMealType?: string;
}): { [day: string]: DailyMealPlan } {
  if (!baseMealPlan || !swapDay || !swapMealType) return candidateMealPlan;

  const dayKey = Object.keys(baseMealPlan).find(
    (day) => day.toLowerCase() === swapDay.toLowerCase()
  );
  if (!dayKey) return candidateMealPlan;

  const candidateDay = Object.keys(candidateMealPlan).find(
    (day) => day.toLowerCase() === swapDay.toLowerCase()
  );
  if (!candidateDay) return candidateMealPlan;

  const normalizedMeal = normalizeMealTypeForSwap(swapMealType);
  if (!["breakfast", "lunch", "dinner", "snacks"].includes(normalizedMeal)) {
    return candidateMealPlan;
  }

  const merged: { [day: string]: DailyMealPlan } = {};
  for (const day of DAYS) {
    const current = baseMealPlan[day] ?? {};
    merged[day] = {
      Breakfast: current.Breakfast ?? current.breakfast,
      Lunch: current.Lunch ?? current.lunch,
      Dinner: current.Dinner ?? current.dinner,
      Snacks: current.Snacks ?? current.snacks,
    };
  }

  const swapSourceDay = candidateMealPlan[candidateDay] ?? {};
  const nextDay = merged[dayKey] ?? {};
  if (normalizedMeal === "breakfast") {
    nextDay.Breakfast = swapSourceDay.Breakfast ?? swapSourceDay.breakfast;
  }
  if (normalizedMeal === "lunch") {
    nextDay.Lunch = swapSourceDay.Lunch ?? swapSourceDay.lunch;
  }
  if (normalizedMeal === "dinner") {
    nextDay.Dinner = swapSourceDay.Dinner ?? swapSourceDay.dinner;
  }
  if (normalizedMeal === "snacks") {
    nextDay.Snacks = swapSourceDay.Snacks ?? swapSourceDay.snacks;
  }

  merged[dayKey] = nextDay;
  return merged;
}

function normalizeInputForCompare(input: MealPlanRequest) {
  return {
    dietType: (input.dietType ?? "").trim(),
    calories: asCalories(input.calories),
    allergies: (input.allergies ?? "").trim(),
    cuisine: (input.cuisine ?? "").trim(),
    snacks: Boolean(input.snacks),
    servingCount: normalizeServingCount(input.servingCount),
  };
}

function normalizeWeeklyMealPlanForCompare(weeklyPlan: {
  [day: string]: DailyMealPlan;
}) {
  return DAYS.map((dayName) => {
    const day = normalizeDayMealPlan(weeklyPlan[dayName] ?? {});
    return {
      dayName,
      breakfast: (day.breakfast ?? "").trim(),
      lunch: (day.lunch ?? "").trim(),
      dinner: (day.dinner ?? "").trim(),
      snacks: (day.snacks ?? "").trim(),
    };
  });
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
  servingCount,
}: {
  userId: string;
  input: MealPlanRequest;
  mealPlan: { [day: string]: DailyMealPlan };
  source: "provider" | "fallback";
  warning?: string;
  servingCount?: number;
}): Promise<string | null> {
  const normalizedServingCount = normalizeServingCount(servingCount);
  const days = normalizeWeeklyMealPlanForDb(mealPlan);
  if (days.length === 0) return null;

  const latest = await prisma.mealPlan.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      days: {
        orderBy: { dayOrder: "asc" },
        include: { items: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (latest) {
    const latestInput = normalizeInputForCompare({
      dietType: latest.dietType ?? undefined,
      calories: latest.calories ?? undefined,
      allergies: latest.allergies ?? undefined,
      cuisine: latest.cuisine ?? undefined,
      snacks: latest.snacks,
      servingCount: latest.servingCount ?? 1,
    });
    const nextInput = normalizeInputForCompare(input);

    const latestPlanForCompare = normalizeWeeklyMealPlanForCompare(
      buildWeeklyMealPlanFromDb(latest.days)
    );
    const nextPlanForCompare = normalizeWeeklyMealPlanForCompare(mealPlan);

    const sameInput =
      JSON.stringify(latestInput) === JSON.stringify(nextInput);
    const samePlan =
      JSON.stringify(latestPlanForCompare) ===
      JSON.stringify(nextPlanForCompare);
    const sameSource = (latest.source ?? "provider") === source;

    if (sameInput && samePlan && sameSource) {
      return latest.id;
    }
  }

  const created = await prisma.mealPlan.create({
    data: {
      userId,
      dietType: input.dietType ?? null,
      calories: asCalories(input.calories),
      allergies: input.allergies ?? null,
      cuisine: input.cuisine ?? null,
      snacks: Boolean(input.snacks),
      servingCount: normalizedServingCount,
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
  return created.id;
}

async function safePersistMealPlan(
  args: Parameters<typeof persistMealPlan>[0]
): Promise<string | null> {
  try {
    return await persistMealPlan(args);
  } catch (error) {
    console.error("Error persisting meal plan:", error);
    return null;
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
      id: latest.id,
      mealPlan: buildWeeklyMealPlanFromDb(latest.days),
      source: latest.source ?? "provider",
      warning: latest.warning ?? undefined,
      createdAt: latest.createdAt,
      servingCount: latest.servingCount ?? 1,
      dietType: latest.dietType ?? "",
      calories: latest.calories ?? 2000,
      allergies: latest.allergies ?? "",
      cuisine: latest.cuisine ?? "",
      snacks: latest.snacks ?? false,
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
      servingCount = 1,
      swapDay,
      swapMealType,
      baseMealPlan,
    } = input;

    const fallbackPlan = buildFallbackMealPlan({
      dietType,
      calories,
      allergies,
      cuisine,
      snacks,
    });
    const fallbackFinalPlan = applySwapToWeeklyPlan({
      baseMealPlan,
      candidateMealPlan: fallbackPlan,
      swapDay,
      swapMealType,
    });

    let savedPlanId: string | null = null;

    if (AI_PROVIDER === "openai" && !OPENAI_API_KEY) {
      if (userId) {
        savedPlanId = await safePersistMealPlan({
          userId,
          input,
          mealPlan: fallbackFinalPlan,
          source: "fallback",
          warning:
            "Missing OpenAI API key. Returned a locally generated meal plan.",
          servingCount,
        });
      }
      return NextResponse.json({
        id: savedPlanId ?? undefined,
        mealPlan: fallbackFinalPlan,
        source: "fallback",
        warning:
          "Missing OpenAI API key. Returned a locally generated meal plan.",
      });
    }
    if (AI_PROVIDER === "openrouter" && !OPENROUTER_API_KEY) {
      if (userId) {
        savedPlanId = await safePersistMealPlan({
          userId,
          input,
          mealPlan: fallbackFinalPlan,
          source: "fallback",
          warning:
            "Missing OpenRouter API key. Returned a locally generated meal plan.",
          servingCount,
        });
      }
      return NextResponse.json({
        id: savedPlanId ?? undefined,
        mealPlan: fallbackFinalPlan,
        source: "fallback",
        warning:
          "Missing OpenRouter API key. Returned a locally generated meal plan.",
      });
    }

    const openai =
      AI_PROVIDER === "openai"
        ? createOpenAIClient(OPENAI_API_KEY as string)
        : createOpenRouterClient(OPENROUTER_API_KEY as string);

    const prompt = `
      You are a professional nutritionist. Create a 7-day meal plan for a household of ${normalizeServingCount(servingCount)} serving(s) following a ${dietType} diet aiming for ${calories} calories per person per day.
      
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
          console.error(
            `AI provider request failed (${AI_PROVIDER})`,
            JSON.stringify({
              model,
              attempt,
              status: status ?? null,
              message,
            })
          );
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
      console.error(
        `AI provider: all models failed (${AI_PROVIDER})`,
        JSON.stringify({
          lastProviderStatus: lastProviderStatus ?? null,
          lastProviderMessage,
          modelsTried: MODELS,
        })
      );
      const userWarning = toUserWarning(lastProviderStatus, lastProviderMessage);
      if (userId) {
        savedPlanId = await safePersistMealPlan({
          userId,
          input,
          mealPlan: fallbackFinalPlan,
          source: "fallback",
          warning: userWarning,
          servingCount,
        });
      }
      return NextResponse.json(
        {
          id: savedPlanId ?? undefined,
          mealPlan: fallbackFinalPlan,
          source: "fallback",
          warning: userWarning,
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
        savedPlanId = await safePersistMealPlan({
          userId,
          input,
          mealPlan: fallbackFinalPlan,
          source: "fallback",
          warning:
            "Provider returned invalid JSON. Returned a locally generated meal plan.",
          servingCount,
        });
      }
      return NextResponse.json(
        {
          id: savedPlanId ?? undefined,
          mealPlan: fallbackFinalPlan,
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

    const finalPlan = applySwapToWeeklyPlan({
      baseMealPlan,
      candidateMealPlan: parsedMealPlan,
      swapDay,
      swapMealType,
    });

    if (userId) {
      savedPlanId = await safePersistMealPlan({
        userId,
        input,
        mealPlan: finalPlan,
        source: "provider",
        servingCount,
      });
    }

    return NextResponse.json({
      id: savedPlanId ?? undefined,
      mealPlan: finalPlan,
      source: "provider",
    });
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
        servingCount: 1,
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
