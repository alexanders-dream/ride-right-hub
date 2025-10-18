import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Camera, FileText, DollarSign, Users, Shield, Clock } from "lucide-react";

const SellerTips = () => {
  const tips = [
    {
      icon: Camera,
      title: "Take Great Photos",
      description: "High-quality photos increase buyer interest by 50%",
      details: [
        "Clean your motorcycle thoroughly before photographing",
        "Take photos in good natural lighting, preferably outdoors",
        "Capture all angles: front, back, both sides, and close-ups of unique features",
        "Show any damage or wear honestly",
        "Include photos of odometer, VIN, and service records",
        "Aim for at least 10-15 high-resolution photos"
      ]
    },
    {
      icon: FileText,
      title: "Write Compelling Descriptions",
      description: "Detailed listings sell 40% faster",
      details: [
        "List all specifications: year, make, model, mileage, engine size",
        "Describe condition honestly and comprehensively",
        "Mention all modifications and upgrades",
        "Include service history and maintenance records",
        "Highlight unique features or selling points",
        "Be transparent about any issues or repairs needed"
      ]
    },
    {
      icon: DollarSign,
      title: "Price It Right",
      description: "Competitive pricing attracts serious buyers",
      details: [
        "Research similar motorcycles in your area",
        "Use our pricing guide tool for market value estimates",
        "Consider season - spring/summer command higher prices",
        "Price slightly above your minimum to allow negotiation room",
        "Be prepared to justify your asking price",
        "Update price if no interest after 2-3 weeks"
      ]
    },
    {
      icon: Users,
      title: "Respond Quickly",
      description: "Fast responses increase sale probability by 60%",
      details: [
        "Reply to inquiries within 2-4 hours",
        "Be professional and courteous in all communications",
        "Answer questions thoroughly and honestly",
        "Be available for test rides by appointment",
        "Provide additional photos or information when requested",
        "Keep interested buyers updated"
      ]
    },
    {
      icon: Shield,
      title: "Stay Safe",
      description: "Protect yourself during the selling process",
      details: [
        "Meet buyers in public, well-lit locations",
        "Bring a friend to showings and test rides",
        "Verify buyer identity before test rides",
        "Request proof of motorcycle license",
        "Hold onto title until payment clears",
        "Accept secure payment methods only (no wire transfers)",
        "Create a bill of sale documenting the transaction"
      ]
    },
    {
      icon: Clock,
      title: "Timing Matters",
      description: "List at the right time for maximum exposure",
      details: [
        "Spring (March-May) is peak buying season",
        "List on weekends for maximum visibility",
        "Avoid major holidays when buyers are busy",
        "Consider weather - sunny days attract more viewers",
        "Be patient - quality bikes sell within 4-6 weeks",
        "Update your listing every few days to stay visible"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Seller Tips & Best Practices</h1>
            <p className="text-muted-foreground text-lg">
              Expert advice to help you sell your motorcycle faster and for more money
            </p>
          </div>

          <div className="grid gap-6 mb-12">
            {tips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div>{tip.title}</div>
                        <div className="text-sm font-normal text-muted-foreground mt-1">
                          {tip.description}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tip.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-1">✓</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How long does it take to sell a motorcycle?</AccordionTrigger>
                  <AccordionContent>
                    On average, motorcycles sell within 4-6 weeks when priced competitively. Factors like season,
                    price, and condition significantly impact sale speed. Spring and summer sales are typically faster.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Should I allow test rides?</AccordionTrigger>
                  <AccordionContent>
                    Yes, serious buyers will want to test ride. Always verify their motorcycle license, take a photo
                    of their ID, and consider riding alongside them. Meet in a safe public location and bring a friend.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>What payment methods should I accept?</AccordionTrigger>
                  <AccordionContent>
                    Cash, cashier's checks, and verified bank transfers are safest. Avoid personal checks, wire transfers,
                    or payment apps for large amounts. Wait for funds to clear before transferring the title.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Do I need to provide a warranty?</AccordionTrigger>
                  <AccordionContent>
                    Private sales are typically "as-is" with no warranty. Be transparent about the bike's condition
                    and any known issues. Consider offering recent service records to build buyer confidence.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SellerTips;
