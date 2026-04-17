// components/MealPlanDashboard.tsx
"use client";

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
  Beef,
  Wheat,
  Droplets,
  Clock,
  Calendar,
  ChevronDown,
  Zap,
  AlertCircle,
  Check,
  Salad,
  Loader2,
  ShoppingCart,
  History,
  LayoutPanelLeft,
  Users,
  Trash2,
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
  dietType?: string;
  calories?: number;
  allergies?: string;
  cuisine?: string;
  snacks?: boolean;
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

// ── Sub-components ────────────────────────────────────────────────────────────

const CalorieProgressBar = ({ current, goal }: { current: number; goal: number }) => {
  const pct = Math.min((current / goal) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-slate-500">Daily Progress</span>
        <span className="font-bold text-emerald-600">{current} / {goal} kcal</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const ToggleButton = ({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ElementType;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
      active
        ? "bg-emerald-600 text-white shadow-sm"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
);

const mealTypeAccent: Record<
  string,
  { border: string; iconBg: string; iconColor: string; doneBg: string }
> = {
  Breakfast: {
    border: "border-l-amber-400",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    doneBg: "bg-amber-50/70",
  },
  Lunch: {
    border: "border-l-emerald-400",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    doneBg: "bg-emerald-50/70",
  },
  Dinner: {
    border: "border-l-indigo-400",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
    doneBg: "bg-indigo-50/50",
  },
  Snacks: {
    border: "border-l-rose-400",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    doneBg: "bg-rose-50/50",
  },
};

const MealCard = ({
  type,
  meal,
  icon: Icon,
  onRegenerate,
  mealStatus,
  onSetStatus,
}: {
  type: string;
  meal?: string;
  icon: ElementType;
  gradient?: string;
  onRegenerate?: () => void;
  mealStatus?: "completed" | "skipped";
  onSetStatus?: (status: "completed" | "skipped" | "pending") => void;
}) => {
  const caloriesByType: Record<string, number> = {
    Breakfast: 400,
    Lunch: 550,
    Dinner: 650,
    Snacks: 200,
  };
  const prepByType: Record<string, number> = {
    Breakfast: 15,
    Lunch: 20,
    Dinner: 30,
    Snacks: 10,
  };
  const accent = mealTypeAccent[type] ?? {
    border: "border-l-slate-300",
    iconBg: "bg-slate-50",
    iconColor: "text-slate-400",
    doneBg: "bg-slate-50",
  };

  return (
    <div
      className={`group relative rounded-xl border border-l-4 ${accent.border} p-3.5 transition-all duration-200 ${
        mealStatus === "completed"
          ? `${accent.doneBg} border-slate-100`
          : mealStatus === "skipped"
          ? "bg-slate-50 border-slate-100 opacity-60"
          : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-lg ${accent.iconBg} shrink-0 mt-0.5`}>
          <Icon className={`w-3.5 h-3.5 ${accent.iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {type}
              </span>
              {mealStatus === "completed" && (
                <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                  <Check className="w-2.5 h-2.5" /> Done
                </span>
              )}
              {mealStatus === "skipped" && (
                <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                  Skipped
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {meal && onSetStatus && (
                <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      onSetStatus(mealStatus === "completed" ? "pending" : "completed")
                    }
                    title="Mark complete"
                    className={`px-2 py-1.5 text-xs font-bold transition-colors ${
                      mealStatus === "completed"
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                    }`}
                  >
                    ✓
                  </button>
                  <div className="w-px bg-slate-200" />
                  <button
                    type="button"
                    onClick={() =>
                      onSetStatus(mealStatus === "skipped" ? "pending" : "skipped")
                    }
                    title="Skip meal"
                    className={`px-2 py-1.5 text-xs font-bold transition-colors ${
                      mealStatus === "skipped"
                        ? "bg-slate-400 text-white"
                        : "bg-white text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    ✕
                  </button>
                </div>
              )}
              {meal && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  title="Swap this meal"
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-emerald-600"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {meal ? (
            <p
              className={`text-sm font-medium mt-1 leading-relaxed ${
                mealStatus === "skipped"
                  ? "line-through text-slate-400"
                  : "text-slate-700"
              }`}
            >
              {meal}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic mt-1">No meal planned</p>
          )}

          {meal && (
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />~
                {caloriesByType[type] ?? 450} kcal
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-400" />
                {prepByType[type] ?? 20} min
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AILoadingAnimation = ({ isGenerating = true }: { isGenerating?: boolean }) => {
  const [tipIndex, setTipIndex] = useState(0);
  const tips = [
    "Analyzing your nutritional goals...",
    "Balancing macronutrients...",
    "Optimizing meal variety...",
    "Considering your preferences...",
    "Crafting delicious combinations...",
  ];

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(
      () => setTipIndex((p) => (p + 1) % tips.length),
      2000
    );
    return () => clearInterval(interval);
  }, [tips.length, isGenerating]);

  if (!isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading your planner...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-8">
      <div className="relative">
        <div className="w-24 h-24 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/30">
          <ChefHat className="w-12 h-12 text-white" />
        </div>
        <div className="absolute -inset-3 rounded-2xl border-2 border-emerald-200 animate-spin border-t-emerald-500" />
        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-bounce" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-bold text-slate-800">AI Chef at Work</h3>
        <p className="text-sm text-emerald-600 animate-pulse transition-all duration-500">
          {tips[tipIndex]}
        </p>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
};

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
}) => {
  const mealKeys: MealTypeKey[] = ["breakfast", "lunch", "dinner", "snacks"];

  const slotColors: Record<string, string> = {
    breakfast:
      mealStatuses?.breakfast === "completed"
        ? "bg-amber-400"
        : mealStatuses?.breakfast === "skipped"
        ? "bg-slate-200"
        : "bg-amber-200",
    lunch:
      mealStatuses?.lunch === "completed"
        ? "bg-emerald-500"
        : mealStatuses?.lunch === "skipped"
        ? "bg-slate-200"
        : "bg-emerald-200",
    dinner:
      mealStatuses?.dinner === "completed"
        ? "bg-indigo-500"
        : mealStatuses?.dinner === "skipped"
        ? "bg-slate-200"
        : "bg-indigo-200",
    snacks:
      mealStatuses?.snacks === "completed"
        ? "bg-rose-400"
        : mealStatuses?.snacks === "skipped"
        ? "bg-slate-200"
        : "bg-rose-200",
  };

  const completedCount = mealKeys.filter(
    (k) => mealStatuses?.[k] === "completed"
  ).length;
  const totalMeals = mealPlan
    ? mealKeys.filter((k) => mealPlan[k]).length
    : 0;

  return (
    <div
      className={`rounded-xl overflow-hidden border transition-all ${
        isToday
          ? "border-emerald-200 shadow-sm shadow-emerald-100/60"
          : "border-slate-200"
      } bg-white`}
    >
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3.5 flex items-center justify-between transition-colors ${
          isToday ? "hover:bg-emerald-50/40" : "hover:bg-slate-50/70"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 ${
              isToday
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {day.slice(0, 3).toUpperCase()}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold text-sm ${
                  isToday ? "text-emerald-700" : "text-slate-800"
                }`}
              >
                {day}
              </span>
              {isToday && (
                <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  Today
                </span>
              )}
              {completedCount > 0 && !isExpanded && (
                <span className="text-[11px] text-emerald-600 font-semibold">
                  {completedCount}/{totalMeals} done
                </span>
              )}
            </div>
            {mealPlan && !isExpanded && (
              <div className="flex items-center gap-1 mt-1.5">
                {mealKeys
                  .filter((k) => mealPlan[k])
                  .map((k) => (
                    <span
                      key={k}
                      title={k}
                      className={`w-5 h-1 rounded-full ${slotColors[k]} transition-colors`}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && mealPlan && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-2.5 animate-in slide-in-from-top-1 duration-200">
          <MealCard
            type="Breakfast"
            meal={mealPlan.breakfast}
            icon={Coffee}
            onRegenerate={onSwapMeal ? () => onSwapMeal("breakfast") : undefined}
            mealStatus={mealStatuses?.breakfast}
            onSetStatus={
              onSetMealStatus ? (s) => onSetMealStatus("breakfast", s) : undefined
            }
          />
          <MealCard
            type="Lunch"
            meal={mealPlan.lunch}
            icon={Sun}
            onRegenerate={onSwapMeal ? () => onSwapMeal("lunch") : undefined}
            mealStatus={mealStatuses?.lunch}
            onSetStatus={
              onSetMealStatus ? (s) => onSetMealStatus("lunch", s) : undefined
            }
          />
          <MealCard
            type="Dinner"
            meal={mealPlan.dinner}
            icon={Moon}
            onRegenerate={onSwapMeal ? () => onSwapMeal("dinner") : undefined}
            mealStatus={mealStatuses?.dinner}
            onSetStatus={
              onSetMealStatus ? (s) => onSetMealStatus("dinner", s) : undefined
            }
          />
          {mealPlan.snacks && (
            <MealCard
              type="Snacks"
              meal={mealPlan.snacks}
              icon={Cookie}
              onRegenerate={onSwapMeal ? () => onSwapMeal("snacks") : undefined}
              mealStatus={mealStatuses?.snacks}
              onSetStatus={
                onSetMealStatus ? (s) => onSetMealStatus("snacks", s) : undefined
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function MealPlanDashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"planner" | "history" | "grocery">(
    "planner"
  );
  const [dietType] = useState("");
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
  const [selectedPlanData, setSelectedPlanData] = useState<MealPlanResponse | null>(
    null
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<MealPlanHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [groceryWarning, setGroceryWarning] = useState<string | null>(null);
  const [isGroceryLoading, setIsGroceryLoading] = useState(false);
  const [progressSummary, setProgressSummary] =
    useState<MealProgressResponse | null>(null);
  const [isProgressLoading, setIsProgressLoading] = useState(false);
  const [isLoadingInitialPlan, setIsLoadingInitialPlan] = useState(true);
  const [mealStatuses, setMealStatuses] = useState<
    NonNullable<MealLogResponse["statuses"]>
  >({});
  const [adherenceSummary, setAdherenceSummary] = useState<
    NonNullable<MealLogResponse["summary"]>
  >({ totalMeals: 0, completedMeals: 0, skippedMeals: 0, adherence: 0 });
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
  const [pendingScrollSection, setPendingScrollSection] = useState<
    "plan" | "analytics" | null
  >(null);
  const weeklyPlanRef = useRef<HTMLDivElement | null>(null);
  const weeklyAnalyticsRef = useRef<HTMLDivElement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadFormFromPlan = (plan: MealPlanResponse | null) => {
    if (!plan) return;
    if (plan.dietType) {
      setIsVegetarian(plan.dietType.includes("Vegetarian"));
      setIsHighProtein(plan.dietType.includes("High-Protein"));
      setIsLowCarb(plan.dietType.includes("Low-Carb"));
    }
    if (plan.calories) setCalories(plan.calories);
    if (plan.allergies !== undefined) setAllergies(plan.allergies);
    if (plan.cuisine !== undefined) setCuisine(plan.cuisine);
    if (typeof plan.snacks === "boolean") setSnacks(plan.snacks);
    if (plan.servingCount) setServingCount(plan.servingCount);
  };

  const handleDeletePlan = async () => {
    if (
      !confirm(
        "Are you sure you want to delete ALL meal plans? This cannot be undone."
      )
    )
      return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/mealplans?planId=all`, { method: "DELETE" });
      if (res.ok) {
        setSelectedPlanData(null);
        setSelectedPlanId(null);
        setMealStatuses({});
        setAdherenceSummary({
          totalMeals: 0,
          completedMeals: 0,
          skippedMeals: 0,
          adherence: 0,
        });
        await fetchMealHistory();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchTrialStatus = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/check-subscription`, { method: "GET" });
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
      const response = await fetch(
        `/api/meal-analytics${query ? `?${query}` : ""}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
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
      const response = await fetch(
        `/api/meal-log${query ? `?${query}` : ""}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
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
      const response = await fetch(
        `/api/mealplans?planId=${encodeURIComponent(planId)}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      if (!response.ok) return;
      const data: MealPlanHistoryResponse = await response.json();
      if (data.selected) {
        setSelectedPlanData(data.selected);
        setSelectedPlanId(planId);
        loadFormFromPlan(data.selected);
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
      if (!response.ok) {
        console.error("Grocery list fetch failed:", response.status);
        return;
      }
      const data: GroceryListResponse = await response.json();
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

    const grouped = groceryItems.reduce<Record<string, GroceryItem[]>>(
      (acc, item) => {
        const key = item.category || "other";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {}
    );

    const categoryLabels: Record<string, string> = {
      proteins: "Proteins",
      produce: "Produce",
      grains: "Grains",
      dairy: "Dairy",
      spices: "Spices",
      other: "Other",
    };

    const sectionHtml = Object.entries(grouped)
      .map(
        ([category, items]) => `
        <section>
          <h2>${categoryLabels[category] ?? category}</h2>
          <ul>${items
            .map(
              (item) =>
                `<li><span>${item.name}</span><span>${item.totalAmount} ${item.unit}</span></li>`
            )
            .join("")}</ul>
        </section>`
      )
      .join("");

    const createdAt = new Date().toLocaleString();
    const html = `<!doctype html><html><head><meta charset="utf-8" /><title>MealsForge Grocery List</title>
      <style>body{font-family:Arial,sans-serif;margin:24px;color:#0f172a;}h1{margin:0 0 6px;color:#047857;}
      p.meta{margin:0 0 16px;color:#475569;font-size:12px;}section{margin:14px 0;padding:12px;border:1px solid #d1fae5;border-radius:10px;}
      h2{margin:0 0 8px;font-size:16px;color:#065f46;}ul{list-style:none;margin:0;padding:0;}
      li{display:flex;justify-content:space-between;gap:16px;padding:6px 0;border-bottom:1px solid #e5e7eb;font-size:13px;}
      li:last-child{border-bottom:none;}</style></head>
      <body><h1>MealsForge Grocery List</h1>
      <p class="meta">Generated: ${createdAt} • Servings: ${servingCount}</p>${sectionHtml}</body></html>`;

    const popup = window.open("", "_blank");
    if (!popup) return;
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.onload = () => {
      popup.focus();
      popup.print();
    };
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
          loadFormFromPlan(data);
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
      loadFormFromPlan(data);
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
    mutation.mutate({
      dietType: finalDietType,
      calories,
      allergies,
      cuisine,
      snacks,
      days: 7,
      servingCount,
    });
  };

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
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
        if (visible.target === weeklyPlanRef.current)
          setActivePlannerSection("plan");
        if (visible.target === weeklyAnalyticsRef.current)
          setActivePlannerSection("analytics");
      },
      { threshold: [0.3, 0.5, 0.7] }
    );
    if (weeklyPlanRef.current) observer.observe(weeklyPlanRef.current);
    if (weeklyAnalyticsRef.current) observer.observe(weeklyAnalyticsRef.current);
    return () => observer.disconnect();
  }, [activeTab, hasMealPlan]);

  useEffect(() => {
    if (activeTab !== "planner" || !pendingScrollSection) return;
    if (pendingScrollSection === "plan") {
      weeklyPlanRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      weeklyAnalyticsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    setPendingScrollSection(null);
  }, [activeTab, pendingScrollSection]);

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
        body: JSON.stringify({ dayName, mealType, status, planId: selectedPlanId }),
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
      setPendingScrollSection(section);
      return;
    }
    if (section === "plan") {
      weeklyPlanRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      weeklyAnalyticsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 pt-[104px]">
      <main className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-6 sm:py-8">

        {/* Trial Banner */}
        {isOnTrial && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Free Trial Active —{" "}
                  {trialRemainingDays ?? 0} day
                  {(trialRemainingDays ?? 0) === 1 ? "" : "s"} remaining
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {trialMessage || "After 7 days, subscribe to keep full access."}
                </p>
              </div>
              <Link
                href="/subscribe"
                className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition whitespace-nowrap"
              >
                Upgrade Plan →
              </Link>
            </div>
          </div>
        )}

        <div className="relative">
          {/* ── Sidebar Navigation ── */}
          <aside
            className={`mt-3 mb-6 w-full xl:mb-0 xl:mt-0 xl:w-60 xl:fixed xl:left-6 2xl:left-10 xl:z-30 ${
              isOnTrial ? "xl:top-[205px]" : "xl:top-[155px]"
            }`}
          >
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {(
                [
                  { id: "planner", label: "Planner", icon: LayoutPanelLeft },
                  { id: "history", label: "History", icon: History },
                  { id: "grocery", label: "Grocery Sync", icon: ShoppingCart },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`relative w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-slate-100 last:border-0 ${
                    activeTab === id
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {activeTab === id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-500 rounded-r" />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}

              {activeTab === "planner" && (
                <div className="border-t border-slate-100 py-1">
                  {(["plan", "analytics"] as const).map((section) => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => scrollToPlannerSection(section)}
                      className={`w-full pl-10 pr-3 py-2 text-left text-xs font-medium transition-colors ${
                        activePlannerSection === section
                          ? "text-emerald-700 bg-emerald-50/70"
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {section === "plan" ? "Weekly Plan" : "Analytics"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* ── Content Area ── */}
          <div className="xl:ml-[17rem]">

            {/* Page Header */}
            <section className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Meal Planner
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {new Date().toLocaleDateString("en-AU", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {hasMealPlan && (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Plan
                  </div>
                )}
                {hasMealPlan && (
                  <div className="hidden sm:flex bg-white rounded-lg border border-slate-200 p-0.5 gap-0.5">
                    {(["daily", "weekly"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${
                          viewMode === mode
                            ? "bg-slate-900 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* ── PLANNER TAB ── */}
            {activeTab === "planner" && (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_1fr] xl:items-start">

                {/* Left Column: preferences + stats */}
                <div className="space-y-4 xl:sticky xl:top-[168px] xl:max-h-[calc(100vh-180px)] xl:overflow-y-auto xl:pb-4">

                  {/* Preferences Form */}
                  <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-600 rounded-xl">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="font-bold text-sm text-slate-800">Preferences</h2>
                    </div>

                    {/* Diet Style */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                        Diet Style
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <ToggleButton
                          active={isVegetarian}
                          onClick={() => setIsVegetarian(!isVegetarian)}
                          icon={Salad}
                          label="Vegetarian"
                        />
                        <ToggleButton
                          active={isHighProtein}
                          onClick={() => setIsHighProtein(!isHighProtein)}
                          icon={Beef}
                          label="High Protein"
                        />
                        <ToggleButton
                          active={isLowCarb}
                          onClick={() => setIsLowCarb(!isLowCarb)}
                          icon={Zap}
                          label="Low Carb"
                        />
                      </div>
                    </div>

                    {/* Calories */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        Daily Calories
                        <span className="ml-auto text-sm font-bold text-emerald-600 normal-case">
                          {calories} kcal
                        </span>
                      </p>
                      <input
                        type="range"
                        min={1200}
                        max={4000}
                        step={50}
                        value={calories}
                        onChange={(e) => setCalories(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600"
                      />
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>1,200</span>
                        <span>4,000 kcal</span>
                      </div>
                    </div>

                    {/* Serving Count */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        Serving Count
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 4, 6].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setServingCount(count)}
                            className={`rounded-xl border py-2 text-sm font-bold transition-all ${
                              servingCount === count
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {count}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cuisine */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-purple-500" />
                        Preferred Cuisine
                      </p>
                      <input
                        type="text"
                        value={cuisine}
                        onChange={(e) => setCuisine(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition text-sm text-slate-800 placeholder:text-slate-400"
                        placeholder="e.g. Italian, Asian, Mediterranean"
                      />
                    </div>

                    {/* Allergies */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        Allergies / Restrictions
                      </p>
                      <input
                        type="text"
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition text-sm text-slate-800 placeholder:text-slate-400"
                        placeholder="e.g. Nuts, Dairy, Gluten"
                      />
                    </div>

                    {/* Snacks Toggle */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <Cookie className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-semibold text-slate-700">
                          Include Snacks
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSnacks(!snacks)}
                        className={`relative h-6 w-11 rounded-full transition-colors duration-300 focus:outline-none ${
                          snacks ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                            snacks ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Meal Plan
                        </>
                      )}
                    </button>

                    {mutation.isError && (
                      <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <p className="text-xs text-red-700">
                          {mutation.error?.message || "An error occurred."}
                        </p>
                      </div>
                    )}
                  </form>

                  {/* Daily Goals Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-orange-50 rounded-xl">
                        <Target className="w-4 h-4 text-orange-500" />
                      </div>
                      <h2 className="font-bold text-sm text-slate-800">Daily Goals</h2>
                    </div>

                    <CalorieProgressBar
                      current={currentProgressCalories}
                      goal={calories}
                    />

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          icon: Beef,
                          label: "Protein",
                          value: "~25%",
                          iconColor: "text-red-500",
                          valueColor: "text-red-600",
                          bg: "bg-red-50 border-red-100",
                        },
                        {
                          icon: Wheat,
                          label: "Carbs",
                          value: "~45%",
                          iconColor: "text-amber-500",
                          valueColor: "text-amber-600",
                          bg: "bg-amber-50 border-amber-100",
                        },
                        {
                          icon: Droplets,
                          label: "Fats",
                          value: "~30%",
                          iconColor: "text-green-500",
                          valueColor: "text-green-600",
                          bg: "bg-green-50 border-green-100",
                        },
                      ].map(({ icon: Ico, label, value, iconColor, valueColor, bg }) => (
                        <div
                          key={label}
                          className={`p-2.5 rounded-xl border ${bg} text-center`}
                        >
                          <Ico className={`w-3.5 h-3.5 ${iconColor} mx-auto mb-1`} />
                          <p className="text-[10px] text-slate-500 font-medium">
                            {label}
                          </p>
                          <p className={`text-sm font-bold ${valueColor}`}>{value}</p>
                        </div>
                      ))}
                    </div>

                    {hasMealPlan && (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-emerald-700">
                            Weekly Adherence
                          </p>
                          <p className="text-lg font-black text-emerald-700">
                            {adherenceSummary.adherence}%
                          </p>
                        </div>
                        <div className="h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                            style={{ width: `${adherenceSummary.adherence}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-emerald-600 mt-1.5">
                          {adherenceSummary.completedMeals} of{" "}
                          {adherenceSummary.totalMeals} meals completed
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: meal plan content */}
                <div className="space-y-5">
                  {mutation.isPending || isLoadingInitialPlan ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[520px]">
                      <AILoadingAnimation isGenerating={mutation.isPending} />
                    </div>
                  ) : hasMealPlan ? (
                    <>
                      {activePlanData?.warning && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                          {activePlanData.warning}
                        </div>
                      )}

                      {/* Today's Hero */}
                      {todaysMealPlan && viewMode === "weekly" && (
                        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-600/20">
                          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
                          <div className="absolute -bottom-6 left-1/4 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
                          <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 rounded-lg">
                                  <Zap className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-sm font-bold">
                                  Today&apos;s Meals
                                </span>
                              </div>
                              <span className="text-xs text-white/60 font-medium">
                                {new Date().toLocaleDateString("en-AU", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            </div>
                            <div className="grid sm:grid-cols-3 gap-2.5">
                              {[
                                {
                                  icon: Coffee,
                                  label: "Breakfast",
                                  meal: todaysMealPlan.breakfast,
                                  status: mealStatuses[today]?.breakfast,
                                },
                                {
                                  icon: Sun,
                                  label: "Lunch",
                                  meal: todaysMealPlan.lunch,
                                  status: mealStatuses[today]?.lunch,
                                },
                                {
                                  icon: Moon,
                                  label: "Dinner",
                                  meal: todaysMealPlan.dinner,
                                  status: mealStatuses[today]?.dinner,
                                },
                              ].map(({ icon: MealIcon, label, meal, status }) => (
                                <div
                                  key={label}
                                  className={`rounded-xl p-3.5 transition-all ${
                                    status === "completed"
                                      ? "bg-white/20 ring-1 ring-white/30"
                                      : status === "skipped"
                                      ? "bg-white/5 opacity-60"
                                      : "bg-white/10"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <MealIcon className="w-3.5 h-3.5 opacity-80" />
                                      <span className="text-[11px] font-bold opacity-80 uppercase tracking-wide">
                                        {label}
                                      </span>
                                    </div>
                                    {status === "completed" && (
                                      <Check className="w-3.5 h-3.5" />
                                    )}
                                  </div>
                                  <p className="text-sm font-medium leading-snug line-clamp-2">
                                    {meal ?? (
                                      <span className="opacity-40 italic text-xs">
                                        Not set
                                      </span>
                                    )}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Weekly Plan */}
                      <div
                        ref={weeklyPlanRef}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
                      >
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-indigo-50 rounded-xl">
                              <Calendar className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <h2 className="font-bold text-sm text-slate-800">
                                Weekly Meal Plan
                              </h2>
                              <p className="text-[11px] text-slate-400">
                                {adherenceSummary.completedMeals} of{" "}
                                {adherenceSummary.totalMeals} meals done
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                mutation.mutate({
                                  dietType: dietType || "Balanced",
                                  calories,
                                  allergies,
                                  cuisine,
                                  snacks,
                                  servingCount,
                                  days: 7,
                                })
                              }
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Regenerate
                            </button>
                            <button
                              onClick={handleDeletePlan}
                              disabled={isDeleting}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {isDeleting ? "Clearing..." : "Clear"}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {daysOfWeek.map((day) => (
                            <DayCard
                              key={day}
                              day={day}
                              mealPlan={getMealPlanForDay(day)}
                              isToday={day === today}
                              isExpanded={expandedDay === day}
                              onToggle={() =>
                                setExpandedDay(expandedDay === day ? null : day)
                              }
                              mealStatuses={mealStatuses[day]}
                              onSetMealStatus={(mealType, status) =>
                                handleSetMealStatus(day, mealType, status)
                              }
                              onSwapMeal={(mealType) => handleSwapMeal(day, mealType)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Analytics */}
                      <div
                        ref={weeklyAnalyticsRef}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-emerald-50 rounded-xl">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-800">
                              Weekly Analytics
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              Tracking your current plan
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            {
                              label: "Adherence",
                              value: `${analyticsSummary.overallAdherence}%`,
                              color: "text-emerald-600",
                              bg: "bg-emerald-50 border-emerald-100",
                            },
                            {
                              label: "Calorie Hit",
                              value: `${analyticsSummary.calorieTargetHitRate}%`,
                              color: "text-blue-600",
                              bg: "bg-blue-50 border-blue-100",
                            },
                            {
                              label: "Protein",
                              value: `${analyticsSummary.proteinConsistency}%`,
                              color: "text-violet-600",
                              bg: "bg-violet-50 border-violet-100",
                            },
                            {
                              label: "Day Streak",
                              value: `${analyticsSummary.currentDayStreak}d`,
                              color: "text-orange-600",
                              bg: "bg-orange-50 border-orange-100",
                            },
                          ].map(({ label, value, color, bg }) => (
                            <div key={label} className={`rounded-xl border p-4 ${bg}`}>
                              <p className="text-[11px] text-slate-500 font-semibold mb-1">
                                {label}
                              </p>
                              <p className={`text-2xl font-black ${color}`}>{value}</p>
                            </div>
                          ))}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-slate-600">
                              Completion Heatmap
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
                                Done
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 inline-block" />
                                Skipped
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-200 inline-block" />
                                Pending
                              </span>
                            </div>
                          </div>
                          {analyticsHeatmap.length === 0 ? (
                            <p className="text-xs text-slate-400">
                              Mark meals as done to see your heatmap.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {analyticsHeatmap.map((dayRow) => (
                                <div
                                  key={dayRow.dayName}
                                  className="flex items-center gap-3"
                                >
                                  <span className="w-8 text-xs font-bold text-slate-400">
                                    {dayRow.dayName.slice(0, 3)}
                                  </span>
                                  <div className="flex gap-1.5">
                                    {(
                                      [
                                        "breakfast",
                                        "lunch",
                                        "dinner",
                                        "snacks",
                                      ] as const
                                    ).map((slot, i) => (
                                      <span
                                        key={slot}
                                        title={`${["B", "L", "D", "S"][i]}: ${dayRow[slot]}`}
                                        className={`w-6 h-6 rounded-md text-[9px] flex items-center justify-center font-black transition-colors ${
                                          dayRow[slot] === "completed"
                                            ? "bg-emerald-400 text-white"
                                            : dayRow[slot] === "skipped"
                                            ? "bg-slate-200 text-slate-500"
                                            : "bg-slate-100 text-slate-300 border border-slate-200"
                                        }`}
                                      >
                                        {["B", "L", "D", "S"][i]}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Empty State */
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                      <div className="max-w-sm mx-auto">
                        <div className="w-16 h-16 bg-emerald-600 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg shadow-emerald-600/25">
                          <ChefHat className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 mb-2">
                          Your plan is empty
                        </h2>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                          Set your preferences and click{" "}
                          <span className="font-bold text-emerald-600">
                            Generate Meal Plan
                          </span>{" "}
                          to get a personalised 7-day plan.
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            {
                              icon: Leaf,
                              text: "Diet-aware",
                              iconColor: "text-emerald-600",
                              iconBg: "bg-emerald-50",
                            },
                            {
                              icon: Target,
                              text: "Calorie-matched",
                              iconColor: "text-orange-600",
                              iconBg: "bg-orange-50",
                            },
                            {
                              icon: Sparkles,
                              text: "AI-generated",
                              iconColor: "text-violet-600",
                              iconBg: "bg-violet-50",
                            },
                          ].map(({ icon: Ico, text, iconColor, iconBg }) => (
                            <div
                              key={text}
                              className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100"
                            >
                              <div className={`p-2 rounded-lg ${iconBg}`}>
                                <Ico className={`w-4 h-4 ${iconColor}`} />
                              </div>
                              <span className="text-xs font-semibold text-slate-600">
                                {text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── HISTORY TAB ── */}
            {activeTab === "history" && (
              <section className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Plan History</h2>
                  <button
                    type="button"
                    onClick={fetchMealHistory}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                </div>

                <div className="mb-5 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: "This Month",
                      border: "border-emerald-100",
                      bg: "bg-emerald-50/70",
                      headColor: "text-emerald-700",
                      bodyColor: "text-emerald-800",
                      getEntry: () => {
                        const key = Object.keys(progressSummary?.monthly ?? {})
                          .sort()
                          .pop();
                        return {
                          key,
                          bucket: key
                            ? progressSummary?.monthly?.[key]
                            : undefined,
                        };
                      },
                    },
                    {
                      label: "This Year",
                      border: "border-amber-100",
                      bg: "bg-amber-50/70",
                      headColor: "text-amber-700",
                      bodyColor: "text-amber-800",
                      getEntry: () => {
                        const key = Object.keys(progressSummary?.yearly ?? {})
                          .sort()
                          .pop();
                        return {
                          key,
                          bucket: key
                            ? progressSummary?.yearly?.[key]
                            : undefined,
                        };
                      },
                    },
                  ].map(({ label, border, bg, headColor, bodyColor, getEntry }) => {
                    const { key, bucket } = getEntry();
                    return (
                      <div
                        key={label}
                        className={`rounded-xl border ${border} ${bg} p-4`}
                      >
                        <p
                          className={`text-[11px] font-bold uppercase tracking-wider ${headColor}`}
                        >
                          {label}
                        </p>
                        {isProgressLoading ? (
                          <p className={`mt-2 text-xs ${headColor}`}>
                            Calculating...
                          </p>
                        ) : (
                          <div className={`mt-2 ${bodyColor}`}>
                            <p className="text-sm font-bold">
                              {key ?? "N/A"}: {bucket?.plansGenerated ?? 0} plans
                            </p>
                            <p className="text-xs mt-0.5">
                              Avg adherence: {bucket?.avgAdherence ?? 0}% · Calorie
                              hit: {bucket?.calorieTargetHitRate ?? 0}%
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
                  <div className="max-h-[68vh] overflow-y-auto pr-1 space-y-2">
                    {isHistoryLoading ? (
                      <p className="text-xs text-slate-500 py-4">
                        Loading history...
                      </p>
                    ) : historyItems.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4">
                        No history yet. Generate your first plan.
                      </p>
                    ) : (
                      historyItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => loadHistoryPlan(item.id)}
                          className={`w-full rounded-xl border px-4 py-3.5 text-left transition-all ${
                            selectedPlanId === item.id
                              ? "border-emerald-400 bg-emerald-50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                          }`}
                        >
                          <p className="text-sm font-bold text-slate-800">
                            {new Date(item.createdAt).toLocaleDateString("en-AU", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {[
                              item.dietType || "Balanced",
                              `${item.calories ?? "N/A"} kcal`,
                              `${item.servingCount ?? 1} serving${
                                (item.servingCount ?? 1) > 1 ? "s" : ""
                              }`,
                            ].map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          {item.warning && (
                            <p className="mt-1.5 text-[10px] text-amber-700">
                              {item.warning}
                            </p>
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    {!selectedPlanData?.mealPlan ? (
                      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                          <History className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500">
                          Select a history entry to view the full plan.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                              Selected Week
                            </p>
                            <p className="text-base font-bold text-slate-900 mt-0.5">
                              {selectedHistoryItem?.createdAt
                                ? new Date(
                                    selectedHistoryItem.createdAt
                                  ).toLocaleString()
                                : "Current Plan"}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {selectedHistoryItem?.dietType || "Balanced"} ·{" "}
                              {selectedHistoryItem?.calories ?? "N/A"} kcal ·{" "}
                              {selectedHistoryItem?.servingCount ??
                                selectedPlanData.servingCount ??
                                1}{" "}
                              serving(s)
                            </p>
                            <div className="flex flex-wrap gap-3 mt-2 text-xs">
                              <span className="font-bold text-emerald-700">
                                Adherence {analyticsSummary.overallAdherence}%
                              </span>
                              <span className="text-slate-500">
                                Calorie hit {analyticsSummary.calorieTargetHitRate}%
                              </span>
                              <span className="text-slate-500">
                                Streak {analyticsSummary.currentDayStreak}d
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab("planner")}
                            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                          >
                            Open In Planner →
                          </button>
                        </div>

                        <div className="max-h-[56vh] space-y-2.5 overflow-y-auto pr-1">
                          {daysOfWeek.map((day) => {
                            const plan = getMealPlanForDayFromPlan(
                              selectedPlanData,
                              day
                            );
                            return (
                              <div
                                key={`history-detail-${day}`}
                                className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5"
                              >
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                                  {day}
                                </p>
                                {!plan ? (
                                  <p className="text-xs text-slate-400 italic">
                                    No meals recorded.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {[
                                      {
                                        icon: Coffee,
                                        label: "Breakfast",
                                        value: plan.breakfast,
                                        accent: "border-l-amber-400",
                                        iconBg: "bg-amber-50",
                                        iconColor: "text-amber-500",
                                      },
                                      {
                                        icon: Sun,
                                        label: "Lunch",
                                        value: plan.lunch,
                                        accent: "border-l-emerald-400",
                                        iconBg: "bg-emerald-50",
                                        iconColor: "text-emerald-600",
                                      },
                                      {
                                        icon: Moon,
                                        label: "Dinner",
                                        value: plan.dinner,
                                        accent: "border-l-indigo-400",
                                        iconBg: "bg-indigo-50",
                                        iconColor: "text-indigo-500",
                                      },
                                      ...(plan.snacks
                                        ? [
                                            {
                                              icon: Cookie,
                                              label: "Snacks",
                                              value: plan.snacks,
                                              accent: "border-l-rose-400",
                                              iconBg: "bg-rose-50",
                                              iconColor: "text-rose-500",
                                            },
                                          ]
                                        : []),
                                    ].map(
                                      ({
                                        icon: MIcon,
                                        label,
                                        value,
                                        accent,
                                        iconBg,
                                        iconColor,
                                      }) => (
                                        <div
                                          key={label}
                                          className={`flex items-start gap-2.5 border-l-4 ${accent} bg-white rounded-r-lg pl-3 py-2 pr-3`}
                                        >
                                          <div
                                            className={`p-1 rounded-md ${iconBg} shrink-0`}
                                          >
                                            <MIcon
                                              className={`w-3 h-3 ${iconColor}`}
                                            />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                              {label}
                                            </p>
                                            <p className="text-xs text-slate-700 font-medium leading-snug mt-0.5">
                                              {value || "—"}
                                            </p>
                                          </div>
                                        </div>
                                      )
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

            {/* ── GROCERY TAB ── */}
            {activeTab === "grocery" && (
              <section className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Grocery Sync
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Pull ingredients for the selected plan and serving size.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchGrocerySync}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Sync Now
                  </button>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Servings Multiplier
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 4, 6].map((count) => (
                      <button
                        key={`grocery-serving-${count}`}
                        type="button"
                        onClick={() => setServingCount(count)}
                        className={`rounded-xl border px-4 py-2 text-sm font-bold transition-all ${
                          servingCount === count
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {count}x
                      </button>
                    ))}
                  </div>
                </div>

                {groceryWarning && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                    {groceryWarning}
                  </div>
                )}

                {isGroceryLoading ? (
                  <div className="flex items-center gap-3 py-8 justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                    <p className="text-sm text-slate-500">
                      Syncing grocery list...
                    </p>
                  </div>
                ) : (
                  <GroceryList
                    items={groceryItems}
                    onDownload={handleDownloadGroceryPdf}
                  />
                )}
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
