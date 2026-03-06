"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function SubscribeSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = useMemo(() => searchParams.get("session_id"), [searchParams]);
  const [status, setStatus] = useState<"loading" | "error" | "done">("loading");
  const [message, setMessage] = useState("Confirming your subscription...");

  useEffect(() => {
    let isMounted = true;

    const sync = async () => {
      if (!sessionId) {
        if (isMounted) {
          setStatus("error");
          setMessage("Missing checkout session. Please try again.");
        }
        return;
      }

      try {
        const response = await fetch("/api/sync-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          if (isMounted) {
            setStatus("error");
            setMessage(data.error ?? "Subscription sync failed.");
          }
          return;
        }

        if (isMounted) {
          setStatus("done");
          setMessage("Subscription active. Redirecting to meal plan...");
        }
        setTimeout(() => router.replace("/mealplan"), 700);
      } catch {
        if (isMounted) {
          setStatus("error");
          setMessage("Could not verify subscription. Please try again.");
        }
      }
    };

    sync();
    return () => {
      isMounted = false;
    };
  }, [router, sessionId]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border bg-white p-8 shadow-sm text-center">
        <div className="flex justify-center mb-4">
          {status === "loading" && <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />}
          {status === "done" && <CheckCircle2 className="w-10 h-10 text-emerald-600" />}
          {status === "error" && <AlertCircle className="w-10 h-10 text-red-600" />}
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Finalizing Subscription</h1>
        <p className={`text-sm ${status === "error" ? "text-red-700" : "text-gray-600"}`}>
          {message}
        </p>
        {status === "error" && (
          <button
            type="button"
            onClick={() => router.replace("/subscribe")}
            className="mt-5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
          >
            Back to Subscribe
          </button>
        )}
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border bg-white p-8 shadow-sm text-center">
        <div className="flex justify-center mb-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Finalizing Subscription
        </h1>
        <p className="text-sm text-gray-600">Loading checkout details...</p>
      </div>
    </main>
  );
}

export default function SubscribeSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubscribeSuccessContent />
    </Suspense>
  );
}
