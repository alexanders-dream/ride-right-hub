import { Search, FileCheck, Key, Handshake } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Search & Discover",
    description: "Browse thousands of motorcycles with advanced filters and detailed listings"
  },
  {
    icon: FileCheck,
    title: "Verify & Compare",
    description: "Review verified seller information, photos, and service history"
  },
  {
    icon: Handshake,
    title: "Connect & Negotiate",
    description: "Message sellers directly and arrange test rides with confidence"
  },
  {
    icon: Key,
    title: "Complete Your Purchase",
    description: "Finalize the deal with secure payment options and transfer assistance"
  }
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-secondary">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground">Simple steps to your dream motorcycle</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.title}
                className="text-center group animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-2 border-primary mb-6 group-hover:bg-primary group-hover:shadow-glow transition-all duration-300">
                  <Icon className="w-10 h-10 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                
                <div className="relative mb-4">
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-border" />
                  )}
                </div>
                
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
