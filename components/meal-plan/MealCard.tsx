import { ElementType } from 'react';
import { RefreshCw, Flame, Clock, Plus, Minus } from 'lucide-react';
import type { Meal } from '@/types/mealplan';

interface MealCardProps {
  meal?: Meal;
  type: string;
  icon: ElementType;
  gradient: string;
  onToggleSelect?: () => void;
  onPortionChange?: (multiplier: number) => void;
  onRegenerate?: () => void;
}

export function MealCard({
  meal,
  type,
  icon: Icon,
  gradient,
  onToggleSelect,
  onPortionChange,
  onRegenerate,
}: MealCardProps) {
  const isSelected = meal?.selected !== false;
  const portionMultiplier = meal?.portionMultiplier ?? 1;

  return (
    <div
      className={`group relative rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border ${
        isSelected
          ? 'bg-card/90 backdrop-blur-sm border-border hover:-translate-y-1'
          : 'bg-muted/50 border-muted opacity-60'
      }`}
    >
      <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${gradient}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-semibold text-foreground text-lg">{type}</h4>
          </div>

          <div className="flex items-center gap-2">
            {meal && onToggleSelect && (
              <button
                onClick={onToggleSelect}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground/30 hover:border-primary'
                }`}
              >
                {isSelected && (
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )}
            {meal && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-muted rounded-lg transition-all duration-300"
                title="Regenerate this meal"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground hover:text-primary" />
              </button>
            )}
          </div>
        </div>

        {meal ? (
          <>
            <p className="text-muted-foreground mb-4 line-clamp-2">{meal.description || meal.name}</p>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="font-medium text-foreground">
                    {Math.round(meal.macros.calories * portionMultiplier)} kcal
                  </span>
                </span>
                {meal.prepTime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-400" />
                    {meal.prepTime} min
                  </span>
                )}
              </div>
            </div>

            {/* Portion Control */}
            {onPortionChange && isSelected && (
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="text-sm text-muted-foreground">Portion</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPortionChange(Math.max(0.5, portionMultiplier - 0.5))}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                    disabled={portionMultiplier <= 0.5}
                  >
                    <Minus className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <span className="w-12 text-center font-medium text-foreground">
                    {portionMultiplier}x
                  </span>
                  <button
                    onClick={() => onPortionChange(Math.min(3, portionMultiplier + 0.5))}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                    disabled={portionMultiplier >= 3}
                  >
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )}

            {/* Macro breakdown */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="text-sm font-semibold text-red-500">
                  {Math.round(meal.macros.protein * portionMultiplier)}g
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Carbs</p>
                <p className="text-sm font-semibold text-amber-500">
                  {Math.round(meal.macros.carbs * portionMultiplier)}g
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Fats</p>
                <p className="text-sm font-semibold text-green-500">
                  {Math.round(meal.macros.fats * portionMultiplier)}g
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground italic">No meal planned</p>
        )}
      </div>
    </div>
  );
}
