"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
const carouselSlides = [
  {
    image:
      "https://images.unsplash.com/photo-1484980972926-edee96e0960d?w=1800&auto=format&fit=crop&q=80",
    title: "Weeknight Cooking",
    subtitle: "Simple meals with real ingredients"
  },
  {
    image:
      "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=1800&auto=format&fit=crop&q=80",
    title: "Meal Prep That Sticks",
    subtitle: "Practical prep for busy schedules"
  },
  {
    image:
      "https://images.unsplash.com/photo-1528712306091-ed0763094c98?w=1800&auto=format&fit=crop&q=80",
    title: "Cook Together",
    subtitle: "Family-friendly recipes for real life"
  },
  {
    image:
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1800&auto=format&fit=crop&q=80",
    title: "Family Dinners",
    subtitle: "Comfort food without the guesswork"
  },
  {
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1800&auto=format&fit=crop&q=80",
    title: "Cooking With Kids",
    subtitle: "Fun meals everyone can help make"
  },
  {
    image:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1800&auto=format&fit=crop&q=80",
    title: "Weekend Family Prep",
    subtitle: "Plan and cook together"
  }
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-card aspect-[4/5] sm:aspect-[6/5] lg:aspect-[5/4] border border-white/50">
      {carouselSlides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
        >
          <img src={slide.image} alt={slide.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          <div className={`absolute bottom-0 left-0 right-0 p-7 text-white transition-all duration-500 ${
            index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}>
            <h3 className="text-3xl font-bold mb-1 tracking-tight">{slide.title}</h3>
            <p className="text-white/85 text-base">{slide.subtitle}</p>
          </div>
        </div>
      ))}

      <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-colors">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-colors">
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
        {carouselSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide ? "w-6 bg-white" : "bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
