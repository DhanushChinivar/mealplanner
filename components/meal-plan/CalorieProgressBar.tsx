import { Target } from 'lucide-react';

interface CalorieProgressBarProps {
  current: number;
  goal: number;
}

export function CalorieProgressBar({ current, goal }: CalorieProgressBarProps) {
  const percentage = Math.min((current / goal) * 100, 100);
  const isOverGoal = current > goal;

  return (
    <div className="bg-card rounded-2xl p-6 border shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl shadow-md">
          <Target className="w-5 h-5 text-white" />
        </div>
        <h2 className="font-semibold text-foreground text-lg">Daily Goals</h2>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Daily Progress</span>
          <span className={`font-bold text-lg ${isOverGoal ? 'text-red-500' : 'text-primary'}`}>
            {Math.round(current)} / {goal} kcal
          </span>
        </div>

        <div className="h-4 bg-muted rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              isOverGoal
                ? 'bg-gradient-to-r from-red-400 to-red-600'
                : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>{goal} kcal goal</span>
        </div>
      </div>
    </div>
  );
}
