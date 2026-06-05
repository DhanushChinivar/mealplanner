interface DbMealItem {
  mealType: string;
  description: string;
  name?: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  fiber?: number | null;
  prepTime?: number | null;
  ingredients?: Array<{
    name: string;
    amount: number;
    unit: string;
    category: string;
  }>;
}

interface StructuredMeal {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  prepTime: number;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    category: string;
  }>;
}

interface DailyMealPlan {
  Breakfast?: StructuredMeal;
  Lunch?: StructuredMeal;
  Dinner?: StructuredMeal;
  Snacks?: StructuredMeal;
}

function toStructuredMeal(item: DbMealItem): StructuredMeal {
  return {
    name: item.name ?? item.description.split(",")[0] ?? item.description,
    description: item.description,
    calories: item.calories ?? 0,
    protein: item.protein ?? 0,
    carbs: item.carbs ?? 0,
    fats: item.fats ?? 0,
    fiber: item.fiber ?? 0,
    prepTime: item.prepTime ?? 0,
    ingredients: item.ingredients ?? [],
  };
}

export function buildWeeklyMealPlanFromDb(
  days: Array<{
    dayName: string;
    items: Array<DbMealItem>;
  }>
): { [day: string]: DailyMealPlan } {
  const mealPlan: { [day: string]: DailyMealPlan } = {};

  for (const day of days) {
    const daily: DailyMealPlan = {};
    for (const item of day.items) {
      const key = item.mealType.toLowerCase();
      if (key === "breakfast") daily.Breakfast = toStructuredMeal(item);
      if (key === "lunch") daily.Lunch = toStructuredMeal(item);
      if (key === "dinner") daily.Dinner = toStructuredMeal(item);
      if (key === "snacks" || key === "snack") daily.Snacks = toStructuredMeal(item);
    }
    mealPlan[day.dayName] = daily;
  }

  return mealPlan;
}
