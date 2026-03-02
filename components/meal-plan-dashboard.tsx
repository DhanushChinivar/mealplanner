// components/MealPlanDashboard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, type ElementType, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
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
  source?: "provider" | "fallback" | "none";
  warning?: string;
  createdAt?: string;
}

type MealStatus = "completed" | "skipped";
type MealTypeKey = "breakfast" | "lunch" | "dinner" | "snacks";

interface MealLogResponse {
  statuses?: {
    [dayName: string]: {
      breakfast?: MealStatus;
      lunch?: MealStatus;
      dinner?: MealStatus;
      snacks?: MealStatus;
    };
  };
  summary?: {
    totalMeals: number;
    completedMeals: number;
    skippedMeals: number;
    adherence: number;
  };
  error?: string;
}

interface MealAnalyticsResponse {
  summary?: {
    overallAdherence: number;
    completedMeals: number;
    skippedMeals: number;
    totalMeals: number;
    calorieTargetHitRate: number;
    proteinConsistency: number;
    currentDayStreak: number;
  };
  days?: Array<{
    dayName: string;
    completionRate: number;
    completedMeals: number;
    totalMeals: number;
    plannedCalories: number;
    plannedProtein: number;
  }>;
  heatmap?: Array<{
    dayName: string;
    breakfast: "completed" | "skipped" | "pending";
    lunch: "completed" | "skipped" | "pending";
    dinner: "completed" | "skipped" | "pending";
    snacks: "completed" | "skipped" | "pending";
  }>;
  warning?: string;
  error?: string;
}

interface TrialStatusResponse {
  subscriptionActive?: boolean;
  hasAccess?: boolean;
  onTrial?: boolean;
  trialRemainingDays?: number;
  trialExpired?: boolean;
  message?: string;
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
  onRegenerate,
  mealStatus,
  onSetStatus,
}: { 
  type: string; 
  meal?: string; 
  icon: ElementType; 
  gradient: string;
  onRegenerate?: () => void;
  mealStatus?: "completed" | "skipped";
  onSetStatus?: (status: "completed" | "skipped" | "pending") => void;
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
          <div className="flex items-center gap-2">
            {meal && onSetStatus && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    onSetStatus(mealStatus === "completed" ? "pending" : "completed")
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    mealStatus === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {mealStatus === "completed" ? "Completed" : "Mark done"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSetStatus(mealStatus === "skipped" ? "pending" : "skipped")
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    mealStatus === "skipped"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {mealStatus === "skipped" ? "Skipped" : "Skip"}
                </button>
              </>
            )}
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
  onToggle,
  mealStatuses,
  onSetMealStatus,
}: { 
  day: string; 
  mealPlan?: DailyMealPlan; 
  isToday: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  mealStatuses?: {
    breakfast?: MealStatus;
    lunch?: MealStatus;
    dinner?: MealStatus;
    snacks?: MealStatus;
  };
  onSetMealStatus?: (
    mealType: MealTypeKey,
    status: "completed" | "skipped" | "pending"
  ) => void;
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
        <MealCard
          type="Breakfast"
          meal={mealPlan.breakfast}
          icon={Coffee}
          gradient="bg-gradient-to-br from-amber-400 to-orange-500"
          mealStatus={mealStatuses?.breakfast}
          onSetStatus={
            onSetMealStatus
              ? (status) => onSetMealStatus("breakfast", status)
              : undefined
          }
        />
        <MealCard
          type="Lunch"
          meal={mealPlan.lunch}
          icon={Sun}
          gradient="bg-gradient-to-br from-emerald-400 to-teal-500"
          mealStatus={mealStatuses?.lunch}
          onSetStatus={
            onSetMealStatus
              ? (status) => onSetMealStatus("lunch", status)
              : undefined
          }
        />
        <MealCard
          type="Dinner"
          meal={mealPlan.dinner}
          icon={Moon}
          gradient="bg-gradient-to-br from-indigo-400 to-purple-500"
          mealStatus={mealStatuses?.dinner}
          onSetStatus={
            onSetMealStatus
              ? (status) => onSetMealStatus("dinner", status)
              : undefined
          }
        />
        {mealPlan.snacks && (
          <MealCard
            type="Snacks"
            meal={mealPlan.snacks}
            icon={Cookie}
            gradient="bg-gradient-to-br from-pink-400 to-rose-500"
            mealStatus={mealStatuses?.snacks}
            onSetStatus={
              onSetMealStatus
                ? (status) => onSetMealStatus("snacks", status)
                : undefined
            }
          />
        )}
      </div>
    )}
  </div>
);

