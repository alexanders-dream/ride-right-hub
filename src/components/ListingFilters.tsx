import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

const ListingFilters = () => {
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [distance, setDistance] = useState([50]);

  return (
    <div className="space-y-6 bg-card p-6 rounded-lg border border-border">
      <div>
        <h3 className="font-semibold text-lg mb-4">Filters</h3>
      </div>

      {/* Make */}
      <div className="space-y-2">
        <Label>Make</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="All Makes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Makes</SelectItem>
            <SelectItem value="harley">Harley-Davidson</SelectItem>
            <SelectItem value="yamaha">Yamaha</SelectItem>
            <SelectItem value="honda">Honda</SelectItem>
            <SelectItem value="bmw">BMW</SelectItem>
            <SelectItem value="ducati">Ducati</SelectItem>
            <SelectItem value="kawasaki">Kawasaki</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Model */}
      <div className="space-y-2">
        <Label>Model</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="All Models" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Year */}
      <div className="space-y-2">
        <Label>Year</Label>
        <div className="flex gap-2">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 20 }, (_, i) => 2024 - i).map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Max" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 20 }, (_, i) => 2024 - i).map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label>Price Range</Label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={50000}
          step={1000}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>${priceRange[0].toLocaleString()}</span>
          <span>${priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      {/* Distance */}
      <div className="space-y-3">
        <Label>Distance from me</Label>
        <Slider
          value={distance}
          onValueChange={setDistance}
          max={500}
          step={10}
          className="w-full"
        />
        <p className="text-sm text-muted-foreground">{distance[0]} miles</p>
      </div>

      {/* Mileage */}
      <div className="space-y-2">
        <Label>Mileage</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="under5k">Under 5,000</SelectItem>
            <SelectItem value="5k-10k">5,000 - 10,000</SelectItem>
            <SelectItem value="10k-20k">10,000 - 20,000</SelectItem>
            <SelectItem value="20k-40k">20,000 - 40,000</SelectItem>
            <SelectItem value="over40k">Over 40,000</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Engine Size */}
      <div className="space-y-2">
        <Label>Engine Size (cc)</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="under500">Under 500cc</SelectItem>
            <SelectItem value="500-750">500cc - 750cc</SelectItem>
            <SelectItem value="750-1000">750cc - 1000cc</SelectItem>
            <SelectItem value="1000-1500">1000cc - 1500cc</SelectItem>
            <SelectItem value="over1500">Over 1500cc</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label>Color</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="black">Black</SelectItem>
            <SelectItem value="white">White</SelectItem>
            <SelectItem value="red">Red</SelectItem>
            <SelectItem value="blue">Blue</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="green">Green</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Seller Type */}
      <div className="space-y-2">
        <Label>Seller Type</Label>
        <RadioGroup defaultValue="all">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all" className="font-normal">All</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="private" id="private" />
            <Label htmlFor="private" className="font-normal">Private Seller</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dealer" id="dealer" />
            <Label htmlFor="dealer" className="font-normal">Dealer</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Sort By */}
      <div className="space-y-2 pt-4 border-t border-border">
        <Label>Sort By</Label>
        <Select defaultValue="newest">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest Listings</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="mileage">Mileage: Low to High</SelectItem>
            <SelectItem value="distance">Distance: Nearest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button className="w-full" variant="outline">Reset Filters</Button>
    </div>
  );
};

export default ListingFilters;
