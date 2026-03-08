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
      <div className="w-full px-5 sm:px-8 lg:px-12 h-[88px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3.5">
          <Image src="/logo.png" width={52} height={52} alt="Logo" />
          <span className="text-[2rem] sm:text-[2.15rem] font-bold text-emerald-600 leading-none tracking-tight">MealsForge</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-5 sm:gap-7">
          <SignedIn>
            <Link href="/mealplan" className="text-gray-700 hover:text-emerald-500 font-semibold text-base transition-colors">
              Meal Plan
            </Link>
            <Link href="/subscribe" className="text-gray-700 hover:text-emerald-500 font-semibold text-base transition-colors">
              Subscribe
            </Link>
            <Link href="/grocery-list" className="flex items-center gap-2 text-gray-700 hover:text-emerald-500 font-semibold text-base transition-colors">
              <ShoppingCart size={18} />
              Grocery List
            </Link>
            
            <Link href="/profile">
              {user?.imageUrl ? (
                <Image src={user.imageUrl} alt="Profile" width={44} height={44} className="rounded-full" />
              ) : (
                <div className="w-11 h-11 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-semibold">
                  {user?.firstName?.[0] || "U"}
                </div>
              )}
            </Link>
            
            <SignOutButton>
              <button className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition font-semibold text-base">
                Sign Out
              </button>
            </SignOutButton>
          </SignedIn>

          <SignedOut>
            <Link href="/" className="text-gray-700 hover:text-emerald-500 font-semibold text-base transition-colors">
              Home
            </Link>
            <Link href="/subscribe" className="text-gray-700 hover:text-emerald-500 font-semibold text-base transition-colors">
              Subscribe
            </Link>
            <Link href="/sign-up" className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition font-semibold text-base">
              Sign Up
            </Link>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}
