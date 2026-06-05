"use client";

import { useUser } from "@clerk/nextjs";
import {useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ApiResponse = {
  error?: string;
  message: string
  };

async function createProfileRequest() {
  const response = await fetch("/api/create-profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Unexpected response from server");
  }
  const data = await response.json();
  return data as ApiResponse;
}

export default function CreateProfile() {
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const  {mutate, isPending} = useMutation<ApiResponse, Error>({
    mutationFn: createProfileRequest,
    onSuccess: () => {
        router.push("/subscribe");
    },
    onError: (error) => {
      console.error("Error creating profile:", error);
      router.push("/subscribe");
    },
});
  useEffect(() => {
  if (isLoaded && isSignedIn && !isPending) {
    mutate();
  }
}, [isLoaded, isSignedIn]);
  return (
    <div>
     Processing sign in...
    </div>
  );
}