export default function MealPlanDashboard() {
  const { user } = useUser();
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
  const [initialPlan, setInitialPlan] = useState<MealPlanResponse | null>(null);
  const [isLoadingInitialPlan, setIsLoadingInitialPlan] = useState(true);
  const [mealStatuses, setMealStatuses] = useState<
    NonNullable<MealLogResponse["statuses"]>
  >({});
  const [adherenceSummary, setAdherenceSummary] = useState<
    NonNullable<MealLogResponse["summary"]>
  >({
    totalMeals: 0,
    completedMeals: 0,
    skippedMeals: 0,
    adherence: 0,
  });
  const [analyticsSummary, setAnalyticsSummary] = useState<
    NonNullable<MealAnalyticsResponse["summary"]>
  >({
    overallAdherence: 0,
    completedMeals: 0,
    skippedMeals: 0,
    totalMeals: 0,
    calorieTargetHitRate: 0,
    proteinConsistency: 0,
    currentDayStreak: 0,
  });
  const [analyticsHeatmap, setAnalyticsHeatmap] = useState<
    NonNullable<MealAnalyticsResponse["heatmap"]>
  >([]);
  const [trialRemainingDays, setTrialRemainingDays] = useState<number | null>(null);
  const [isOnTrial, setIsOnTrial] = useState(false);
  const [trialMessage, setTrialMessage] = useState<string | null>(null);

  const fetchTrialStatus = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(
        `/api/check-subscription?userId=${encodeURIComponent(user.id)}`,
        { method: "GET" }
      );
      if (!response.ok) return;
      const data: TrialStatusResponse = await response.json();
      setIsOnTrial(Boolean(data.onTrial));
      setTrialRemainingDays(
        typeof data.trialRemainingDays === "number" ? data.trialRemainingDays : null
      );
      setTrialMessage(data.message ?? null);
    } catch (error) {
      console.error("Failed to fetch trial status:", error);
    }
  };

  const fetchMealAnalytics = async () => {
    try {
      const response = await fetch("/api/meal-analytics", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) return;
      const data: MealAnalyticsResponse = await response.json();
      setAnalyticsSummary(
        data.summary ?? {
          overallAdherence: 0,
          completedMeals: 0,
          skippedMeals: 0,
          totalMeals: 0,
          calorieTargetHitRate: 0,
          proteinConsistency: 0,
          currentDayStreak: 0,
        }
      );
      setAnalyticsHeatmap(data.heatmap ?? []);
    } catch (error) {
      console.error("Failed to fetch meal analytics:", error);
    }
  };

  const fetchMealLogs = async () => {
    try {
      const response = await fetch("/api/meal-log", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) return;
      const data: MealLogResponse = await response.json();
      setMealStatuses(data.statuses ?? {});
      setAdherenceSummary(
        data.summary ?? {
          totalMeals: 0,
          completedMeals: 0,
          skippedMeals: 0,
          adherence: 0,
        }
      );
    } catch (error) {
      console.error("Failed to fetch meal logs:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchLatestPlan = async () => {
      try {
        const response = await fetch("/api/generate-mealplan", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) return;
        const data: MealPlanResponse = await response.json();
        if (!isMounted) return;
        if (data?.mealPlan) {
          setInitialPlan(data);
        }
      } catch (error) {
        console.error("Failed to load latest meal plan:", error);
      } finally {
        if (isMounted) setIsLoadingInitialPlan(false);
      }
    };

    fetchLatestPlan();

    return () => {
      isMounted = false;
    };
  }, []);

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
    onSuccess: async () => {
      await fetchMealLogs();
      await fetchMealAnalytics();
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
  const activePlanData = mutation.data ?? initialPlan;
  const hasMealPlan = Boolean(activePlanData?.mealPlan);

  useEffect(() => {
    if (!hasMealPlan) return;
    fetchMealLogs();
    fetchMealAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMealPlan]);

  useEffect(() => {
    fetchTrialStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
    if (!activePlanData?.mealPlan) return undefined;
    return normalizeMeals(activePlanData.mealPlan[day]);
  };

  const handleSetMealStatus = async (
    dayName: string,
    mealType: MealTypeKey,
    status: "completed" | "skipped" | "pending"
  ) => {
    try {
      const response = await fetch("/api/meal-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayName,
          mealType,
          status,
        }),
      });
      if (!response.ok) return;
      const data: MealLogResponse = await response.json();
      setMealStatuses(data.statuses ?? {});
      setAdherenceSummary(
        data.summary ?? {
          totalMeals: 0,
          completedMeals: 0,
          skippedMeals: 0,
          adherence: 0,
        }
      );
      await fetchMealAnalytics();
    } catch (error) {
      console.error("Failed to update meal status:", error);
    }
  };

  const todaysMealPlan = getMealPlanForDay(today);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pt-20">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {isOnTrial && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm sm:text-base font-semibold text-emerald-800">
                  Free Trial Active: {trialRemainingDays ?? 0} day
                  {(trialRemainingDays ?? 0) === 1 ? "" : "s"} remaining.
                </p>
                <p className="text-sm text-emerald-700 mt-1">
                  {trialMessage || "After 7 days, subscribe to keep full access."}
                </p>
              </div>
              <Link
                href="/subscribe"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Upgrade Plan
              </Link>
            </div>
          </div>
        )}
        {/* View Mode Toggle - Only show when meal plan exists */}
        {hasMealPlan && (
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
                {hasMealPlan && (
                  <div className="rounded-2xl p-4 bg-emerald-50 border border-emerald-100">
                    <p className="text-sm font-medium text-emerald-700">
                      Adherence: {adherenceSummary.adherence}%
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      {adherenceSummary.completedMeals} of {adherenceSummary.totalMeals} meals completed
                    </p>
                  </div>
                )}
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
            {mutation.isPending || isLoadingInitialPlan ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/50 border border-white/50">
                <AILoadingAnimation />
              </div>
            ) : hasMealPlan ? (
              <div className="space-y-8">
                {activePlanData?.warning && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                    {activePlanData.warning}
                  </div>
                )}
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
                        mealStatuses={mealStatuses[day]}
                        onSetMealStatus={(mealType, status) =>
                          handleSetMealStatus(day, mealType, status)
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Weekly Analytics */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-lg text-amber-800">Weekly Analytics</h3>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-white/80 border border-amber-100 p-3">
                      <p className="text-xs text-gray-500">Adherence</p>
                      <p className="text-xl font-bold text-amber-700">{analyticsSummary.overallAdherence}%</p>
                    </div>
                    <div className="rounded-xl bg-white/80 border border-amber-100 p-3">
                      <p className="text-xs text-gray-500">Calorie Target Hit</p>
                      <p className="text-xl font-bold text-amber-700">{analyticsSummary.calorieTargetHitRate}%</p>
                    </div>
                    <div className="rounded-xl bg-white/80 border border-amber-100 p-3">
                      <p className="text-xs text-gray-500">Protein Consistency</p>
                      <p className="text-xl font-bold text-amber-700">{analyticsSummary.proteinConsistency}%</p>
                    </div>
                    <div className="rounded-xl bg-white/80 border border-amber-100 p-3">
                      <p className="text-xs text-gray-500">Current Streak</p>
                      <p className="text-xl font-bold text-amber-700">{analyticsSummary.currentDayStreak} days</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-amber-800 mb-2">Completion Heatmap</p>
                    <div className="space-y-2">
                      {analyticsHeatmap.length === 0 ? (
                        <p className="text-sm text-amber-700">No analytics data yet.</p>
                      ) : (
                        analyticsHeatmap.map((day) => {
                          const slots = [
                            day.breakfast,
                            day.lunch,
                            day.dinner,
                            day.snacks,
                          ];
                          return (
                            <div key={day.dayName} className="flex items-center gap-3">
                              <span className="w-24 text-sm text-amber-900">{day.dayName.slice(0, 3)}</span>
                              <div className="flex gap-2">
                                {slots.map((slot, index) => (
                                  <span
                                    key={`${day.dayName}-${index}`}
                                    className={`w-5 h-5 rounded-md border ${
                                      slot === "completed"
                                        ? "bg-emerald-400 border-emerald-500"
                                        : slot === "skipped"
                                        ? "bg-amber-300 border-amber-400"
                                        : "bg-gray-200 border-gray-300"
                                    }`}
                                    title={slot}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })
                      )}
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
