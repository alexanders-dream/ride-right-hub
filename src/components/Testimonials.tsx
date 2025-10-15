import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Michael Rodriguez",
    location: "Austin, TX",
    text: "Sold my Ducati in less than a week! The platform made it incredibly easy to connect with serious buyers.",
    rating: 5
  },
  {
    name: "Sarah Chen",
    location: "Portland, OR",
    text: "Found my dream BMW Adventure bike at an amazing price. The verification process gave me peace of mind.",
    rating: 5
  },
  {
    name: "James Patterson",
    location: "Nashville, TN",
    text: "Best motorcycle marketplace I've used. Clean interface, responsive sellers, and great deals.",
    rating: 5
  }
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Trusted by Riders</h2>
          <p className="text-xl text-muted-foreground">Join thousands of satisfied buyers and sellers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.name}
              className="border-border hover:border-primary transition-colors animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                
                <p className="text-foreground mb-4 italic">"{testimonial.text}"</p>
                
                <div className="border-t border-border pt-4">
                  <p className="font-bold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
