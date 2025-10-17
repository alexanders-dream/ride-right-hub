import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

const listings = [
  {
    id: 1,
    title: "Harley-Davidson Street 750",
    price: "$7,999",
    year: 2021,
    mileage: "5,200 miles",
    location: "Los Angeles, CA",
    image: "https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=800&q=80",
    badge: "Featured"
  },
  {
    id: 2,
    title: "Yamaha YZF-R6",
    price: "$11,499",
    year: 2022,
    mileage: "2,100 miles",
    location: "Miami, FL",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80",
    badge: "New Arrival"
  },
  {
    id: 3,
    title: "BMW R 1250 GS Adventure",
    price: "$18,995",
    year: 2023,
    mileage: "1,500 miles",
    location: "Denver, CO",
    image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&q=80",
    badge: "Popular"
  },
];

const FeaturedListings = () => {
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
                    src={listing.image} 
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                    {listing.badge}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {listing.title}
                  </h3>
                  <span className="text-2xl font-bold text-primary">{listing.price}</span>
                </div>
                
                <div className="space-y-2 text-muted-foreground">
                  <p>{listing.year} • {listing.mileage}</p>
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
