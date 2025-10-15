import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import heroImage from "@/assets/hero-motorcycle.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Motorcycle on open road" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/50" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 md:px-6">
        <div className="max-w-3xl space-y-8 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Find Your Freedom
            <span className="block text-primary mt-2">On Two Wheels</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
            Discover premium motorcycles from trusted sellers. Your next adventure starts here.
          </p>

          {/* Search Bar */}
          <div className="flex gap-2 bg-card p-2 rounded-lg shadow-card max-w-2xl">
            <input
              type="text"
              placeholder="Search by make, model, or location..."
              className="flex-1 bg-transparent border-0 focus:outline-none px-4 text-foreground placeholder:text-muted-foreground"
            />
            <Button size="lg" className="gap-2">
              <Search className="w-5 h-5" />
              Search
            </Button>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="text-lg px-8" asChild>
              <a href="/listings">Shop All Motorcycles</a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Sell Your Bike
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
