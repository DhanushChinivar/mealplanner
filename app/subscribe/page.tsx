// app/subscribe/page.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { availablePlans } from "@/lib/plans";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Check,
  Shield,
  Zap,
  Crown,
  Sparkles,
  ChevronDown,
  CreditCard,
  RefreshCcw,
  Lock,
  Star,
  Users,
  Loader2,
} from "lucide-react";

type SubscribeResponse = {
  url: string;
};

type SubscribeError = {
  error: string;
};

const subscribeToPlan = async ({
  planType,
  userId,
  email,
}: {
  planType: string;
  userId: string;
  email: string;
}): Promise<SubscribeResponse> => {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planType, userId, email }),
  });

  if (!res.ok) {
    const errorData: SubscribeError = await res.json();
    throw new Error(errorData.error || "Something went wrong.");
  }

  return res.json();
};

const faqs = [
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Absolutely! You can cancel your subscription at any time with no questions asked. Your access will continue until the end of your billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express) and debit cards through our secure Stripe payment system.",
  },
  {
    question: "Can I switch plans later?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "We offer a weekly plan so you can try our service with minimal commitment before upgrading to a monthly or yearly plan.",
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Busy Professional",
    content:
      "This meal planner has completely transformed how I approach weekly meals. So much time saved!",
    rating: 5,
  },
  {
    name: "James K.",
    role: "Health Enthusiast",
    content:
      "The AI-generated plans are spot on with my dietary needs. Worth every penny!",
    rating: 5,
  },
];

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-emerald-600"
      >
        <span className="text-base font-medium text-gray-900">{question}</span>
        <ChevronDown
          className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-gray-600">{answer}</p>
        </div>
      </div>
    </div>
  );
}

function PlanIcon({ interval }: { interval: string }) {
  switch (interval) {
    case "week":
      return <Zap className="h-6 w-6" />;
    case "month":
      return <Crown className="h-6 w-6" />;
    case "year":
      return <Sparkles className="h-6 w-6" />;
    default:
      return <Zap className="h-6 w-6" />;
  }
}

export default function SubscribePage() {
  const { user } = useUser();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const userId = user?.id;
  const email = user?.emailAddresses?.[0]?.emailAddress || "";

  const mutation = useMutation<SubscribeResponse, Error, { planType: string }>({
    mutationFn: async ({ planType }) => {
      if (!userId) {
        throw new Error("User not signed in.");
      }
      return subscribeToPlan({ planType, userId, email });
    },
    onMutate: ({ planType }) => {
      setLoadingPlan(planType);
      toast.loading("Processing your subscription...", { id: "subscribe" });
    },
    onSuccess: (data) => {
      toast.success("Redirecting to checkout!", { id: "subscribe" });
      window.location.href = data.url;
    },
    onError: (error) => {
      setLoadingPlan(null);
      toast.error(error.message || "Something went wrong.", { id: "subscribe" });
    },
  });

  const handleSubscribe = (planType: string) => {
    if (!userId) {
      router.push("/sign-up");
      return;
    }
    mutation.mutate({ planType });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-emerald-50/30">
      <Toaster position="top-center" />

      {/* Hero Section */}
      <div className="relative overflow-hidden px-4 pb-12 pt-20 sm:px-6 lg:px-8">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-emerald-100/50 blur-3xl" />
          <div className="absolute -bottom-40 left-0 h-[500px] w-[500px] rounded-full bg-teal-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
            <Sparkles className="h-4 w-4" />
            <span>Simple, transparent pricing</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Choose your{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              perfect plan
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
            Start with our weekly plan to explore, then upgrade when you're
            ready. All plans include full access to AI-powered meal planning.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {availablePlans.map((plan, key) => {
            const isPopular = plan.isPopular;
            const isLoading = loadingPlan === plan.interval;

            return (
              <div
                key={key}
                className={`group relative flex flex-col rounded-3xl p-1 transition-all duration-300 ${
                  isPopular
                    ? "scale-[1.02] bg-gradient-to-b from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/25 lg:scale-105"
                    : "bg-white shadow-lg shadow-gray-200/50 hover:shadow-xl"
                }`}
              >
                <div
                  className={`relative flex h-full flex-col rounded-[20px] p-8 ${
                    isPopular ? "bg-white" : ""
                  }`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                        <Star className="h-4 w-4 fill-current" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="mb-6">
                    <div
                      className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                        isPopular
                          ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <PlanIcon interval={plan.interval} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold tracking-tight text-gray-900">
                        ${plan.amount}
                      </span>
                      <span className="ml-2 text-gray-500">
                        /{plan.interval}
                      </span>
                    </div>
                    {plan.interval === "year" && (
                      <p className="mt-2 text-sm font-medium text-emerald-600">
                        Save 40% compared to monthly
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="mb-8 flex-1 space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                            isPopular
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </div>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscribe(plan.interval)}
                    disabled={mutation.isPending}
                    className={`group/btn relative w-full overflow-hidden rounded-xl py-4 text-base font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70 ${
                      isPopular
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Get Started
                          <svg
                            className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Shield, text: "Secure Payment" },
              { icon: RefreshCcw, text: "Cancel Anytime" },
              { icon: Lock, text: "SSL Encrypted" },
              { icon: CreditCard, text: "Stripe Protected" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm"
              >
                <item.icon className="h-5 w-5 text-emerald-600" />
                <span className="text-center text-xs font-medium text-gray-600">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
              <Users className="h-4 w-4" />
              Loved by thousands
            </div>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              What our users say
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="relative rounded-2xl bg-gradient-to-br from-gray-50 to-emerald-50/50 p-8"
              >
                <div className="mb-4 flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="mb-6 text-gray-700">&quot;{testimonial.content}&quot;</p>
                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-gray-600">
              Everything you need to know about our plans
            </p>
          </div>

          <div className="mt-12 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to transform your meal planning?
          </h2>
          <p className="mt-4 text-lg text-emerald-100">
            Join thousands of happy users who save time and eat better every week.
          </p>
          <button
            onClick={() => handleSubscribe("month")}
            disabled={mutation.isPending}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-emerald-600 shadow-lg transition-all duration-300 hover:bg-emerald-50 hover:shadow-xl disabled:opacity-70"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Start Your Journey
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </>
            )}
          </button>
          <p className="mt-4 text-sm text-emerald-200">
            No credit card required to view plans • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
