"use client";

import { useState, type MouseEvent } from 'react';
import { Flame } from 'lucide-react';
import type { MacroNutrients } from '@/types/mealplan';

interface MacroPieChartProps {
  macros: MacroNutrients;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface TooltipState {
  show: boolean;
  x: number;
  y: number;
  label: string;
  value: number;
  color: string;
}

export function MacroPieChart({ macros, animated = true, size = 'lg' }: MacroPieChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({ show: false, x: 0, y: 0, label: '', value: 0, color: '' });
  const [animationComplete, setAnimationComplete] = useState(!animated);

  const { protein, carbs, fats, calories } = macros;
  const total = protein + carbs + fats;

  // Prevent division by zero
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className={`relative ${size === 'lg' ? 'w-48 h-48' : size === 'md' ? 'w-36 h-36' : 'w-28 h-28'}`}>
          <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
            <circle cx="0" cy="0" r="0.85" fill="none" stroke="hsl(var(--muted))" strokeWidth="0.25" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`${size === 'lg' ? 'w-24 h-24' : size === 'md' ? 'w-16 h-16' : 'w-12 h-12'} bg-background rounded-full shadow-inner flex flex-col items-center justify-center`}>
              <Flame className={`${size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'} text-muted-foreground`} />
              <span className="text-xs text-muted-foreground mt-1">No data</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const proteinPercent = protein / total;
  const carbsPercent = carbs / total;
  const fatsPercent = fats / total;

  // Calculate arc paths
  const getArcPath = (startPercent: number, endPercent: number) => {
    const startAngle = startPercent * 2 * Math.PI;
    const endAngle = endPercent * 2 * Math.PI;
    const largeArc = endPercent - startPercent > 0.5 ? 1 : 0;

    const startX = Math.cos(startAngle) * 0.85;
    const startY = Math.sin(startAngle) * 0.85;
    const endX = Math.cos(endAngle) * 0.85;
    const endY = Math.sin(endAngle) * 0.85;

    return `M ${startX} ${startY} A 0.85 0.85 0 ${largeArc} 1 ${endX} ${endY}`;
  };

  const segments = [
    { label: 'Protein', value: protein, color: '#ef4444', start: 0, end: proteinPercent },
    { label: 'Carbs', value: carbs, color: '#f59e0b', start: proteinPercent, end: proteinPercent + carbsPercent },
    { label: 'Fats', value: fats, color: '#22c55e', start: proteinPercent + carbsPercent, end: 1 },
  ];

  const handleMouseEnter = (e: MouseEvent<SVGPathElement>, segment: typeof segments[0]) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      label: segment.label,
      value: segment.value,
      color: segment.color,
    });
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, show: false }));
  };

  const sizeClasses = {
    lg: 'w-48 h-48',
    md: 'w-36 h-36',
    sm: 'w-28 h-28',
  };

  const centerSizeClasses = {
    lg: 'w-24 h-24',
    md: 'w-16 h-16',
    sm: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center relative">
      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg shadow-lg text-sm font-medium pointer-events-none transform -translate-x-1/2 -translate-y-full bg-popover text-popover-foreground border"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tooltip.color }} />
            <span>{tooltip.label}:</span>
            <span className="font-bold">{Math.round(tooltip.value)}g</span>
          </div>
        </div>
      )}

      <div className={`relative ${sizeClasses[size]}`}>
        <svg 
          viewBox="-1 -1 2 2" 
          className={`w-full h-full transform -rotate-90 ${animated && !animationComplete ? 'animate-[spin_1s_ease-out]' : ''}`}
          onAnimationEnd={() => setAnimationComplete(true)}
        >
          {segments.map((segment, index) => (
            <path
              key={segment.label}
              d={getArcPath(segment.start, segment.end)}
              fill="none"
              stroke={segment.color}
              strokeWidth="0.25"
              strokeLinecap="round"
              className={`cursor-pointer transition-all duration-300 hover:opacity-80 ${
                animated ? 'animate-[fadeIn_0.5s_ease-out]' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onMouseEnter={(e) => handleMouseEnter(e, segment)}
              onMouseLeave={handleMouseLeave}
            />
          ))}
        </svg>

        {/* Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${centerSizeClasses[size]} bg-background rounded-full shadow-inner flex flex-col items-center justify-center border`}>
            <Flame className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} text-orange-500`} />
            <span className={`${size === 'lg' ? 'text-sm' : 'text-xs'} font-bold text-foreground mt-1`}>
              {Math.round(calories)}
            </span>
            <span className="text-[10px] text-muted-foreground">kcal</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-3 mt-6 w-full max-w-xs">
        <MacroLegendItem label="Protein" value={protein} percentage={Math.round(proteinPercent * 100)} color="bg-red-500" bgColor="bg-red-50" textColor="text-red-600" />
        <MacroLegendItem label="Carbs" value={carbs} percentage={Math.round(carbsPercent * 100)} color="bg-amber-500" bgColor="bg-amber-50" textColor="text-amber-600" />
        <MacroLegendItem label="Fats" value={fats} percentage={Math.round(fatsPercent * 100)} color="bg-green-500" bgColor="bg-green-50" textColor="text-green-600" />
      </div>
    </div>
  );
}

function MacroLegendItem({ 
  label, 
  value, 
  percentage, 
  color, 
  bgColor, 
  textColor 
}: { 
  label: string; 
  value: number; 
  percentage: number; 
  color: string; 
  bgColor: string; 
  textColor: string; 
}) {
  return (
    <div className={`p-3 ${bgColor} rounded-xl text-center transition-transform hover:scale-105`}>
      <div className={`w-2 h-2 ${color} rounded-full mx-auto mb-1`} />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-bold ${textColor}`}>{percentage}%</p>
      <p className="text-[10px] text-muted-foreground">{Math.round(value)}g</p>
    </div>
  );
}
