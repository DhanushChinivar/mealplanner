// components/MealPlanDashboard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, type ElementType, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import GroceryList from "@/components/meal-plan/grocery-list";
import type { GroceryItem } from "@/types/mealplan";
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
  ShoppingCart,
  History,
  LayoutPanelLeft,
  Users,
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
  id?: string;
  servingCount?: number;
}

interface MealPlanHistoryItem {
  id: string;
  createdAt: string;
  source?: "provider" | "fallback";
  warning?: string;
  dietType?: string | null;
  calories?: number | null;
  servingCount?: number | null;
}

interface MealPlanHistoryResponse {
  plans?: MealPlanHistoryItem[];
  selected?: MealPlanResponse;
  error?: string;
}

interface ProgressBucket {
  plansGenerated: number;
  totalMeals: number;
  completedMeals: number;
  skippedMeals: number;
  avgAdherence: number;
  calorieTargetHitRate: number;
}

interface MealProgressResponse {
  monthly?: Record<string, ProgressBucket>;
  yearly?: Record<string, ProgressBucket>;
  totals?: { plansGenerated: number };
  error?: string;
}

interface GroceryListResponse {
  items?: GroceryItem[];
  warning?: string;
  error?: string;
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
  servingCount?: number;
  swapDay?: string;
  swapMealType?: MealTypeKey;
  baseMealPlan?: WeeklyMealPlan;
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
      <svg viewBox="-1 -1 2 2" className="w-52 h-52 transform -rotate-90">
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
        <div className="w-24 h-24 bg-white rounded-full shadow-inner flex items-center justify-center">
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
  onSwapMeal,
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
  onSwapMeal?: (mealType: MealTypeKey) => void;
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
          onRegenerate={onSwapMeal ? () => onSwapMeal("breakfast") : undefined}
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
          onRegenerate={onSwapMeal ? () => onSwapMeal("lunch") : undefined}
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
          onRegenerate={onSwapMeal ? () => onSwapMeal("dinner") : undefined}
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
            onRegenerate={onSwapMeal ? () => onSwapMeal("snacks") : undefined}
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
  const [activeTab, setActiveTab] = useState<"planner" | "history" | "grocery">(
    "planner"
  );
  const [dietType, setDietType] = useState("");
  const [calories, setCalories] = useState<number>(2000);
  const [allergies, setAllergies] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [snacks, setSnacks] = useState(false);
  const [servingCount, setServingCount] = useState<number>(1);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("weekly");

  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isHighProtein, setIsHighProtein] = useState(false);
  const [isLowCarb, setIsLowCarb] = useState(false);
  const [selectedPlanData, setSelectedPlanData] = useState<MealPlanResponse | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<MealPlanHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [groceryWarning, setGroceryWarning] = useState<string | null>(null);
  const [isGroceryLoading, setIsGroceryLoading] = useState(false);
  const [progressSummary, setProgressSummary] = useState<MealProgressResponse | null>(
    null
  );
  const [isProgressLoading, setIsProgressLoading] = useState(false);
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
  const [activePlannerSection, setActivePlannerSection] = useState<
    "plan" | "analytics"
  >("plan");
  const weeklyPlanRef = useRef<HTMLDivElement | null>(null);
  const weeklyAnalyticsRef = useRef<HTMLDivElement | null>(null);

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

  const fetchMealAnalytics = async (planId?: string) => {
    try {
      const params = new URLSearchParams();
      const finalPlanId = planId ?? selectedPlanId;
      if (finalPlanId) params.set("planId", finalPlanId);
      const query = params.toString();
      const response = await fetch(`/api/meal-analytics${query ? `?${query}` : ""}`, {
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

  const fetchMealLogs = async (planId?: string) => {
    try {
      const params = new URLSearchParams();
      const finalPlanId = planId ?? selectedPlanId;
      if (finalPlanId) params.set("planId", finalPlanId);
      const query = params.toString();
      const response = await fetch(`/api/meal-log${query ? `?${query}` : ""}`, {
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

  const fetchMealHistory = async () => {
    try {
      setIsHistoryLoading(true);
      const response = await fetch("/api/mealplans", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) return;
      const data: MealPlanHistoryResponse = await response.json();
      setHistoryItems(data.plans ?? []);
    } catch (error) {
      console.error("Failed to fetch meal plan history:", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const loadHistoryPlan = async (planId: string) => {
    try {
      setIsHistoryLoading(true);
      const response = await fetch(`/api/mealplans?planId=${encodeURIComponent(planId)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) return;
      const data: MealPlanHistoryResponse = await response.json();
      if (data.selected) {
        setSelectedPlanData(data.selected);
        setSelectedPlanId(planId);
        setServingCount(data.selected.servingCount ?? 1);
        await fetchMealLogs(planId);
        await fetchMealAnalytics(planId);
      }
      setHistoryItems(data.plans ?? []);
    } catch (error) {
      console.error("Failed to load selected meal plan:", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const fetchGrocerySync = async () => {
    try {
      setIsGroceryLoading(true);
      const params = new URLSearchParams();
      if (selectedPlanId) params.set("planId", selectedPlanId);
      params.set("servings", String(servingCount));
      const response = await fetch(`/api/grocery-list?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data: GroceryListResponse = await response.json();
      if (!response.ok) return;
      setGroceryItems(data.items ?? []);
      setGroceryWarning(data.warning ?? null);
    } catch (error) {
      console.error("Failed to fetch grocery sync:", error);
    } finally {
      setIsGroceryLoading(false);
    }
  };

  const handleDownloadGroceryPdf = () => {
    if (groceryItems.length === 0) return;

    const grouped = groceryItems.reduce<Record<string, GroceryItem[]>>((acc, item) => {
      const key = item.category || "other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    const categoryLabels: Record<string, string> = {
      proteins: "Proteins",
      produce: "Produce",
      grains: "Grains",
      dairy: "Dairy",
      spices: "Spices",
      other: "Other",
    };

    const sectionHtml = Object.entries(grouped)
      .map(([category, items]) => {
        const itemRows = items
          .map(
            (item) =>
              `<li><span>${item.name}</span><span>${item.totalAmount} ${item.unit}</span></li>`
          )
          .join("");

        return `
          <section>
            <h2>${categoryLabels[category] ?? category}</h2>
            <ul>${itemRows}</ul>
          </section>
        `;
      })
      .join("");

    const createdAt = new Date().toLocaleString();
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>MealPlanner Grocery List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
            h1 { margin: 0 0 6px; color: #047857; }
            p.meta { margin: 0 0 16px; color: #475569; font-size: 12px; }
            section { margin: 14px 0; padding: 12px; border: 1px solid #d1fae5; border-radius: 10px; }
            h2 { margin: 0 0 8px; font-size: 16px; color: #065f46; }
            ul { list-style: none; margin: 0; padding: 0; }
            li { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
            li:last-child { border-bottom: none; }
          </style>
        </head>
        <body>
          <h1>MealPlanner Grocery List</h1>
          <p class="meta">Generated: ${createdAt} • Servings: ${servingCount}</p>
          ${sectionHtml}
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const popup = window.open(blobUrl, "_blank");
    if (!popup) {
      URL.revokeObjectURL(blobUrl);
      return;
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  };

  const fetchProgressSummary = async () => {
    try {
      setIsProgressLoading(true);
      const response = await fetch("/api/meal-progress", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) return;
      const data: MealProgressResponse = await response.json();
      setProgressSummary(data);
    } catch (error) {
      console.error("Failed to fetch progress summary:", error);
    } finally {
      setIsProgressLoading(false);
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
          setSelectedPlanData(data);
          setSelectedPlanId(data.id ?? null);
          setServingCount(data.servingCount ?? 1);
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
    onSuccess: async (data) => {
      setSelectedPlanData(data ?? null);
      setSelectedPlanId(data?.id ?? null);
      if (typeof data?.servingCount === "number") {
        setServingCount(data.servingCount);
      }
      await fetchMealLogs(data?.id ?? undefined);
      await fetchMealAnalytics(data?.id ?? undefined);
      await fetchMealHistory();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const dietTypes = [];
    if (isVegetarian) dietTypes.push("Vegetarian");
    if (isHighProtein) dietTypes.push("High-Protein");
    if (isLowCarb) dietTypes.push("Low-Carb");
    const finalDietType =
      dietTypes.length > 0 ? dietTypes.join(", ") : dietType || "Balanced";

    const payload: MealPlanInput = {
      dietType: finalDietType,
      calories,
      allergies,
      cuisine,
      snacks,
      days: 7,
      servingCount,
    };

    mutation.mutate(payload);
  };

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = daysOfWeek[new Date().getDay()];
  const activePlanData = selectedPlanData;
  const hasMealPlan = Boolean(activePlanData?.mealPlan);

  useEffect(() => {
    if (!hasMealPlan) return;
    fetchMealLogs(selectedPlanId ?? undefined);
    fetchMealAnalytics(selectedPlanId ?? undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMealPlan, selectedPlanId]);

  useEffect(() => {
    fetchTrialStatus();
    fetchMealHistory();
    fetchProgressSummary();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (activeTab !== "grocery") return;
    fetchGrocerySync();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedPlanId, servingCount, hasMealPlan]);

  useEffect(() => {
    if (activeTab !== "planner") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        if (visible.target === weeklyPlanRef.current) {
          setActivePlannerSection("plan");
        }
        if (visible.target === weeklyAnalyticsRef.current) {
          setActivePlannerSection("analytics");
        }
      },
      { threshold: [0.3, 0.5, 0.7] }
    );

    if (weeklyPlanRef.current) observer.observe(weeklyPlanRef.current);
    if (weeklyAnalyticsRef.current) observer.observe(weeklyAnalyticsRef.current);
    return () => observer.disconnect();
  }, [activeTab, hasMealPlan]);

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

  const getMealPlanForDayFromPlan = (
    planData: MealPlanResponse | null,
    day: string
  ): DailyMealPlan | undefined => {
    if (!planData?.mealPlan) return undefined;
    return normalizeMeals(planData.mealPlan[day]);
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
          planId: selectedPlanId,
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
      await fetchMealAnalytics(selectedPlanId ?? undefined);
    } catch (error) {
      console.error("Failed to update meal status:", error);
    }
  };

  const handleSwapMeal = (dayName: string, mealType: MealTypeKey) => {
    if (!activePlanData?.mealPlan) return;

    const dietTypes = [];
    if (isVegetarian) dietTypes.push("Vegetarian");
    if (isHighProtein) dietTypes.push("High-Protein");
    if (isLowCarb) dietTypes.push("Low-Carb");
    const finalDietType =
      dietTypes.length > 0 ? dietTypes.join(", ") : dietType || "Balanced";

    mutation.mutate({
      dietType: finalDietType,
      calories,
      allergies,
      cuisine,
      snacks,
      servingCount,
      swapDay: dayName,
      swapMealType: mealType,
      baseMealPlan: activePlanData.mealPlan,
      days: 7,
    });
  };

  const todaysMealPlan = getMealPlanForDay(today);
  const selectedHistoryItem = historyItems.find((item) => item.id === selectedPlanId);
  const currentProgressCalories = Math.round(calories * 0.75);
  const scrollToPlannerSection = (section: "plan" | "analytics") => {
    setActivePlannerSection(section);
    if (activeTab !== "planner") {
      setActiveTab("planner");
      setTimeout(() => {
        if (section === "plan") {
          weeklyPlanRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        weeklyAnalyticsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return;
    }

    if (section === "plan") {
      weeklyPlanRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    weeklyAnalyticsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-[#f9fffc] to-teal-50 pt-[104px]">
      <main className="w-full px-5 sm:px-8 lg:px-12 2xl:px-16 py-10 sm:py-12">
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
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === "daily" ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setViewMode("weekly")}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === "weekly" ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                Weekly
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <aside
            className={`mt-3 mb-6 w-full xl:mb-0 xl:mt-0 xl:w-64 xl:fixed xl:left-6 2xl:left-10 xl:z-30 ${
              isOnTrial ? "xl:top-[205px]" : "xl:top-[155px]"
            }`}
          >
            <div className="rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab("planner")}
                className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  activeTab === "planner"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <LayoutPanelLeft className="h-4 w-4" />
                Planner
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  activeTab === "history"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <History className="h-4 w-4" />
                History
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("grocery")}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  activeTab === "grocery"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                Grocery Sync
              </button>
              {activeTab === "planner" && (
                <div className="mt-2 border-t border-emerald-100 pt-2">
                  <button
                    type="button"
                    onClick={() => scrollToPlannerSection("plan")}
                    className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
                      activePlannerSection === "plan"
                        ? "bg-emerald-100 text-emerald-700"
                        : "text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    &rarr; Weekly Meal Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToPlannerSection("analytics")}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
                      activePlannerSection === "analytics"
                        ? "bg-emerald-100 text-emerald-700"
                        : "text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    &rarr; Weekly Analytics
                  </button>
                </div>
              )}
            </div>
          </aside>

          <div className="xl:ml-[19rem]">
          <section className="mb-8 rounded-3xl border border-emerald-100 bg-white/75 backdrop-blur-sm px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-600">
                  Meal Planner Dashboard
                </p>
                <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
                  Plan Smarter. Eat Better.
                </h1>
                <p className="mt-2 text-base sm:text-lg text-gray-600 max-w-3xl">
                  Build a weekly plan, track progress, and regenerate meals instantly.
                </p>
              </div>
              {hasMealPlan && (
                <div className="inline-flex items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  Active view: {viewMode === "weekly" ? "Weekly Plan" : "Daily Plan"}
                </div>
              )}
            </div>
          </section>

          {activeTab === "planner" && (
          <>
          {/* Left Sidebar - Controls */}
          <aside className="w-full">
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2 xl:items-start">
              {/* Preferences Card */}
              <form onSubmit={handleSubmit} className="order-1 w-full bg-white/85 backdrop-blur-sm rounded-3xl p-8 sm:p-10 shadow-xl shadow-gray-200/60 border border-white/60 space-y-8 xl:sticky xl:top-[168px]">
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
                  <Users className="w-5 h-5 text-emerald-500" />
                  Serving Count
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 4, 6].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setServingCount(count)}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        servingCount === count
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {count} {count === 1 ? "serving" : "servings"}
                    </button>
                  ))}
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
                  className={`relative h-8 w-20 rounded-full transition-colors duration-300 ${
                    snacks ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ${
                      snacks ? "translate-x-12" : "translate-x-0"
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

              {/* Quick Stats Card */}
              <div className="order-2 w-full bg-white/85 backdrop-blur-sm rounded-3xl p-8 sm:p-10 shadow-xl shadow-gray-200/60 border border-white/60">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-bold text-xl text-gray-800">Daily Goals</h2>
              </div>

              <div className="space-y-8">
                <CalorieProgressBar current={currentProgressCalories} goal={calories} />

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
            </div>
          </aside>

          {/* Main Content - Meal Plan */}
          <section className="w-full">
            {mutation.isPending || isLoadingInitialPlan ? (
              <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/60 border border-white/60 min-h-[520px]">
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
                <div ref={weeklyPlanRef} className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-white/50">
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
                        servingCount,
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
                        onSwapMeal={(mealType) => handleSwapMeal(day, mealType)}
                      />
                    ))}
                  </div>
                </div>

                {/* Weekly Analytics */}
                <div ref={weeklyAnalyticsRef} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50 space-y-5">
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
          </>
          )}

          {activeTab === "history" && (
            <section className="w-full rounded-3xl border border-emerald-100 bg-white/85 p-6 sm:p-8 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Meal Plan History</h2>
                <button
                  type="button"
                  onClick={fetchMealHistory}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
              <div className="mb-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Monthly Estimate
                  </p>
                  {isProgressLoading ? (
                    <p className="mt-2 text-sm text-emerald-700">Calculating...</p>
                  ) : (
                    (() => {
                      const latestMonth = Object.keys(progressSummary?.monthly ?? {})
                        .sort()
                        .pop();
                      const bucket = latestMonth
                        ? progressSummary?.monthly?.[latestMonth]
                        : undefined;
                      return (
                        <div className="mt-2 space-y-1 text-sm text-emerald-800">
                          <p>
                            {latestMonth ?? "N/A"}: {bucket?.plansGenerated ?? 0} plans
                          </p>
                          <p>Avg adherence: {bucket?.avgAdherence ?? 0}%</p>
                          <p>Calorie hit: {bucket?.calorieTargetHitRate ?? 0}%</p>
                        </div>
                      );
                    })()
                  )}
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Yearly Estimate
                  </p>
                  {isProgressLoading ? (
                    <p className="mt-2 text-sm text-amber-700">Calculating...</p>
                  ) : (
                    (() => {
                      const latestYear = Object.keys(progressSummary?.yearly ?? {})
                        .sort()
                        .pop();
                      const bucket = latestYear
                        ? progressSummary?.yearly?.[latestYear]
                        : undefined;
                      return (
                        <div className="mt-2 space-y-1 text-sm text-amber-800">
                          <p>
                            {latestYear ?? "N/A"}: {bucket?.plansGenerated ?? 0} plans
                          </p>
                          <p>Avg adherence: {bucket?.avgAdherence ?? 0}%</p>
                          <p>Calorie hit: {bucket?.calorieTargetHitRate ?? 0}%</p>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
              <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
                <div className="max-h-[72vh] overflow-y-auto pr-1">
                  {isHistoryLoading ? (
                    <p className="text-sm text-gray-500">Loading history...</p>
                  ) : historyItems.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No history yet. Generate your first plan.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {historyItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => loadHistoryPlan(item.id)}
                          className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                            selectedPlanId === item.id
                              ? "border-emerald-400 bg-emerald-50"
                              : "border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
                          }`}
                        >
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                          <p className="mt-1 text-xs text-gray-600">
                            {item.dietType || "Balanced"} • {item.calories ?? "N/A"} kcal •{" "}
                            {item.servingCount ?? 1} serving(s) • {item.source ?? "provider"}
                          </p>
                          {item.warning && (
                            <p className="mt-2 text-xs text-amber-700">{item.warning}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6">
                  {!selectedPlanData?.mealPlan ? (
                    <p className="text-sm text-gray-500">
                      Select a history entry to view full plan details.
                    </p>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            Selected Week
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {selectedHistoryItem?.createdAt
                              ? new Date(selectedHistoryItem.createdAt).toLocaleString()
                              : "Current Plan"}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            Adherence {analyticsSummary.overallAdherence}% • Calorie hit{" "}
                            {analyticsSummary.calorieTargetHitRate}% • Streak{" "}
                            {analyticsSummary.currentDayStreak} day(s)
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {(selectedHistoryItem?.dietType || "Balanced")} •{" "}
                            {selectedHistoryItem?.calories ?? "N/A"} kcal •{" "}
                            {selectedHistoryItem?.servingCount ?? selectedPlanData.servingCount ?? 1} serving(s)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("planner")}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          Open In Planner
                        </button>
                      </div>

                      <div className="max-h-[56vh] space-y-3 overflow-y-auto pr-1">
                        {daysOfWeek.map((day) => {
                          const plan = getMealPlanForDayFromPlan(selectedPlanData, day);
                          return (
                            <div
                              key={`history-detail-${day}`}
                              className="rounded-xl border border-gray-200 bg-gray-50/60 p-4"
                            >
                              <p className="text-sm font-bold text-gray-900">{day}</p>
                              {!plan ? (
                                <p className="mt-2 text-sm text-gray-500">
                                  No meals available.
                                </p>
                              ) : (
                                <div className="mt-2 grid gap-2 text-sm text-gray-700">
                                  <p>
                                    <span className="font-semibold">Breakfast:</span>{" "}
                                    {plan.breakfast || "N/A"}
                                  </p>
                                  <p>
                                    <span className="font-semibold">Lunch:</span>{" "}
                                    {plan.lunch || "N/A"}
                                  </p>
                                  <p>
                                    <span className="font-semibold">Dinner:</span>{" "}
                                    {plan.dinner || "N/A"}
                                  </p>
                                  {plan.snacks && (
                                    <p>
                                      <span className="font-semibold">Snacks:</span>{" "}
                                      {plan.snacks}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === "grocery" && (
            <section className="w-full rounded-3xl border border-emerald-100 bg-white/85 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Quick Grocery Sync</h2>
                  <p className="text-sm text-gray-600">
                    Pull ingredients for the selected plan and serving size.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchGrocerySync}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Sync Now
                </button>
              </div>

              <div className="max-w-sm">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Servings Multiplier
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 4, 6].map((count) => (
                    <button
                      key={`grocery-serving-${count}`}
                      type="button"
                      onClick={() => setServingCount(count)}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        servingCount === count
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {count}x
                    </button>
                  ))}
                </div>
              </div>

              {groceryWarning && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {groceryWarning}
                </p>
              )}

              {isGroceryLoading ? (
                <p className="text-sm text-gray-500">Syncing grocery list...</p>
              ) : (
                <GroceryList items={groceryItems} onDownload={handleDownloadGroceryPdf} />
              )}
            </section>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}
