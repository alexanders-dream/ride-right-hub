import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, Share2, Flag, MapPin, Gauge, Calendar, Palette, Cog, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import ImageGallery from "@/components/ImageGallery";
import SellerInfo from "@/components/SellerInfo";
import FinancingCalculator from "@/components/FinancingCalculator";
import ContactSellerDialog from "@/components/ContactSellerDialog";
import ReportListingDialog from "@/components/ReportListingDialog";
import ShareDialog from "@/components/ShareDialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { listingService, cartService, favoriteService } from "../database";
import { Listing } from "../types/database";
import { cn } from "@/lib/utils";

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    const loadListing = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          throw new Error("Listing ID is required");
        }

        const listingId = parseInt(id);
        const fetchedListing = await listingService.getListingById(listingId);
        
        if (!fetchedListing) {
          throw new Error("Listing not found");
        }

        setListing(fetchedListing);
        
        // Update view count
        await listingService.updateListingViews(listingId);
        
        // Check if saved (for authenticated users)
        if (user) {
          const saved = await favoriteService.isFavorite(user.id, listingId);
          setIsSaved(saved);
        }
      } catch (error) {
        console.error('Failed to load listing:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load listing",
          variant: "destructive",
        });
        navigate('/listings');
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [id, user, navigate, toast]);

  const handleAddToCart = async () => {
    if (!listing || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add items to cart",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    try {
      const success = await cartService.addToCart(listing.id);
      
      if (success) {
        addToCart({
          id: listing.id,
          make: listing.make,
          model: listing.model,
          year: listing.year,
          price: listing.price,
          mileage: listing.mileage,
          location: listing.location,
          sellerType: listing.seller_type,
          engineSize: listing.engine_size,
          color: listing.color,
          image: listing.images[0] || "/placeholder.svg"
        });
        
        toast({
          title: "Added to Cart",
          description: `${listing.make} ${listing.model} has been added to your cart`,
        });
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const handleSaveListing = async () => {
    if (!listing || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save listings",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    try {
      if (isSaved) {
        const success = await favoriteService.removeFromFavorites(user.id, listing.id);
        if (success) {
          setIsSaved(false);
          toast({
            title: "Removed from Favorites",
            description: "Listing has been removed from your favorites",
          });
        }
      } else {
        const success = await favoriteService.addToFavorites(user.id, listing.id);
        if (success) {
          setIsSaved(true);
          toast({
            title: "Added to Favorites",
            description: "Listing has been saved to your favorites",
          });
        }
      }
    } catch (error) {
      console.error('Failed to update favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading listing details...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-2">Listing Not Found</h1>
            <p className="text-muted-foreground mb-4">The listing you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/listings')}>
              Browse Other Listings
            </Button>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-8">
              <ImageGallery images={listing.images} />
              <div className="mt-4 flex items-center justify-between">
                <Badge variant="secondary" className="text-sm">
                  {listing.views || 0} views
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveListing}
                    className={cn(isSaved && "text-red-500")}
                  >
                    <Heart className={cn("h-4 w-4 mr-2", isSaved && "fill-current")} />
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowShare(true)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReport(true)}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </Button>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {listing.year} {listing.make} {listing.model}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {listing.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Listed {new Date(listing.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="text-4xl font-bold text-primary">
                ${listing.price.toLocaleString()}
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {listing.description || "No description provided."}
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Mileage:</span>
                    <span className="text-sm font-medium">{listing.mileage.toLocaleString()} miles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cog className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Engine:</span>
                    <span className="text-sm font-medium">{listing.engine_size}cc</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Color:</span>
                    <span className="text-sm font-medium">{listing.color}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Transmission:</span>
                    <span className="text-sm font-medium">{listing.transmission}</span>
                  </div>
                </div>
                {listing.vin && (
                  <div className="mt-4">
                    <span className="text-sm text-muted-foreground">VIN:</span>
                    <span className="ml-2 text-sm font-medium font-mono">{listing.vin}</span>
                  </div>
                )}
              </div>

              {/* Contact Section */}
              <div className="pt-6">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1"
                    size="lg"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowContact(true)}
                    className="flex-1"
                    size="lg"
                  >
                    Contact Seller
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Info */}
            <SellerInfo 
              name="Private Seller"
              rating={5}
              reviewCount={0}
              location={listing.location}
              memberSince="2024"
              totalListings={1}
            />
            
            {/* Financing Calculator */}
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="text-lg font-semibold mb-4">Financing Calculator</h3>
              <FinancingCalculator price={listing.price} />
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ContactSellerDialog
        open={showContact}
        onOpenChange={setShowContact}
        listingId={listing.id}
        listingTitle={`${listing.year} ${listing.make} ${listing.model}`}
      />
      
      <ReportListingDialog
        open={showReport}
        onOpenChange={setShowReport}
        listingId={listing.id}
      />
      
      <ShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        title={`${listing.year} ${listing.make} ${listing.model}`}
        url={window.location.href}
      />

      <Footer />
    </div>
  );
};

export default ListingDetail;