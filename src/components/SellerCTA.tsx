import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, Zap } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Maximum Exposure",
    description: "Reach thousands of qualified buyers actively searching for motorcycles"
  },
  {
    icon: Shield,
    title: "Verified Buyers",
    description: "Connect only with serious, verified buyers for peace of mind"
  },
  {
    icon: Zap,
    title: "Sell Fast",
    description: "Average listings sell in under 10 days with our optimized platform"
  }
];

const SellerCTA = () => {
  return (
    <section className="py-20 bg-gradient-accent relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Ready to Sell Your Motorcycle?
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Join our marketplace and connect with serious buyers in minutes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={benefit.title}
                className="text-center animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{benefit.title}</h3>
                <p className="text-white/80">{benefit.description}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-12 bg-white text-primary hover:bg-white/90"
          >
            List Your Bike for Free
          </Button>
          <p className="mt-4 text-white/70">No fees until you sell</p>
        </div>
      </div>
    </section>
  );
};

export default SellerCTA;
