"use client";

import React from "react";
import NavBar from "./navbar";

type Props = {
  children: React.ReactNode;
};

export default function LayoutFrame({ children }: Props) {
  return (
    <>
      <NavBar />
      <div className="w-full pt-20 min-h-screen">
        {children}
      </div>
    </>
  );
}
