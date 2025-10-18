import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Search, MessageSquare, CreditCard, CheckCircle, Upload, Users } from "lucide-react";

const HowItWorksPage = () => {
  const navigate = useNavigate();

  const buyerSteps = [
    {
      icon: Search,
      title: "Browse Listings",
      description: "Search our extensive collection of motorcycles by make, model, price, and location"
    },
    {
      icon: MessageSquare,
      title: "Contact Sellers",
      description: "Message sellers directly to ask questions, schedule viewings, and arrange test rides"
    },
    {
      icon: CreditCard,
      title: "Make an Offer",
      description: "Negotiate price and finalize the deal with secure payment options"
    },
    {
      icon: CheckCircle,
      title: "Complete Purchase",
      description: "Meet in person, complete the transaction, and ride away on your new bike"
    }
  ];

  const sellerSteps = [
    {
      icon: Upload,
      title: "Create Your Listing",
      description: "Upload photos, add details, and set your asking price in minutes"
    },
    {
      icon: Users,
      title: "Connect with Buyers",
      description: "Receive inquiries from interested buyers and respond to questions"
    },
    {
      icon: MessageSquare,
      title: "Arrange Viewings",
      description: "Schedule test rides and meetings at your convenience"
    },
    {
      icon: CheckCircle,
      title: "Finalize the Sale",
      description: "Complete the transaction securely and transfer ownership"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">How It Works</h1>
            <p className="text-muted-foreground text-lg">
              Simple, secure, and straightforward motorcycle buying and selling
            </p>
          </div>

          {/* For Buyers */}
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">For Buyers</h2>
              <p className="text-muted-foreground">Find your perfect ride in four easy steps</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {buyerSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Card key={index} className="relative hover:shadow-lg transition-shadow">
                    <div className="absolute -top-4 -left-4 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                      {index + 1}
                    </div>
                    <CardHeader>
                      <div className="p-3 bg-primary/10 rounded-lg w-fit mb-2">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="text-center">
              <Button size="lg" onClick={() => navigate("/listings")}>
                Start Browsing Motorcycles
              </Button>
            </div>
          </section>

          {/* For Sellers */}
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">For Sellers</h2>
              <p className="text-muted-foreground">List and sell your motorcycle with ease</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {sellerSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Card key={index} className="relative hover:shadow-lg transition-shadow">
                    <div className="absolute -top-4 -left-4 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                      {index + 1}
                    </div>
                    <CardHeader>
                      <div className="p-3 bg-primary/10 rounded-lg w-fit mb-2">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="text-center">
              <Button size="lg" onClick={() => navigate("/sell")}>
                List Your Motorcycle
              </Button>
            </div>
          </section>

          {/* Why Choose Us */}
          <section>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Why Choose Our Platform?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🔒</div>
                    <h3 className="font-semibold mb-2">Secure Transactions</h3>
                    <p className="text-sm text-muted-foreground">
                      Safe and secure payment processing with buyer protection
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl mb-2">🚀</div>
                    <h3 className="font-semibold mb-2">Quick & Easy</h3>
                    <p className="text-sm text-muted-foreground">
                      List your bike in minutes or find your dream ride fast
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl mb-2">💬</div>
                    <h3 className="font-semibold mb-2">Direct Communication</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect directly with buyers and sellers without middlemen
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorksPage;
