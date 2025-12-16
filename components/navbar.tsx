// components/navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useUser, SignedIn, SignedOut, SignOutButton } from "@clerk/nextjs";
import { ShoppingCart } from "lucide-react";

export default function NavBar() {
  const { isLoaded, user } = useUser();

  if (!isLoaded) return null;

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" width={44} height={44} alt="Logo" />
          <span className="text-xl font-bold text-emerald-600">MealPlanner</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-6">
          <SignedIn>
            <Link href="/mealplan" className="text-gray-600 hover:text-emerald-500 font-medium transition-colors">
              Meal Plan
            </Link>
            <Link href="/grocery-list" className="flex items-center gap-1.5 text-gray-600 hover:text-emerald-500 font-medium transition-colors">
              <ShoppingCart size={18} />
              Grocery List
            </Link>
            
            <Link href="/profile">
              {user?.imageUrl ? (
                <Image src={user.imageUrl} alt="Profile" width={36} height={36} className="rounded-full" />
              ) : (
                <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-semibold">
                  {user?.firstName?.[0] || "U"}
                </div>
              )}
            </Link>
            
            <SignOutButton>
              <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-medium">
                Sign Out
              </button>
            </SignOutButton>
          </SignedIn>

          <SignedOut>
            <Link href="/" className="text-gray-600 hover:text-emerald-500 font-medium transition-colors">
              Home
            </Link>
            <Link href="/subscribe" className="text-gray-600 hover:text-emerald-500 font-medium transition-colors">
              Subscribe
            </Link>
            <Link href="/sign-up" className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-medium">
              Sign Up
            </Link>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}
