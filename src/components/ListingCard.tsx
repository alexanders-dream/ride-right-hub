import { Heart, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Listing {
  id: number;
  image?: string;
  images?: string[];
  year: number;
  make: string;
  model: string;
  price: number;
  mileage: number;
  location: string;
  sellerType?: "dealer" | "private";
  seller_type?: "dealer" | "private";
  engineSize?: number;
  engine_size?: number;
  color: string;
}

interface ListingCardProps {
  listing: Listing;
  viewMode: "grid" | "list";
  isSaved: boolean;
  onToggleSave: (id: number) => void;
}

const ListingCard = ({ listing, viewMode, isSaved, onToggleSave }: ListingCardProps) => {
  const displayImage = listing.image || listing.images?.[0] || '/placeholder.svg';
  const sellerType = listing.sellerType || listing.seller_type || 'private';
  const engineSize = listing.engineSize || listing.engine_size || 0;
  
  if (viewMode === "list") {
    return (
      <Link to={`/listing/${listing.id}`}>
        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex">
          <div className="w-64 h-48 flex-shrink-0 relative">
            <img
              src={listing.image}
              alt={`${listing.year} ${listing.make} ${listing.model}`}
              className="w-full h-full object-cover"
            />
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background",
                isSaved && "text-primary"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(listing.id);
              }}
            >
              <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
            </Button>
          </div>
          <CardContent className="flex-1 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1">
                  {listing.year} {listing.make} {listing.model}
                </h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location}</span>
                  <Badge variant={listing.sellerType === "dealer" ? "default" : "secondary"}>
                    {listing.sellerType === "dealer" ? "Dealer" : "Private"}
                  </Badge>
                </div>
              </div>
              <p className="text-3xl font-bold text-primary">
                ${listing.price.toLocaleString()}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Mileage</p>
                <p className="font-semibold">{listing.mileage.toLocaleString()} mi</p>
              </div>
              <div>
                <p className="text-muted-foreground">Engine</p>
                <p className="font-semibold">{listing.engineSize}cc</p>
              </div>
              <div>
                <p className="text-muted-foreground">Color</p>
                <p className="font-semibold">{listing.color}</p>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
      </Link>
    );
  }

  return (
    <Link to={`/listing/${listing.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
        <div className="relative">
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={listing.image}
            alt={`${listing.year} ${listing.make} ${listing.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background",
            isSaved && "text-primary"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(listing.id);
          }}
        >
          <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
        </Button>
        <Badge 
          variant={listing.sellerType === "dealer" ? "default" : "secondary"}
          className="absolute bottom-2 left-2"
        >
          {listing.sellerType === "dealer" ? "Dealer" : "Private"}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-bold text-foreground mb-2">
          {listing.year} {listing.make} {listing.model}
        </h3>
        <p className="text-2xl font-bold text-primary mb-3">
          ${listing.price.toLocaleString()}
        </p>
        <div className="space-y-1 text-sm text-muted-foreground mb-3">
          <p>{listing.mileage.toLocaleString()} mi · {listing.engineSize}cc</p>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{listing.location}</span>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};

export default ListingCard;
