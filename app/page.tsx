"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  User,
  Settings,
  CheckCircle,
  ArrowRight,
  Zap,
  Heart,
  Clock,
  Star,
  Quote,
  BarChart3,
  Leaf,
  ChefHat,
} from "lucide-react";
import HeroCarousel from "@/components/hero-carousel";

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Fitness Enthusiast",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    content: "MealPlanAI has completely transformed how I approach nutrition. The personalized plans fit perfectly with my workout routine!",
    rating: 5
  },
  {
    name: "James Chen",
    role: "Busy Professional",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    content: "As someone with a hectic schedule, having my meals planned automatically saves me hours every week. Absolutely worth it!",
    rating: 5
  },
  {
    name: "Emily Rodriguez",
    role: "Mom of Three",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    content: "Finally, a meal planner that considers my whole family's preferences. The kids actually enjoy the meals now!",
    rating: 5
  }
];

const heroMetrics = [
  { value: "50K+", label: "Weekly plans generated" },
  { value: "92%", label: "Users stick to plans" },
  { value: "15m", label: "Average daily prep time" },
  { value: "4.9/5", label: "Average user rating" },
];

const showcaseImages = {
  leftTop:
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&auto=format&fit=crop&q=80",
  leftBottom:
    "https://images.unsplash.com/photo-1543353071-087092ec393a?w=1200&auto=format&fit=crop&q=80",
  center:
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1800&auto=format&fit=crop&q=80",
  rightTop:
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200&auto=format&fit=crop&q=80",
  rightExtraOne:
    "https://images.unsplash.com/photo-1528712306091-ed0763094c98?w=1200&auto=format&fit=crop&q=80",
  rightExtraTwo:
    "https://images.unsplash.com/photo-1555243896-c709bfa0b564?w=1200&auto=format&fit=crop&q=80",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f2fbf6] overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 lg:pt-16 lg:pb-24">
        <div className="absolute top-20 left-6 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-6 w-[28rem] h-[28rem] bg-emerald-300/20 rounded-full blur-3xl animate-float animation-delay-200" />
        
        <div className="relative w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-20">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-sm font-medium text-emerald-600 mb-6 animate-fade-up">
                <Sparkles className="w-4 h-4" />
                Powered by Advanced AI
              </div>
              
              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold leading-[0.95] mb-7 animate-fade-up animation-delay-100 tracking-tight">
                Personalized <span className="text-gradient">AI Meal Plans</span> Tailored to You
              </h1>
              
              <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0 animate-fade-up animation-delay-200 leading-relaxed">
                Let our AI do the planning. You focus on cooking and enjoying delicious, healthy meals that fit your lifestyle.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-up animation-delay-300">
                <Link href="/subscribe" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl gradient-hero text-white font-semibold shadow-soft hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5">
                  Start Free Trial <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition-colors">
                  See How It Works
                </a>
              </div>

              <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start animate-fade-up animation-delay-400">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> No credit card
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> 7-day free trial
                </div>
              </div>
            </div>

            <div className="relative order-1 lg:order-2 animate-fade-up animation-delay-200">
              <HeroCarousel />
              
              <div className="absolute -bottom-6 -left-6 glass rounded-xl p-4 shadow-card animate-float hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Chef-guided</p>
                    <p className="text-xs text-gray-500">Built for your routine</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 glass rounded-xl p-4 shadow-card animate-float animation-delay-300 hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">50K+</p>
                    <p className="text-xs text-gray-500">Happy users</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {heroMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-emerald-100/80 bg-white/85 backdrop-blur-sm p-4 sm:p-5"
              >
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700">
                  {metric.value}
                </p>
                <p className="text-sm sm:text-base text-gray-600 mt-1">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Showcase */}
      <section className="relative py-10 lg:py-16 bg-[#145041]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#11463a] via-[#145041] to-[#1a5e4d]" />
        <div className="relative w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-3 sm:gap-4">
            <div className="lg:col-span-3 space-y-3 sm:space-y-4">
              <div className="relative min-h-[190px] overflow-hidden rounded-2xl border border-white/20">
                <img src={showcaseImages.leftTop} alt="Structured Meal Planner" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                <p className="absolute left-5 bottom-4 text-white text-lg font-semibold tracking-tight">Structured Meal Planner</p>
              </div>
              <div className="relative min-h-[190px] overflow-hidden rounded-2xl border border-white/20">
                <img src={showcaseImages.leftBottom} alt="Family-Friendly Menus" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                <p className="absolute left-5 bottom-4 text-white text-lg font-semibold tracking-tight">Family-Friendly Menus</p>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative min-h-[396px] overflow-hidden rounded-2xl border border-white/20">
                <img src={showcaseImages.center} alt="Macro Balance Dashboard" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <p className="absolute left-5 bottom-4 text-white text-2xl font-semibold tracking-tight">Macro Balance Dashboard</p>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-3 sm:space-y-4">
              <div className="relative min-h-[190px] overflow-hidden rounded-2xl border border-white/20">
                <img src={showcaseImages.rightTop} alt="Recipe + Prep Guidance" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                <p className="absolute left-5 bottom-4 text-white text-lg font-semibold tracking-tight">Recipe + Prep Guidance</p>
              </div>

              <div className="min-h-[190px] rounded-2xl border border-emerald-200/40 bg-white/95 p-5 shadow-lg">
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Weekly Insights</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800">
                      <BarChart3 className="w-4 h-4" /> Macro Accuracy
                    </span>
                    <span className="text-sm font-bold text-emerald-700">94%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800">
                      <Leaf className="w-4 h-4" /> Fresh Ingredients
                    </span>
                    <span className="text-sm font-bold text-emerald-700">Top Pick</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800">
                      <ChefHat className="w-4 h-4" /> Prep Difficulty
                    </span>
                    <span className="text-sm font-bold text-emerald-700">Easy</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="relative h-28 overflow-hidden rounded-lg border border-emerald-100">
                    <img
                      src={showcaseImages.rightExtraOne}
                      alt="Family dinner with food"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <p className="absolute left-2 bottom-1 text-[11px] font-semibold text-white">
                      Family Dinner
                    </p>
                  </div>
                  <div className="relative h-28 overflow-hidden rounded-lg border border-emerald-100">
                    <img
                      src={showcaseImages.rightExtraTwo}
                      alt="People cooking with fresh food"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <p className="absolute left-2 bottom-1 text-[11px] font-semibold text-white">
                      Cooking Together
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Macro Guidance Section */}
      <section className="py-20 lg:py-24 bg-[#e9f7ef]">
        <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0f2a24] mb-6">
                Level Up With <span className="text-emerald-700">Macro Tracking</span>
              </h2>
              <p className="text-xl sm:text-2xl leading-relaxed text-[#24463d] max-w-2xl">
                Provide daily accountability and set flexible nutrition goals, so users can perform their best every day.
              </p>
              <div className="mt-8 flex flex-wrap gap-6 text-2xl text-[#173a31]">
                <span className="inline-flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-emerald-500" />
                  Protein
                </span>
                <span className="inline-flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-teal-500" />
                  Carbs
                </span>
                <span className="inline-flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-lime-500" />
                  Fat
                </span>
                <span className="inline-flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-emerald-700" />
                  Calories
                </span>
              </div>
            </div>
            <div className="relative rounded-3xl overflow-hidden border border-emerald-200 bg-white shadow-xl min-h-[420px]">
              <Image src="/meals/meal-2.jpg" alt="Macro tracking preview" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0d332a]/35 via-transparent to-[#145041]/30" />
              <div className="absolute left-6 top-6 rounded-xl bg-white/90 border border-emerald-100 px-4 py-3 text-base font-semibold text-emerald-800 shadow">
                Training day calories goal
              </div>
              <div className="absolute left-10 bottom-8 rounded-xl bg-emerald-700/95 px-5 py-3 text-base font-semibold text-white shadow-lg">
                Rest day calories goal
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 lg:py-32 relative bg-[#f4fbf7]">
        <div className="relative w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-20">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-sm font-medium text-emerald-600 mb-4">
              <Clock className="w-4 h-4" /> Quick Setup
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Get your personalized meal plan in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: User, title: "Create an Account", desc: "Sign up in seconds to access your personalized meal planning dashboard.", step: "01" },
              { icon: Settings, title: "Set Your Preferences", desc: "Input your dietary preferences, allergies, and health goals.", step: "02" },
              { icon: CheckCircle, title: "Receive Your Meal Plan", desc: "Get your AI-generated meal plan with recipes and shopping lists.", step: "03" }
            ].map((item) => (
              <div key={item.step} className="group relative">
                <div className="absolute -inset-1 gradient-hero rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500" />
                <div className="relative bg-white rounded-2xl p-8 shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 border border-emerald-100/70">
                  <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute top-8 right-8 text-6xl font-bold text-gray-100">{item.step}</div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href="/subscribe" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl gradient-hero text-white font-semibold shadow-soft hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5 animate-pulse-glow">
              Start Planning Today <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 lg:py-32 relative bg-[#eef8f2]">
        <div className="relative w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-20">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-sm font-medium text-emerald-600 mb-4">
              <Heart className="w-4 h-4" /> Loved by Thousands
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">What Our Users Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Join thousands who transformed their eating habits with MealPlanAI.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="group relative bg-white rounded-2xl p-8 shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 border border-emerald-100/70">
                <div className="absolute top-6 right-6 text-emerald-100">
                  <Quote className="w-10 h-10" />
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">{testimonial.content}</p>
                <div className="flex items-center gap-4">
                  <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-100" />
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 gradient-hero">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">Ready to Transform Your Meals?</h2>
          <p className="text-xl text-white/80 mb-8">Join thousands of happy users and start your journey to healthier eating today.</p>
          <Link href="/subscribe" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-emerald-600 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
