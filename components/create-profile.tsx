// components/CreateProfileOnSignIn.tsx

"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";

type ApiResponse = {
  message: string;
  error?: string;
};

export default function CreateProfileOnSignIn() {
  const { isLoaded, isSignedIn } = useUser();
  const hasSynced = useRef(false);

  const { mutate } = useMutation<ApiResponse, Error>({
    mutationFn: async () => {
      const res = await fetch("/api/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      return data as ApiResponse;
    },
    onSuccess: (data) => {
      console.log(data.message);
    },
    onError: (error) => {
      console.error("Error creating profile:", error);
    },
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && !hasSynced.current) {
      hasSynced.current = true;
      mutate();
    }
  }, [isLoaded, isSignedIn, mutate]);

  return null;
}