"use client";

import { useState, type FormEvent, type ElementType } from 'react';
import {
  Sparkles,
  Leaf,
  Flame,
  Utensils,
  AlertCircle,
  Cookie,
  ChevronDown,
  Loader2,
  Salad,
  Beef,
  Zap,
} from 'lucide-react';
import type { UserPreferences } from '@/types/mealplan';

interface PreferencesPanelProps {
  preferences: UserPreferences;
  onPreferencesChange: (preferences: UserPreferences) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error?: string;
}

function ToggleButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
        active
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105'
          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:shadow-md'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

export function PreferencesPanel({
  preferences,
  onPreferencesChange,
  onSubmit,
  isLoading,
  error,
}: PreferencesPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    onPreferencesChange({ ...preferences, [key]: value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-foreground text-lg">Preferences</h2>
            <p className="text-sm text-muted-foreground">Customize your meal plan</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
            isCollapsed ? '' : 'rotate-180'
          }`}
        />
      </button>

      {/* Collapsible content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? 'max-h-0' : 'max-h-[800px]'
        }`}
      >
        <form onSubmit={handleSubmit} className="p-5 pt-0 space-y-5">
          {/* Diet Toggles */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Leaf className="w-4 h-4 text-primary" />
              Diet Style
            </label>
            <div className="flex flex-wrap gap-2">
              <ToggleButton
                active={preferences.isVegetarian}
                onClick={() => updatePreference('isVegetarian', !preferences.isVegetarian)}
                icon={Salad}
                label="Vegetarian"
              />
              <ToggleButton
                active={preferences.isHighProtein}
                onClick={() => updatePreference('isHighProtein', !preferences.isHighProtein)}
                icon={Beef}
                label="High Protein"
              />
              <ToggleButton
                active={preferences.isLowCarb}
                onClick={() => updatePreference('isLowCarb', !preferences.isLowCarb)}
                icon={Zap}
                label="Low Carb"
              />
            </div>
          </div>

          {/* Calorie Slider */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Daily Calories:{' '}
              <span className="text-primary font-bold">{preferences.calories} kcal</span>
            </label>
            <input
              type="range"
              min={1200}
              max={4000}
              step={50}
              value={preferences.calories}
              onChange={(e) => updatePreference('calories', Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1200</span>
              <span>4000</span>
            </div>
          </div>

          {/* Cuisine Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Utensils className="w-4 h-4 text-purple-500" />
              Preferred Cuisine
            </label>
            <input
              type="text"
              value={preferences.cuisine}
              onChange={(e) => updatePreference('cuisine', e.target.value)}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground"
              placeholder="e.g., Italian, Asian, Mediterranean"
            />
          </div>

          {/* Allergies Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Allergies / Restrictions
            </label>
            <input
              type="text"
              value={preferences.allergies}
              onChange={(e) => updatePreference('allergies', e.target.value)}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground"
              placeholder="e.g., Nuts, Dairy, Gluten"
            />
          </div>

          {/* Snacks Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Cookie className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-foreground">Include Snacks</span>
            </div>
            <button
              type="button"
              onClick={() => updatePreference('snacks', !preferences.snacks)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                preferences.snacks ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${
                  preferences.snacks ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Meal Plan
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
