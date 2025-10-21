import { useState, useEffect } from "react";
import { Search, Grid3x3, List, Map as MapIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import ListingFilters from "@/components/ListingFilters";
import ListingCard from "@/components/ListingCard";
import Footer from "@/components/Footer";
import { listingService } from "../database";
import { Listing } from "../types/database";



const Listings = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedListings, setSavedListings] = useState<number[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        const allListings = listingService.getAllListings();
        setListings(allListings);
      } catch (error) {
        console.error('Failed to load listings:', error);
        toast({
          title: "Error",
          description: "Failed to load listings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, [toast]);

  // Filter listings based on search query
  const filteredListings = listings.filter(listing => {
    const searchLower = searchQuery.toLowerCase();
    return (
      listing.make.toLowerCase().includes(searchLower) ||
      listing.model.toLowerCase().includes(searchLower) ||
      listing.location.toLowerCase().includes(searchLower) ||
      listing.year.toString().includes(searchLower)
    );
  });

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
                Showing <span className="font-semibold text-foreground">{filteredListings.length}</span> motorcycles
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
                {filteredListings.length > 0 ? (
                  filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      viewMode={viewMode}
                      isSaved={savedListings.includes(listing.id)}
                      onToggleSave={toggleSave}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">No motorcycles found matching your search.</p>
                  </div>
                )}
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
