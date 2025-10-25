import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/services/api-client";

interface Listing {
  id: string;
  title: string;
  price: number;
  year: number;
  mileage: number;
  location: string;
  image?: string;
  featured: boolean;
  status: string;
  make: string;
  model: string;
}

const FeaturedListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        // Search for featured and active listings
        const response = await apiClient.searchListings({
          status: 'active',
          featured: true,
          limit: 6,
          page: 1
        });
        setListings(response.listings);
      } catch (error) {
        console.error('Error fetching featured listings:', error);
        // Fallback to showing any active listings if featured ones aren't available
        try {
          const fallbackResponse = await apiClient.searchListings({
            status: 'active',
            limit: 6,
            page: 1
          });
          setListings(fallbackResponse.listings);
        } catch (fallbackError) {
          console.error('Error fetching fallback listings:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedListings();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-KE').format(mileage) + ' miles';
  };

  const getBadgeType = (listing: Listing) => {
    if (listing.featured) return 'Featured';
    if (listing.year >= new Date().getFullYear() - 1) return 'New';
    return 'Popular';
  };

  const getImageUrl = (listing: Listing) => {
    // Use placeholder image if no image is available
    return listing.image || 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=800&q=80';
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-hero">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Featured Motorcycles</h2>
            <p className="text-xl text-muted-foreground">Loading premium rides...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader className="p-0">
                  <div className="aspect-[4/3] bg-muted" />
                </CardHeader>
                <CardContent className="p-6 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return (
      <section className="py-20 bg-gradient-hero">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Featured Motorcycles</h2>
            <p className="text-xl text-muted-foreground">No featured listings available yet</p>
          </div>
          <div className="text-center">
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
              <a href="/listings">Browse All Listings</a>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-hero">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Featured Motorcycles</h2>
          <p className="text-xl text-muted-foreground">Handpicked premium rides waiting for their next owner</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {listings.map((listing, index) => (
            <Card 
              key={listing.id} 
              className="group overflow-hidden border-border hover:border-primary transition-all duration-300 hover:shadow-glow animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="p-0">
                <div className="relative overflow-hidden aspect-[4/3]">
                  <img 
                    src={getImageUrl(listing)} 
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                    {getBadgeType(listing)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {listing.title}
                  </h3>
                  <span className="text-2xl font-bold text-primary">{formatPrice(listing.price)}</span>
                </div>
                
                <div className="space-y-2 text-muted-foreground">
                  <p>{listing.year} • {formatMileage(listing.mileage)}</p>
                  <p className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {listing.location}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                <Button className="w-full" variant="outline" asChild>
                  <a href={`/listing/${listing.id}`}>View Details</a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
            <a href="/listings">View All Listings</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
