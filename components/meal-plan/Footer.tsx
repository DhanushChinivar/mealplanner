import { Heart, Utensils } from 'lucide-react';

const healthTips = [
  "Drink 8 glasses of water daily for optimal hydration.",
  "Eating colorful vegetables ensures a variety of nutrients.",
  "Protein at every meal helps maintain muscle mass.",
  "Meal prepping saves time and promotes healthier choices.",
  "Fiber-rich foods keep you feeling full longer.",
];

export function MealPlanFooter() {
  const randomTip = healthTips[Math.floor(Math.random() * healthTips.length)];

  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Health tip */}
        <div className="text-center mb-8 pb-8 border-b border-border/50">
          <p className="text-sm text-muted-foreground italic">
            💡 <span className="font-medium">Tip:</span> {randomTip}
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-md">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">MealPlanAI</h3>
              <p className="text-sm text-muted-foreground">Smart nutrition made simple</p>
            </div>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </nav>

          {/* Copyright */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>for healthy living</span>
          </div>
        </div>

        <div className="text-center mt-8 pt-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MealPlanAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
