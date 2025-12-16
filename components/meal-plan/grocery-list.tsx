"use client";

import { useState } from 'react';
import { ShoppingCart, Check, Download, Apple, Beef, Wheat, Milk, Leaf, Package } from 'lucide-react';
import type { GroceryItem, Ingredient } from '@/types/mealplan';

interface GroceryListProps {
  items?: GroceryItem[];
  onDownload?: () => void;
}

const categoryIcons: Record<Ingredient['category'], typeof Apple> = {
  produce: Apple,
  proteins: Beef,
  grains: Wheat,
  dairy: Milk,
  spices: Leaf,
  other: Package,
};

const categoryLabels: Record<Ingredient['category'], string> = {
  produce: 'Produce',
  proteins: 'Proteins',
  grains: 'Grains',
  dairy: 'Dairy',
  spices: 'Spices',
  other: 'Other',
};

const categoryColors: Record<Ingredient['category'], string> = {
  produce: 'bg-green-100 text-green-700 border-green-200',
  proteins: 'bg-red-100 text-red-700 border-red-200',
  grains: 'bg-amber-100 text-amber-700 border-amber-200',
  dairy: 'bg-blue-100 text-blue-700 border-blue-200',
  spices: 'bg-purple-100 text-purple-700 border-purple-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function GroceryList({ items, onDownload }: GroceryListProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const safeItems = items ?? [];

  const toggleItem = (name: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  // Group items by category
  const groupedItems = safeItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<Ingredient['category'], GroceryItem[]>);

  const categories: Ingredient['category'][] = ['proteins', 'produce', 'grains', 'dairy', 'spices', 'other'];

  if (safeItems.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 border text-center">
        <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Generate a meal plan to see your grocery list</p>
      </div>
    );
  }

  const checkedCount = checkedItems.size;
  const totalCount = safeItems.length;

  return (
    <div className="bg-card rounded-2xl p-6 border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <ShoppingCart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Weekly Grocery List</h3>
            <p className="text-sm text-muted-foreground">
              {checkedCount} of {totalCount} items checked
            </p>
          </div>
        </div>
        {onDownload && (
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${totalCount === 0 ? 0 : (checkedCount / totalCount) * 100}%` }}
        />
      </div>

      <div className="space-y-6">
        {categories.map((category) => {
          const categoryItems = groupedItems[category];
          if (!categoryItems || categoryItems.length === 0) return null;

          const Icon = categoryIcons[category];

          return (
            <div key={category}>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-3 ${categoryColors[category]} border`}>
                <Icon className="w-4 h-4" />
                {categoryLabels[category]}
              </div>

              <div className="grid gap-2">
                {categoryItems.map((item) => {
                  const isChecked = checkedItems.has(item.name);
                  return (
                    <button
                      key={item.name}
                      onClick={() => toggleItem(item.name)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isChecked
                          ? 'bg-muted/50 border-muted'
                          : 'bg-background hover:bg-muted/30 border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-primary border-primary'
                              : 'border-muted-foreground/30'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className={`font-medium ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {item.name}
                        </span>
                      </div>
                      <span className={`text-sm ${isChecked ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                        {item.totalAmount} {item.unit}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GroceryList;
