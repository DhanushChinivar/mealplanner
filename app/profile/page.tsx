"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { availablePlans } from "@/lib/plans";
import Image from "next/image";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/spinner";
import { Scale, Target, User, ChevronDown, Save } from "lucide-react";

type HealthData = {
  displayName?: string;
  age?: number;
  weightKg?: number;
  heightCm?: number;
  goal?: string;
};

const GOALS = ["Lose Weight", "Maintain Weight", "Gain Muscle", "Eat Healthier"];

function calcBMI(weightKg: number, heightCm: number) {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-500", suggestion: "You are underweight. Focus on gaining healthy weight through nutritious, calorie-dense meals." };
  if (bmi < 25)   return { label: "Normal", color: "text-emerald-500", suggestion: "Great! Your BMI is in the healthy range. Focus on maintaining your current weight." };
  if (bmi < 30)   return { label: "Overweight", color: "text-yellow-500", suggestion: "You are slightly overweight. Aim to maintain and avoid gaining more — small dietary changes can help." };
  return { label: "Obese", color: "text-red-500", suggestion: "Your BMI indicates obesity. Focus on gradual weight loss through balanced meals and regular activity." };
}

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [healthForm, setHealthForm] = useState<HealthData>({});
  const [editingHealth, setEditingHealth] = useState(false);

  // Fetch subscription
  const { data: subscription, isLoading: subLoading, isError, error } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await fetch("/api/profile/subscription-status");
      if (!res.ok) throw new Error((await res.json()).error || "Failed to fetch subscription.");
      return res.json();
    },
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch health data
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/api/profile/health");
      if (!res.ok) throw new Error("Failed to fetch health data.");
      return res.json() as Promise<HealthData>;
    },
    enabled: isLoaded && isSignedIn,
  });

  useEffect(() => {
    if (health) setHealthForm(health);
  }, [health]);

  const currentPlan = availablePlans.find(
    (plan) => plan.interval === subscription?.subscription?.subscriptionTier
  );

  // Save health data
  const saveHealthMutation = useMutation({
    mutationFn: async (data: HealthData) => {
      const res = await fetch("/api/profile/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save health data.");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health"] });
      toast.success("Health data saved.");
      setEditingHealth(false);
    },
    onError: () => toast.error("Failed to save health data."),
  });

  // Change plan
  const changePlanMutation = useMutation({
    mutationFn: async (newPlan: string) => {
      const res = await fetch("/api/profile/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPlan }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to change plan.");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast.success("Plan updated successfully.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Unsubscribe
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile/unsubscribe", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to unsubscribe.");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      router.push("/subscribe");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const bmi = healthForm.weightKg && healthForm.heightCm
    ? calcBMI(healthForm.weightKg, healthForm.heightCm)
    : null;
  const bmiInfo = bmi ? bmiCategory(bmi) : null;

  if (!isLoaded) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f2fbf6]">
      <Spinner />
    </div>
  );

  if (!isSignedIn) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f2fbf6]">
      <p>Please sign in to view your profile.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2fbf6] pt-28 pb-16 px-4 sm:px-8">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 flex items-center gap-5">
          <Image
            src={user.imageUrl || "/default-avatar.png"}
            alt="Avatar"
            width={72}
            height={72}
            className="rounded-full ring-4 ring-emerald-100"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {healthForm.displayName || `${user.firstName} ${user.lastName}`}
            </h1>
            <p className="text-gray-500 text-sm">{user.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>

        {/* Health Data */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Health Profile</h2>
            </div>
            <button
              onClick={() => setEditingHealth(!editingHealth)}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {editingHealth ? "Cancel" : "Edit"}
            </button>
          </div>

          {healthLoading ? (
            <div className="flex items-center gap-2 text-gray-400"><Spinner /><span>Loading...</span></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Display Name</label>
                {editingHealth ? (
                  <input
                    type="text"
                    value={healthForm.displayName ?? ""}
                    onChange={e => setHealthForm(f => ({ ...f, displayName: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                ) : (
                  <p className="mt-1 text-gray-800 font-medium">{healthForm.displayName || "—"}</p>
                )}
              </div>

              {/* Age */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Age</label>
                {editingHealth ? (
                  <input
                    type="number"
                    min={1} max={120}
                    value={healthForm.age ?? ""}
                    onChange={e => setHealthForm(f => ({ ...f, age: Number(e.target.value) || undefined }))}
                    className="mt-1 w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                ) : (
                  <p className="mt-1 text-gray-800 font-medium">{healthForm.age ? `${healthForm.age} yrs` : "—"}</p>
                )}
              </div>

              {/* Weight */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Weight (kg)</label>
                {editingHealth ? (
                  <input
                    type="number"
                    min={1}
                    value={healthForm.weightKg ?? ""}
                    onChange={e => setHealthForm(f => ({ ...f, weightKg: Number(e.target.value) || undefined }))}
                    className="mt-1 w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                ) : (
                  <p className="mt-1 text-gray-800 font-medium">{healthForm.weightKg ? `${healthForm.weightKg} kg` : "—"}</p>
                )}
              </div>

              {/* Height */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Height (cm)</label>
                {editingHealth ? (
                  <input
                    type="number"
                    min={1}
                    value={healthForm.heightCm ?? ""}
                    onChange={e => setHealthForm(f => ({ ...f, heightCm: Number(e.target.value) || undefined }))}
                    className="mt-1 w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                ) : (
                  <p className="mt-1 text-gray-800 font-medium">{healthForm.heightCm ? `${healthForm.heightCm} cm` : "—"}</p>
                )}
              </div>

              {/* Goal */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Goal</label>
                {editingHealth ? (
                  <div className="relative mt-1">
                    <select
                      value={healthForm.goal ?? ""}
                      onChange={e => setHealthForm(f => ({ ...f, goal: e.target.value }))}
                      className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      <option value="">Select a goal</option>
                      {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                ) : (
                  <p className="mt-1 text-gray-800 font-medium">{healthForm.goal || "—"}</p>
                )}
              </div>
            </div>
          )}

          {editingHealth && (
            <button
              onClick={() => saveHealthMutation.mutate(healthForm)}
              disabled={saveHealthMutation.isPending}
              className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saveHealthMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>

        {/* BMI Card */}
        {bmi && bmiInfo && (
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">BMI Calculator</h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className={`text-5xl font-bold ${bmiInfo.color}`}>{bmi.toFixed(1)}</p>
                <p className={`text-sm font-semibold mt-1 ${bmiInfo.color}`}>{bmiInfo.label}</p>
              </div>
              <div className="flex-1">
                <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden flex">
                  <div className="bg-blue-400 flex-1" />
                  <div className="bg-emerald-400 flex-1" />
                  <div className="bg-yellow-400 flex-1" />
                  <div className="bg-red-400 flex-1" />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Under</span><span>Normal</span><span>Over</span><span>Obese</span>
                </div>
                <div className="mt-3 flex items-start gap-2">
                  <Target className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-600">{bmiInfo.suggestion}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Subscription Details</h2>

          {subLoading ? (
            <div className="flex items-center gap-2 text-gray-400"><Spinner /><span>Loading...</span></div>
          ) : isError ? (
            <p className="text-red-500 text-sm">{error?.message}</p>
          ) : subscription ? (
            <div className="space-y-4">
              {/* Current Plan */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-2">Current Plan</p>
                {currentPlan ? (
                  <div className="space-y-1 text-sm text-gray-700">
                    <p><span className="font-medium">Plan:</span> {currentPlan.name}</p>
                    <p><span className="font-medium">Amount:</span> ${currentPlan.amount} {currentPlan.currency}</p>
                    <p>
                      <span className="font-medium">Status: </span>
                      <span className={subscription.subscription.subscriptionActive ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}>
                        {subscription.subscription.subscriptionActive ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-red-500">Plan not found.</p>
                )}
              </div>

              {/* Change Plan */}
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Change Plan</p>
                <div className="relative">
                  <select
                    onChange={e => setSelectedPlan(e.target.value)}
                    defaultValue={currentPlan?.interval}
                    disabled={changePlanMutation.isPending}
                    className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="" disabled>Select a new plan</option>
                    {availablePlans.map((plan, i) => (
                      <option key={i} value={plan.interval}>
                        {plan.name} - ${plan.amount} / {plan.interval}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <button
                  onClick={() => { if (selectedPlan) { changePlanMutation.mutate(selectedPlan); setSelectedPlan(""); } }}
                  disabled={changePlanMutation.isPending || !selectedPlan}
                  className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
                >
                  {changePlanMutation.isPending ? "Saving..." : "Save Change"}
                </button>
              </div>

              {/* Unsubscribe */}
              <div className="rounded-xl border border-red-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-400 mb-2">Danger Zone</p>
                <button
                  onClick={() => { if (confirm("Are you sure you want to unsubscribe?")) unsubscribeMutation.mutate(); }}
                  disabled={unsubscribeMutation.isPending}
                  className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {unsubscribeMutation.isPending ? "Unsubscribing..." : "Unsubscribe"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active subscription.</p>
          )}
        </div>
      </div>
    </div>
  );
}
