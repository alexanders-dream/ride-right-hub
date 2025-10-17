import { useState } from "react";
import { useParams } from "react-router-dom";
import { Heart, Share2, Flag, MapPin, Gauge, Calendar, Palette, Cog, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ImageGallery from "@/components/ImageGallery";
import SellerInfo from "@/components/SellerInfo";
import FinancingCalculator from "@/components/FinancingCalculator";
import ContactSellerDialog from "@/components/ContactSellerDialog";
import ReportListingDialog from "@/components/ReportListingDialog";
import ShareDialog from "@/components/ShareDialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

// Mock data - in real app this would come from API
const mockListing = {
  id: 1,
  year: 2022,
  make: "Harley-Davidson",
  model: "Street Glide",
  price: 24999,
  mileage: 3200,
  location: "Los Angeles, CA",
  engineSize: 1868,
  color: "Black",
  transmission: "6-Speed Manual",
  vin: "1HD1KEM19NB123456",
  description: "This beautiful 2022 Harley-Davidson Street Glide is in excellent condition with only 3,200 miles. Always garage-kept and regularly maintained. Features include upgraded exhaust, custom seat, and premium sound system. Non-smoking owner, no accidents. All service records available.",
  images: [
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
  ],
  seller: {
    name: "John Rider",
    rating: 4.8,
    reviewCount: 24,
    location: "Los Angeles, CA",
    memberSince: "2019",
    totalListings: 3,
  },
};

const ListingDetail = () => {
  const { id } = useParams();
  const { addToCart, cartItems } = useCart();
  const [saved, setSaved] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const isInCart = cartItems.some(item => item.id === mockListing.id);

  const handleAddToCart = () => {
    addToCart({
      id: mockListing.id,
      image: mockListing.images[0],
      year: mockListing.year,
      make: mockListing.make,
      model: mockListing.model,
      price: mockListing.price,
      mileage: mockListing.mileage,
      location: mockListing.location,
      sellerType: "dealer",
      engineSize: mockListing.engineSize,
      color: mockListing.color,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={mockListing.images} />

            {/* Title and Price */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">
                    {mockListing.year} {mockListing.make} {mockListing.model}
                  </h1>
                  <Badge variant="secondary">{mockListing.engineSize}cc</Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{mockListing.location}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary mb-3">${mockListing.price.toLocaleString()}</div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setSaved(!saved)}
                  >
                    <Heart className={cn("h-5 w-5", saved && "fill-current text-primary")} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setReportDialogOpen(true)}
                  >
                    <Flag className="h-5 w-5" />
                  </Button>
                </div>
                <Button 
                  className="w-full mt-4 gap-2" 
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isInCart}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {isInCart ? 'In Cart' : 'Add to Cart'}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Key Specs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Gauge className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Mileage</div>
                  <div className="font-semibold">{mockListing.mileage.toLocaleString()} mi</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Year</div>
                  <div className="font-semibold">{mockListing.year}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Palette className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Color</div>
                  <div className="font-semibold">{mockListing.color}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Cog className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Engine</div>
                  <div className="font-semibold">{mockListing.engineSize}cc</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-muted-foreground leading-relaxed">{mockListing.description}</p>
            </div>

            <Separator />

            {/* Specifications */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Specifications</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Make</span>
                  <span className="font-medium">{mockListing.make}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Model</span>
                  <span className="font-medium">{mockListing.model}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Year</span>
                  <span className="font-medium">{mockListing.year}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Mileage</span>
                  <span className="font-medium">{mockListing.mileage.toLocaleString()} mi</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Engine Size</span>
                  <span className="font-medium">{mockListing.engineSize}cc</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Transmission</span>
                  <span className="font-medium">{mockListing.transmission}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Color</span>
                  <span className="font-medium">{mockListing.color}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">VIN</span>
                  <span className="font-medium text-xs">{mockListing.vin}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            <SellerInfo 
              {...mockListing.seller} 
              onContactSeller={() => setContactDialogOpen(true)}
            />
            <FinancingCalculator price={mockListing.price} />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ContactSellerDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        sellerName={mockListing.seller.name}
        listingTitle={`${mockListing.year} ${mockListing.make} ${mockListing.model}`}
      />
      <ReportListingDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        listingId={mockListing.id}
      />
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title={`${mockListing.year} ${mockListing.make} ${mockListing.model}`}
        url={window.location.href}
      />

      <Footer />
    </div>
  );
};

export default ListingDetail;
