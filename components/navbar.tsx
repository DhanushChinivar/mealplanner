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
    <nav className="fixed top-0 left-0 right-0 w-full bg-[#f7fbf9]/95 backdrop-blur-sm border-b border-emerald-100 shadow-sm z-50">
      <div className="w-full px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" width={48} height={48} alt="Logo" />
          <span className="text-2xl sm:text-3xl font-bold text-emerald-600 leading-none">MealPlanner</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-4 sm:gap-6">
          <SignedIn>
            <Link href="/mealplan" className="text-gray-700 hover:text-emerald-500 font-semibold text-sm sm:text-base transition-colors">
              Meal Plan
            </Link>
            <Link href="/subscribe" className="text-gray-700 hover:text-emerald-500 font-semibold text-sm sm:text-base transition-colors">
              Subscribe
            </Link>
            <Link href="/grocery-list" className="flex items-center gap-1.5 text-gray-700 hover:text-emerald-500 font-semibold text-sm sm:text-base transition-colors">
              <ShoppingCart size={17} />
              Grocery List
            </Link>
            
            <Link href="/profile">
              {user?.imageUrl ? (
                <Image src={user.imageUrl} alt="Profile" width={42} height={42} className="rounded-full" />
              ) : (
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-semibold">
                  {user?.firstName?.[0] || "U"}
                </div>
              )}
            </Link>
            
            <SignOutButton>
              <button className="px-4 sm:px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-semibold text-sm sm:text-base">
                Sign Out
              </button>
            </SignOutButton>
          </SignedIn>

          <SignedOut>
            <Link href="/" className="text-gray-700 hover:text-emerald-500 font-semibold text-sm sm:text-base transition-colors">
              Home
            </Link>
            <Link href="/subscribe" className="text-gray-700 hover:text-emerald-500 font-semibold text-sm sm:text-base transition-colors">
              Subscribe
            </Link>
            <Link href="/sign-up" className="px-4 sm:px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-semibold text-sm sm:text-base">
              Sign Up
            </Link>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}
