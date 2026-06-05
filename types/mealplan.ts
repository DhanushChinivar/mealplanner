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

// Parse meal string to structured Meal object with estimated macros (fallback only)
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
  const calories = baseCalories;

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
      fiber: type === "breakfast" ? 5 : type === "lunch" ? 7 : type === "dinner" ? 8 : 3,
      calories,
    },
    ingredients: extractIngredients(mealString),
    prepTime: type === "breakfast" ? 15 : type === "lunch" ? 20 : type === "dinner" ? 30 : 10,
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

