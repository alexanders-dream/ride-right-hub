import { useState, useEffect } from "react";
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
import { apiClient } from "@/services/api-client";

// Interface for listing data from API
interface Listing {
  id: string;
  year: number;
  make: string;
  model: string;
  price: number;
  mileage: number;
  location: string;
  engineSize: number;
  color: string;
  transmission?: string;
  vin?: string;
  description: string;
  sellerType: "dealer" | "private";
  status: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

// Default seller info (will be enhanced with real user data in future)
const defaultSeller = {
  name: "Seller",
  rating: 4.5,
  reviewCount: 0,
  location: "Unknown",
  memberSince: "2024",
  totalListings: 1,
};

const ListingDetail = () => {
  const { id } = useParams();
  const { addToCart, cartItems } = useCart();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Fetch listing data from API
  useEffect(() => {
    const fetchListing = async () => {
      if (!id) {
        setError('Listing ID is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.getListingById(id);
        setListing(response.listing);
      } catch (err) {
        console.error('Failed to fetch listing:', err);
        setError(err instanceof Error ? err.message : 'Failed to load listing');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const isInCart = listing ? cartItems.some(item => item.id === parseInt(listing.id.replace(/[^0-9]/g, '').slice(0, 8) || '1', 10)) : false;

  const handleAddToCart = () => {
    if (!listing) return;

    addToCart({
      id: parseInt(listing.id.replace(/[^0-9]/g, '').slice(0, 8) || '1', 10),
      image: "/placeholder.svg",
      year: listing.year,
      make: listing.make,
      model: listing.model,
      price: listing.price,
      mileage: listing.mileage,
      location: listing.location,
      sellerType: listing.sellerType,
      engineSize: listing.engineSize,
      color: listing.color,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading listing...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-destructive mb-2">Listing Not Found</h2>
              <p className="text-muted-foreground">{error || 'The listing you are looking for does not exist.'}</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={["/placeholder.svg"]} />

            {/* Title and Price */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">
                    {listing.year} {listing.make} {listing.model}
                  </h1>
                  <Badge variant="secondary">{listing.engineSize}cc</Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary mb-3">KSh {listing.price.toLocaleString()}</div>
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
                  <div className="font-semibold">{listing.mileage.toLocaleString()} mi</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Year</div>
                  <div className="font-semibold">{listing.year}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Palette className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Color</div>
                  <div className="font-semibold">{listing.color}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Cog className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Engine</div>
                  <div className="font-semibold">{listing.engineSize}cc</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-muted-foreground leading-relaxed">{listing.description}</p>
            </div>

            <Separator />

            {/* Specifications */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Specifications</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Make</span>
                  <span className="font-medium">{listing.make}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Model</span>
                  <span className="font-medium">{listing.model}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Year</span>
                  <span className="font-medium">{listing.year}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Mileage</span>
                  <span className="font-medium">{listing.mileage.toLocaleString()} mi</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Engine Size</span>
                  <span className="font-medium">{listing.engineSize}cc</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Transmission</span>
                  <span className="font-medium">{listing.transmission || "Not specified"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Color</span>
                  <span className="font-medium">{listing.color}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">VIN</span>
                  <span className="font-medium text-xs">{listing.vin || "Not specified"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            <SellerInfo 
              {...defaultSeller} 
              onContactSeller={() => setContactDialogOpen(true)}
            />
            <FinancingCalculator price={listing.price} />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ContactSellerDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        sellerName={defaultSeller.name}
        listingTitle={`${listing.year} ${listing.make} ${listing.model}`}
      />
      <ReportListingDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        listingId={parseInt(listing.id.replace(/[^0-9]/g, '').slice(0, 8) || '1', 10)}
      />
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title={`${listing.year} ${listing.make} ${listing.model}`}
        url={window.location.href}
      />

      <Footer />
    </div>
  );
};

export default ListingDetail;
