// components/MealPlanDashboard.tsx
"use client";

import Image from "next/image";
import { useState, useEffect, type ElementType, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Utensils,
  Flame,
  Leaf,
  Coffee,
  Sun,
  Moon,
  Cookie,
  ChefHat,
  Sparkles,
  RefreshCw,
  Target,
  TrendingUp,
  Apple,
  Beef,
  Wheat,
  Droplets,
  Clock,
  Calendar,
  ChevronDown,
  ChevronRight,
  Zap,
  Heart,
  AlertCircle,
  Check,
  Salad,
  Fish,
  Loader2,
} from "lucide-react";

interface DailyMealPlan {
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snacks?: string;
  Breakfast?: string;
  Lunch?: string;
  Dinner?: string;
  Snacks?: string;
}

interface WeeklyMealPlan {
  [day: string]: DailyMealPlan;
}

interface MealPlanResponse {
  mealPlan?: WeeklyMealPlan;
  error?: string;
}

interface MealPlanInput {
  dietType: string;
  calories: number;
  allergies: string;
  cuisine: string;
  snacks: boolean;
  days?: number;
}

// Larger SVG Pie Chart for Macros
const MacroPieChart = ({ protein = 30, carbs = 45, fats = 25 }: { protein?: number; carbs?: number; fats?: number }) => {
  const total = protein + carbs + fats;
  const proteinAngle = (protein / total) * 360;
  const carbsAngle = (carbs / total) * 360;
  const fatsAngle = (fats / total) * 360;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const proteinPercent = protein / total;
  const carbsPercent = carbs / total;

  const [proteinX, proteinY] = getCoordinatesForPercent(0);
  const [proteinEndX, proteinEndY] = getCoordinatesForPercent(proteinPercent);
  const [carbsEndX, carbsEndY] = getCoordinatesForPercent(proteinPercent + carbsPercent);

  return (
    <div className="relative">
      <svg viewBox="-1 -1 2 2" className="w-44 h-44 transform -rotate-90">
        <path
          d={`M 0 0 L ${proteinX} ${proteinY} A 1 1 0 ${proteinAngle > 180 ? 1 : 0} 1 ${proteinEndX} ${proteinEndY} Z`}
          fill="#ef4444"
          className="drop-shadow-md"
        />
        <path
          d={`M 0 0 L ${proteinEndX} ${proteinEndY} A 1 1 0 ${carbsAngle > 180 ? 1 : 0} 1 ${carbsEndX} ${carbsEndY} Z`}
          fill="#f59e0b"
          className="drop-shadow-md"
        />
        <path
          d={`M 0 0 L ${carbsEndX} ${carbsEndY} A 1 1 0 ${fatsAngle > 180 ? 1 : 0} 1 ${proteinX} ${proteinY} Z`}
          fill="#22c55e"
          className="drop-shadow-md"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 bg-white rounded-full shadow-inner flex items-center justify-center">
          <Flame className="w-8 h-8 text-orange-500" />
        </div>
      </div>
    </div>
  );
};

// Calorie Progress Bar
const CalorieProgressBar = ({ current, goal }: { current: number; goal: number }) => {
  const percentage = Math.min((current / goal) * 100, 100);
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-base">
        <span className="text-gray-600 font-medium">Daily Progress</span>
        <span className="font-bold text-emerald-600">{current} / {goal} kcal</span>
      </div>
      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Toggle Button Component
const ToggleButton = ({ 
  active, 
  onClick, 
  icon: Icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: ElementType; 
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
      active 
        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105" 
        : "bg-white/60 text-gray-600 hover:bg-white hover:shadow-md"
    }`}
  >
    <Icon className="w-5 h-5" />
    {label}
  </button>
);

// Meal Card Component
const MealCard = ({ 
  type, 
  meal, 
  icon: Icon, 
  gradient,
  onRegenerate 
}: { 
  type: string; 
  meal?: string; 
  icon: ElementType; 
  gradient: string;
  onRegenerate?: () => void;
}) => {
  const estimatedCalories = meal ? Math.floor(300 + Math.random() * 400) : 0;
  const prepTime = meal ? Math.floor(15 + Math.random() * 30) : 0;

  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/50">
      <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${gradient} bg-opacity-10`}>
              <Icon className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="font-semibold text-gray-800 text-lg">{type}</h4>
          </div>
          {meal && onRegenerate && (
            <button 
              onClick={onRegenerate}
              className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-100 rounded-lg transition-all duration-300"
              title="Regenerate this meal"
            >
              <RefreshCw className="w-5 h-5 text-gray-400 hover:text-emerald-500" />
            </button>
          )}
        </div>
        
        {meal ? (
          <>
            <p className="text-gray-700 mb-4 text-base leading-relaxed">{meal}</p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                ~{estimatedCalories} kcal
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                {prepTime} min
              </span>
            </div>
          </>
        ) : (
          <p className="text-gray-400 italic text-base">No meal planned</p>
        )}
      </div>
    </div>
  );
};

