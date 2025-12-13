"use client";

import Link from "next/link";
import { Sparkles, User, Settings, CheckCircle, ArrowRight, Zap, Heart, Clock, Star, Quote } from "lucide-react";
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold">MealPlanAI</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              <Link href="/subscribe" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Subscribe</Link>
              <Link href="/sign-up" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-hero text-white text-sm font-medium shadow-soft hover:opacity-90 transition-all hover:shadow-glow">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 lg:pt-28 lg:pb-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-float animation-delay-200" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-sm font-medium text-emerald-600 mb-6 animate-fade-up">
                <Sparkles className="w-4 h-4" />
                Powered by Advanced AI
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-up animation-delay-100">
                Personalized <span className="text-gradient">AI Meal Plans</span> Tailored to You
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-up animation-delay-200">
                Let our AI do the planning. You focus on cooking and enjoying delicious, healthy meals that fit your lifestyle.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-up animation-delay-300">
                <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl gradient-hero text-white font-semibold shadow-soft hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5">
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
                    <p className="text-sm font-semibold">AI Generated</p>
                    <p className="text-xs text-gray-500">In seconds</p>
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
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-32 relative bg-gray-50/50">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-sm font-medium text-emerald-600 mb-4">
              <Clock className="w-4 h-4" /> Quick Setup
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Get your personalized meal plan in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: User, title: "Create an Account", desc: "Sign up in seconds to access your personalized meal planning dashboard.", step: "01" },
              { icon: Settings, title: "Set Your Preferences", desc: "Input your dietary preferences, allergies, and health goals.", step: "02" },
              { icon: CheckCircle, title: "Receive Your Meal Plan", desc: "Get your AI-generated meal plan with recipes and shopping lists.", step: "03" }
            ].map((item) => (
              <div key={item.step} className="group relative">
                <div className="absolute -inset-1 gradient-hero rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500" />
                <div className="relative bg-white rounded-2xl p-8 shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 border border-gray-100">
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
            <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl gradient-hero text-white font-semibold shadow-soft hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5 animate-pulse-glow">
              Start Planning Today <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32 relative">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-sm font-medium text-emerald-600 mb-4">
              <Heart className="w-4 h-4" /> Loved by Thousands
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Join thousands who transformed their eating habits with MealPlanAI.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="group relative bg-white rounded-2xl p-8 shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 border border-gray-100">
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
      <section className="py-20 gradient-hero">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Transform Your Meals?</h2>
          <p className="text-lg text-white/80 mb-8">Join thousands of happy users and start your journey to healthier eating today.</p>
          <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-emerald-600 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
