interface DailyMealPlan {
  Breakfast?: string;
  Lunch?: string;
  Dinner?: string;
  Snacks?: string;
}

export function buildWeeklyMealPlanFromDb(
  days: Array<{
    dayName: string;
    items: Array<{ mealType: string; description: string }>;
  }>
): { [day: string]: DailyMealPlan } {
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
