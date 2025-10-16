import { Star, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SellerInfoProps {
  name: string;
  rating: number;
  reviewCount: number;
  location: string;
  memberSince: string;
  totalListings: number;
}

const SellerInfo = ({ name, rating, reviewCount, location, memberSince, totalListings }: SellerInfoProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Seller Information</h3>
      
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h4 className="font-semibold">{name}</h4>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
            <span>({reviewCount} reviews)</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Member since {memberSince}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{totalListings} active listings</span>
        </div>
      </div>

      <div className="space-y-2">
        <Button className="w-full">Contact Seller</Button>
        <Button variant="outline" className="w-full">View Profile</Button>
      </div>
    </Card>
  );
};

export default SellerInfo;
