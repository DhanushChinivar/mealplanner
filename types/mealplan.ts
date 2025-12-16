// Meal Plan Types

export interface MacroNutrients {
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  fiber?: number; // grams
  calories: number;
}

export interface Meal {
  id: string;
  name: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  description?: string;
  macros: MacroNutrients;
  ingredients: Ingredient[];
  prepTime?: number; // minutes
  selected?: boolean;
  portionMultiplier?: number; // 1 = normal, 0.5 = half, 2 = double
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category: "produce" | "proteins" | "grains" | "dairy" | "spices" | "other";
}

export interface DailyMealPlan {
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
  snacks?: Meal[];
}

export interface WeeklyMealPlan {
  [day: string]: DailyMealPlan;
}

export interface GroceryItem {
  name: string;
  totalAmount: number;
  unit: string;
  category: Ingredient["category"];
  checked?: boolean;
}

export interface UserPreferences {
  dietType: string;
  calories: number;
  allergies: string;
  cuisine: string;
  snacks: boolean;
  isVegetarian: boolean;
  isHighProtein: boolean;
  isLowCarb: boolean;
}

// Helper to calculate total macros from meals
export function calculateTotalMacros(meals: (Meal | undefined)[]): MacroNutrients {
  const validMeals = meals.filter((m): m is Meal => m !== undefined && m.selected !== false);

  return validMeals.reduce(
    (acc, meal) => {
      const multiplier = meal.portionMultiplier ?? 1;
      return {
        protein: acc.protein + meal.macros.protein * multiplier,
        carbs: acc.carbs + meal.macros.carbs * multiplier,
        fats: acc.fats + meal.macros.fats * multiplier,
        fiber: (acc.fiber ?? 0) + (meal.macros.fiber ?? 0) * multiplier,
        calories: acc.calories + meal.macros.calories * multiplier,
      };
    },
    { protein: 0, carbs: 0, fats: 0, fiber: 0, calories: 0 }
  );
}

// Parse meal string to structured Meal object with estimated macros
export function parseMealToStructured(
  mealString: string,
  type: Meal["type"],
  dayIndex: number,
  mealIndex: number
): Meal {
  // Estimate macros based on meal type and content
  const lower = mealString.toLowerCase();
  const isHighProtein =
    lower.includes("chicken") ||
    lower.includes("fish") ||
    lower.includes("egg") ||
    lower.includes("beef") ||
    lower.includes("tofu");

  const isHighCarb =
    lower.includes("rice") ||
    lower.includes("pasta") ||
    lower.includes("bread") ||
    lower.includes("oat");

  const baseCalories = type === "breakfast" ? 400 : type === "lunch" ? 550 : type === "dinner" ? 650 : 200;
  const variance = Math.random() * 100 - 50;
  const calories = Math.round(baseCalories + variance);

  const proteinPercent = isHighProtein ? 35 : 25;
  const carbPercent = isHighCarb ? 50 : 40;
  const fatPercent = 100 - proteinPercent - carbPercent;

  return {
    id: `${dayIndex}-${type}-${mealIndex}`,
    name: mealString.split(",")[0] || mealString,
    type,
    description: mealString,
    macros: {
      protein: Math.round((calories * proteinPercent) / 100 / 4), // 4 cal per gram protein
      carbs: Math.round((calories * carbPercent) / 100 / 4), // 4 cal per gram carbs
      fats: Math.round((calories * fatPercent) / 100 / 9), // 9 cal per gram fat
      fiber: Math.round(3 + Math.random() * 8),
      calories,
    },
    ingredients: extractIngredients(mealString),
    prepTime: Math.round(15 + Math.random() * 30),
    selected: true,
    portionMultiplier: 1,
  };
}

// Extract ingredients from meal description
function extractIngredients(mealString: string): Ingredient[] {
  const commonIngredients: Record<
    string,
    { unit: string; amount: number; category: Ingredient["category"] }
  > = {
    chicken: { unit: "g", amount: 150, category: "proteins" },
    fish: { unit: "g", amount: 150, category: "proteins" },
    salmon: { unit: "g", amount: 150, category: "proteins" },
    beef: { unit: "g", amount: 150, category: "proteins" },
    tofu: { unit: "g", amount: 200, category: "proteins" },
    egg: { unit: "pcs", amount: 2, category: "proteins" },
    eggs: { unit: "pcs", amount: 2, category: "proteins" },
    rice: { unit: "g", amount: 100, category: "grains" },
    pasta: { unit: "g", amount: 100, category: "grains" },
    bread: { unit: "slices", amount: 2, category: "grains" },
    oats: { unit: "g", amount: 50, category: "grains" },
    quinoa: { unit: "g", amount: 80, category: "grains" },
    milk: { unit: "ml", amount: 200, category: "dairy" },
    cheese: { unit: "g", amount: 30, category: "dairy" },
    yogurt: { unit: "g", amount: 150, category: "dairy" },
    spinach: { unit: "g", amount: 100, category: "produce" },
    broccoli: { unit: "g", amount: 150, category: "produce" },
    tomato: { unit: "pcs", amount: 1, category: "produce" },
    tomatoes: { unit: "pcs", amount: 2, category: "produce" },
    onion: { unit: "pcs", amount: 1, category: "produce" },
    garlic: { unit: "cloves", amount: 2, category: "spices" },
    olive: { unit: "tbsp", amount: 2, category: "other" },
    avocado: { unit: "pcs", amount: 1, category: "produce" },
    banana: { unit: "pcs", amount: 1, category: "produce" },
    apple: { unit: "pcs", amount: 1, category: "produce" },
    berries: { unit: "g", amount: 100, category: "produce" },
    lemon: { unit: "pcs", amount: 1, category: "produce" },
    pepper: { unit: "tsp", amount: 1, category: "spices" },
    salt: { unit: "tsp", amount: 1, category: "spices" },
  };

  const ingredients: Ingredient[] = [];
  const lowerMeal = mealString.toLowerCase();

  for (const [name, details] of Object.entries(commonIngredients)) {
    if (lowerMeal.includes(name)) {
      ingredients.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        amount: details.amount,
        unit: details.unit,
        category: details.category,
      });
    }
  }

  return ingredients;
}

// Aggregate ingredients for grocery list
export function aggregateGroceryList(weeklyPlan: WeeklyMealPlan): GroceryItem[] {
  const aggregated: Record<string, GroceryItem> = {};

  Object.values(weeklyPlan).forEach((day) => {
    const meals = [day.breakfast, day.lunch, day.dinner, ...(day.snacks || [])].filter(Boolean) as Meal[];

    meals.forEach((meal) => {
      meal.ingredients.forEach((ingredient) => {
        const key = `${ingredient.name.toLowerCase()}-${ingredient.unit}`;
        if (aggregated[key]) {
          aggregated[key].totalAmount += ingredient.amount;
        } else {
          aggregated[key] = {
            name: ingredient.name,
            totalAmount: ingredient.amount,
            unit: ingredient.unit,
            category: ingredient.category,
            checked: false,
          };
        }
      });
    });
  });

  return Object.values(aggregated).sort((a, b) => {
    const categoryOrder = ["proteins", "produce", "grains", "dairy", "spices", "other"];
    return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
  });
}
