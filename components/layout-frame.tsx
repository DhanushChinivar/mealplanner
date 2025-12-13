"use client";

import { usePathname } from "next/navigation";
import React from "react";
import NavBar from "./navbar";

type Props = {
  children: React.ReactNode;
};

export default function LayoutFrame({ children }: Props) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    // Landing page has its own navigation and layout chrome.
    return <>{children}</>;
  }

  return (
    <>
      <NavBar />
      <div className="max-w-7xl mx-auto pt-16 p-4 min-h-screen">
        {children}
      </div>
    </>
  );
}