// AI Loading Animation
const AILoadingAnimation = () => {
  const [tipIndex, setTipIndex] = useState(0);
  const tips = [
    "Analyzing your nutritional goals...",
    "Balancing macronutrients...",
    "Optimizing meal variety...",
    "Considering your preferences...",
    "Crafting delicious combinations...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-10">
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 animate-pulse flex items-center justify-center">
          <ChefHat className="w-16 h-16 text-white" />
        </div>
        <div className="absolute -inset-6 rounded-full border-4 border-emerald-200 animate-spin border-t-emerald-500" />
        <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-yellow-400 animate-bounce" />
      </div>
      
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-semibold text-gray-800">AI Chef at Work</h3>
        <p className="text-emerald-600 animate-pulse transition-all duration-500 text-lg">
          {tips[tipIndex]}
        </p>
      </div>
      
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
};

// Day Card Component
const DayCard = ({ 
  day, 
  mealPlan, 
  isToday, 
  isExpanded, 
  onToggle 
}: { 
  day: string; 
  mealPlan?: DailyMealPlan; 
  isToday: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <div 
    className={`bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 border ${
      isToday ? "border-emerald-300 shadow-lg shadow-emerald-100" : "border-white/50 shadow-sm hover:shadow-md"
    }`}
  >
    <button
      onClick={onToggle}
      className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${isToday ? "bg-emerald-100" : "bg-gray-100"}`}>
          <Calendar className={`w-6 h-6 ${isToday ? "text-emerald-600" : "text-gray-500"}`} />
        </div>
        <div className="text-left">
          <h3 className={`font-semibold text-lg ${isToday ? "text-emerald-700" : "text-gray-800"}`}>
            {day}
            {isToday && <span className="ml-3 text-xs bg-emerald-500 text-white px-3 py-1 rounded-full">Today</span>}
          </h3>
          {mealPlan && !isExpanded && (
            <p className="text-sm text-gray-500 truncate max-w-xs mt-1">
              {mealPlan.breakfast?.split(',')[0]}...
            </p>
          )}
        </div>
      </div>
      <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
    </button>
    
    {isExpanded && mealPlan && (
      <div className="px-5 pb-5 grid gap-4 animate-in slide-in-from-top-2 duration-300">
        <MealCard type="Breakfast" meal={mealPlan.breakfast} icon={Coffee} gradient="bg-gradient-to-br from-amber-400 to-orange-500" />
        <MealCard type="Lunch" meal={mealPlan.lunch} icon={Sun} gradient="bg-gradient-to-br from-emerald-400 to-teal-500" />
        <MealCard type="Dinner" meal={mealPlan.dinner} icon={Moon} gradient="bg-gradient-to-br from-indigo-400 to-purple-500" />
        {mealPlan.snacks && (
          <MealCard type="Snacks" meal={mealPlan.snacks} icon={Cookie} gradient="bg-gradient-to-br from-pink-400 to-rose-500" />
        )}
      </div>
    )}
  </div>
);

export default function MealPlanDashboard() {
  const [dietType, setDietType] = useState("");
  const [calories, setCalories] = useState<number>(2000);
  const [allergies, setAllergies] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [snacks, setSnacks] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("weekly");

  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isHighProtein, setIsHighProtein] = useState(false);
  const [isLowCarb, setIsLowCarb] = useState(false);

  const mutation = useMutation<MealPlanResponse, Error, MealPlanInput>({
    mutationFn: async (payload: MealPlanInput) => {
      const response = await fetch("/api/generate-mealplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: MealPlanResponse = await response.json();
        throw new Error(errorData.error || "Failed to generate meal plan.");
      }

      return response.json();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const dietTypes = [];
    if (isVegetarian) dietTypes.push("Vegetarian");
    if (isHighProtein) dietTypes.push("High-Protein");
    if (isLowCarb) dietTypes.push("Low-Carb");
    const finalDietType = dietTypes.length > 0 ? dietTypes.join(", ") : dietType || "Balanced";

    const payload: MealPlanInput = {
      dietType: finalDietType,
      calories,
      allergies,
      cuisine,
      snacks,
      days: 7,
    };

    mutation.mutate(payload);
  };

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = daysOfWeek[new Date().getDay()];

  const normalizeMeals = (plan?: DailyMealPlan): DailyMealPlan | undefined => {
    if (!plan) return undefined;
    const breakfast = plan.breakfast ?? plan.Breakfast;
    const lunch = plan.lunch ?? plan.Lunch;
    const dinner = plan.dinner ?? plan.Dinner;
    const snacksValue = plan.snacks ?? plan.Snacks;

    if (!breakfast && !lunch && !dinner && !snacksValue) return undefined;
    return { breakfast, lunch, dinner, snacks: snacksValue };
  };

  const getMealPlanForDay = (day: string): DailyMealPlan | undefined => {
    if (!mutation.data?.mealPlan) return undefined;
    return normalizeMeals(mutation.data.mealPlan[day]);
  };

  const todaysMealPlan = getMealPlanForDay(today);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pt-20">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* View Mode Toggle - Only show when meal plan exists */}
        {mutation.isSuccess && (
          <div className="flex justify-end mb-6">
            <div className="flex items-center gap-2 bg-white/80 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode("daily")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "daily" ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setViewMode("weekly")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "weekly" ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                Weekly
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-10">
          {/* Left Sidebar - Controls */}
          <aside className="lg:col-span-5 space-y-8">
            {/* Quick Stats Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-white/50">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-bold text-xl text-gray-800">Daily Goals</h2>
              </div>

              <div className="space-y-8">
                <CalorieProgressBar current={calories * 0.75} goal={calories} />

                <div className="flex items-center justify-center py-4">
                  <MacroPieChart protein={30} carbs={45} fats={25} />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-5 bg-red-50 rounded-2xl">
                    <Beef className="w-7 h-7 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Protein</p>
                    <p className="font-bold text-xl text-red-600">30%</p>
                  </div>
                  <div className="p-5 bg-amber-50 rounded-2xl">
                    <Wheat className="w-7 h-7 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Carbs</p>
                    <p className="font-bold text-xl text-amber-600">45%</p>
                  </div>
                  <div className="p-5 bg-green-50 rounded-2xl">
                    <Droplets className="w-7 h-7 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Fats</p>
                    <p className="font-bold text-xl text-green-600">25%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Form Card */}
            <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-white/50 space-y-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-bold text-xl text-gray-800">Preferences</h2>
              </div>

              {/* Diet Toggles */}
              <div className="space-y-4">
                <label className="text-base font-medium text-gray-700 flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-emerald-500" />
                  Diet Style
                </label>
                <div className="flex flex-wrap gap-3">
                  <ToggleButton active={isVegetarian} onClick={() => setIsVegetarian(!isVegetarian)} icon={Salad} label="Vegetarian" />
                  <ToggleButton active={isHighProtein} onClick={() => setIsHighProtein(!isHighProtein)} icon={Beef} label="High Protein" />
                  <ToggleButton active={isLowCarb} onClick={() => setIsLowCarb(!isLowCarb)} icon={Zap} label="Low Carb" />
                </div>
              </div>

              {/* Calorie Slider */}
              <div className="space-y-4">
                <label className="text-base font-medium text-gray-700 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Daily Calories: <span className="text-emerald-600 font-bold text-lg">{calories} kcal</span>
                </label>
                <input
                  type="range"
                  min={1200}
                  max={4000}
                  step={50}
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>1200</span>
                  <span>4000</span>
                </div>
              </div>

              {/* Cuisine Input */}
              <div className="space-y-3">
                <label className="text-base font-medium text-gray-700 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-purple-500" />
                  Preferred Cuisine
                </label>
                <input
                  type="text"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-base"
                  placeholder="e.g., Italian, Asian, Mediterranean"
                />
              </div>

              {/* Allergies Input */}
              <div className="space-y-3">
                <label className="text-base font-medium text-gray-700 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Allergies / Restrictions
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-base"
                  placeholder="e.g., Nuts, Dairy, Gluten"
                />
              </div>

              {/* Snacks Toggle */}
              <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <Cookie className="w-6 h-6 text-amber-500" />
                  <span className="text-base font-medium text-gray-700">Include Snacks</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSnacks(!snacks)}
                  className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                    snacks ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <span 
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                      snacks ? "translate-x-8" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Generate Meal Plan
                  </>
                )}
              </button>

              {mutation.isError && (
                <div className="p-5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-4">
                  <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <p className="text-base text-red-700">{mutation.error?.message || "An error occurred."}</p>
                </div>
              )}
            </form>
          </aside>

          {/* Main Content - Meal Plan */}
          <section className="lg:col-span-7">
            {mutation.isPending ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/50 border border-white/50">
                <AILoadingAnimation />
              </div>
            ) : mutation.isSuccess && mutation.data.mealPlan ? (
              <div className="space-y-8">
                {/* Today's Highlight */}
                {todaysMealPlan && viewMode === "weekly" && (
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-500/30">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Zap className="w-6 h-6" />
                      </div>
                      <h2 className="text-xl font-bold">Today's Highlights</h2>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-5">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Coffee className="w-5 h-5" />
                          <span className="text-sm opacity-80">Breakfast</span>
                        </div>
                        <p className="font-medium">{todaysMealPlan.breakfast}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Sun className="w-5 h-5" />
                          <span className="text-sm opacity-80">Lunch</span>
                        </div>
                        <p className="font-medium">{todaysMealPlan.lunch}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Moon className="w-5 h-5" />
                          <span className="text-sm opacity-80">Dinner</span>
                        </div>
                        <p className="font-medium">{todaysMealPlan.dinner}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Weekly Overview */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-white/50">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="font-bold text-xl text-gray-800">Weekly Meal Plan</h2>
                    </div>
                    <button
                      onClick={() => mutation.mutate({
                        dietType: dietType || "Balanced",
                        calories,
                        allergies,
                        cuisine,
                        snacks,
                        days: 7,
                      })}
                      className="flex items-center gap-2 px-5 py-3 text-base font-medium text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Regenerate All
                    </button>
                  </div>

                  <div className="space-y-4">
                    {daysOfWeek.map((day) => (
                      <DayCard
                        key={day}
                        day={day}
                        mealPlan={getMealPlanForDay(day)}
                        isToday={day === today}
                        isExpanded={expandedDay === day}
                        onToggle={() => setExpandedDay(expandedDay === day ? null : day)}
                      />
                    ))}
                  </div>
                </div>

                {/* Nutrition Insight */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-amber-800">Weekly Nutrition Insight</h3>
                      <p className="text-base text-amber-700">
                        {isHighProtein 
                          ? "High protein focus achieved! Great for muscle building and recovery."
                          : isLowCarb
                          ? "Low carb plan optimized for steady energy levels."
                          : isVegetarian
                          ? "Plant-based nutrition with complete protein sources."
                          : "Balanced nutrition plan with optimal macro distribution."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-16 shadow-xl shadow-gray-200/50 border border-white/50 text-center">
                <div className="max-w-lg mx-auto">
                  <div className="w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full mx-auto mb-8 flex items-center justify-center">
                    <Utensils className="w-16 h-16 text-emerald-500" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to Plan Your Week?</h2>
                  <p className="text-gray-500 mb-8 text-lg">
                    Set your preferences on the left and let our AI create a personalized meal plan tailored to your goals.
                  </p>
                  <div className="flex items-center justify-center gap-8 text-base text-gray-400">
                    <span className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-emerald-500" />
                      Personalized meals
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-emerald-500" />
                      Balanced nutrition
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-emerald-500" />
                      Easy to follow
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
