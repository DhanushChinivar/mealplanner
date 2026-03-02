"use client";

import { useEffect, useState } from "react";
import GroceryList from "@/components/meal-plan/grocery-list";
import type { GroceryItem } from "@/types/mealplan";
import { Spinner } from "@/components/spinner";

interface GroceryListResponse {
  items?: GroceryItem[];
  warning?: string;
  error?: string;
}

export default function GroceryListPage() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchGroceryList = async () => {
      try {
        const response = await fetch("/api/grocery-list", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data: GroceryListResponse = await response.json();
        if (!isMounted) return;

        if (!response.ok) {
          setError(data.error ?? "Failed to load grocery list.");
          return;
        }

        setItems(data.items ?? []);
        setWarning(data.warning ?? null);
      } catch {
        if (isMounted) {
          setError("Failed to load grocery list.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchGroceryList();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pt-24 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Grocery List</h1>
      {warning && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {warning}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="rounded-2xl border bg-card p-6 flex items-center gap-3 text-muted-foreground">
          <Spinner />
          <span>Loading your grocery list...</span>
        </div>
      ) : (
        <GroceryList items={items} />
      )}
    </main>
  );
}
