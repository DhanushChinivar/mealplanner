"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const carouselSlides = [
  {
    image: "/meals/meal-1.jpg", // Add your images to public/meals/
    title: "Enjoy Every Bite",
    subtitle: "Fresh salads tailored to your taste"
  },
  {
    image: "/meals/meal-2.jpg",
    title: "Meal Prep Made Easy",
    subtitle: "Healthy proteins and vegetables ready to go"
  },
  {
    image: "/meals/meal-3.jpg",
    title: "Cook Together",
    subtitle: "Family-friendly recipes for quality time"
  },
  {
    image: "/meals/meal-4.jpg",
    title: "Family Dinners",
    subtitle: "Bring everyone to the table"
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
    <div className="relative rounded-2xl overflow-hidden shadow-card aspect-square">
      {carouselSlides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
        >
          <Image src={slide.image} alt={slide.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className={`absolute bottom-0 left-0 right-0 p-6 text-white transition-all duration-500 ${
            index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}>
            <h3 className="text-2xl font-bold mb-1">{slide.title}</h3>
            <p className="text-white/80">{slide.subtitle}</p>
          </div>
        </div>
      ))}

      <button onClick={prevSlide} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-colors">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={nextSlide} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-colors">
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
