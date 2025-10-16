import { useState } from "react";
import { Search, Grid3x3, List, Map as MapIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Navbar from "@/components/Navbar";
import ListingFilters from "@/components/ListingFilters";
import ListingCard from "@/components/ListingCard";
import Footer from "@/components/Footer";

// Mock data
const mockListings = [
  {
    id: 1,
    image: "/placeholder.svg",
    year: 2022,
    make: "Harley-Davidson",
    model: "Street Glide",
    price: 24999,
    mileage: 3200,
    location: "Los Angeles, CA",
    sellerType: "dealer" as const,
    engineSize: 1868,
    color: "Black"
  },
  {
    id: 2,
    image: "/placeholder.svg",
    year: 2021,
    make: "Yamaha",
    model: "YZF-R1",
    price: 16500,
    mileage: 5800,
    location: "San Diego, CA",
    sellerType: "private" as const,
    engineSize: 998,
    color: "Blue"
  },
  {
    id: 3,
    image: "/placeholder.svg",
    year: 2023,
    make: "BMW",
    model: "R 1250 GS",
    price: 19999,
    mileage: 1200,
    location: "Phoenix, AZ",
    sellerType: "dealer" as const,
    engineSize: 1254,
    color: "White"
  },
  {
    id: 4,
    image: "/placeholder.svg",
    year: 2020,
    make: "Ducati",
    model: "Panigale V4",
    price: 22000,
    mileage: 4500,
    location: "Las Vegas, NV",
    sellerType: "private" as const,
    engineSize: 1103,
    color: "Red"
  },
  {
    id: 5,
    image: "/placeholder.svg",
    year: 2022,
    make: "Honda",
    model: "Gold Wing",
    price: 28500,
    mileage: 2100,
    location: "Denver, CO",
    sellerType: "dealer" as const,
    engineSize: 1833,
    color: "Silver"
  },
  {
    id: 6,
    image: "/placeholder.svg",
    year: 2021,
    make: "Kawasaki",
    model: "Ninja ZX-10R",
    price: 15999,
    mileage: 6200,
    location: "Austin, TX",
    sellerType: "private" as const,
    engineSize: 998,
    color: "Green"
  },
];

const Listings = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedListings, setSavedListings] = useState<number[]>([]);

  const toggleSave = (id: number) => {
    setSavedListings(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header with Search */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by make, model, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button>Search</Button>
          </div>
          
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>All Motorcycles</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <ListingFilters />
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* View Controls & Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{mockListings.length}</span> motorcycles
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("map")}
                >
                  <MapIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Listings */}
            {viewMode === "map" ? (
              <div className="bg-muted rounded-lg h-[600px] flex items-center justify-center">
                <p className="text-muted-foreground">Map view coming soon</p>
              </div>
            ) : (
              <div className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }>
                {mockListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    viewMode={viewMode}
                    isSaved={savedListings.includes(listing.id)}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Listings;
