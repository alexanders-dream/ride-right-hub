import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedListings from "@/components/FeaturedListings";
import CategoryBrowse from "@/components/CategoryBrowse";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import SellerCTA from "@/components/SellerCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturedListings />
      <CategoryBrowse />
      <HowItWorks />
      <Testimonials />
      <SellerCTA />
      <Footer />
    </main>
  );
};

export default Index;
