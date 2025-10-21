import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Search, MessageSquare, Settings, BarChart3, Edit, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { listingService, favoriteService, savedSearchService, messageService } from '../database';
import { Listing, Favorite, SavedSearch, User } from '../types/database';



const Dashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [messages, setMessages] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!user) return;

    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Load user's listings
        const userListings = listingService.getListingsBySeller(user.id);
        setListings(userListings);
        
        // Load user's favorites
        const userFavorites = favoriteService.getUserFavorites(user.id);
        setFavorites(userFavorites);
        
        // Load user's saved searches
        const userSavedSearches = savedSearchService.getSavedSearches(user.id);
        setSavedSearches(userSavedSearches);
        
        // Load user's messages
        const userMessages = messageService.getUserMessages(user.id);
        setMessages(userMessages);
        
      } catch (error) {
        console.error('Failed to load user data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [isAuthenticated, navigate, user, toast]);

  const removeFavorite = async (id: number, listingId: number) => {
    if (!user) return;
    
    try {
      const success = favoriteService.removeFromFavorites(user.id, listingId);
      if (success) {
        const updated = favorites.filter(f => f.id !== id);
        setFavorites(updated);
        toast({
          title: "Removed from Favorites",
          description: "Listing has been removed from your favorites",
        });
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    }
  };

  const deleteListing = async (id: number) => {
    if (!user) return;
    
    try {
      const success = listingService.deleteListing(id);
      if (success) {
        const updated = listings.filter(l => l.id !== id);
        setListings(updated);
        toast({
          title: "Listing Deleted",
          description: "Your listing has been deleted successfully",
        });
      }
    } catch (error) {
      console.error('Failed to delete listing:', error);
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      });
    }
  };

  const deleteSearch = async (id: number) => {
    try {
      const success = savedSearchService.deleteSavedSearch(id);
      if (success) {
        const updated = savedSearches.filter(s => s.id !== id);
        setSavedSearches(updated);
        toast({
          title: "Search Deleted",
          description: "Saved search has been deleted",
        });
      }
    } catch (error) {
      console.error('Failed to delete saved search:', error);
      toast({
        title: "Error",
        description: "Failed to delete saved search",
        variant: "destructive",
      });
    }
  };

  const isSeller = user?.role === 'seller' || user?.role === 'both';
  const isBuyer = user?.role === 'buyer' || user?.role === 'both';
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>

        <Tabs defaultValue={isSeller ? "listings" : "favorites"} className="space-y-6">
          <TabsList>
            {isSeller && <TabsTrigger value="listings">My Listings</TabsTrigger>}
            {isBuyer && <TabsTrigger value="favorites">Favorites</TabsTrigger>}
            {isBuyer && <TabsTrigger value="searches">Saved Searches</TabsTrigger>}
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {isSeller && (
            <TabsContent value="listings" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">My Listings</h2>
                <Button onClick={() => navigate('/sell')}>Create New Listing</Button>
              </div>

              {listings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">You haven't created any listings yet.</p>
                    <Button onClick={() => navigate('/sell')}>Create Your First Listing</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {listings.map((listing) => (
                    <Card key={listing.id}>
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <img src={listing.images[0] || '/placeholder.svg'} alt={listing.title} className="w-32 h-32 object-cover rounded" />
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{listing.title}</h3>
                                <p className="text-2xl font-bold text-primary">${listing.price.toLocaleString()}</p>
                              </div>
                              <Badge variant={listing.status === 'active' ? 'default' : listing.status === 'sold' ? 'secondary' : 'outline'}>
                                {listing.status}
                              </Badge>
                            </div>
                            <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                              <span className="flex items-center gap-1">
                                <BarChart3 className="w-4 h-4" />
                                {listing.views} views
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                {listing.inquiries} inquiries
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => deleteListing(listing.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                              {listing.status === 'active' && (
                                <Button size="sm">Boost Listing</Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {isBuyer && (
            <TabsContent value="favorites" className="space-y-6">
              <h2 className="text-2xl font-semibold">My Favorites</h2>
              {favorites.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">You haven't saved any motorcycles yet.</p>
                    <Button onClick={() => navigate('/listings')}>Browse Listings</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((bike) => (
                    <Card key={bike.id} className="overflow-hidden">
                      <img src={bike.image} alt={bike.title} className="w-full h-48 object-cover" />
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{bike.title}</h3>
                        <p className="text-xl font-bold text-primary mb-4">${bike.price.toLocaleString()}</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1" onClick={() => navigate(`/listing/${bike.id}`)}>
                            View Details
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => removeFavorite(bike.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {isBuyer && (
            <TabsContent value="searches" className="space-y-6">
              <h2 className="text-2xl font-semibold">Saved Searches</h2>
              {savedSearches.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">You haven't saved any searches yet.</p>
                    <Button onClick={() => navigate('/listings')}>Browse Listings</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {savedSearches.map((search) => (
                    <Card key={search.id}>
                      <CardContent className="p-6 flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold mb-1">{search.name}</h3>
                          <p className="text-sm text-muted-foreground">{JSON.stringify(search.filters)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => navigate(`/listings?${search.filters}`)}>
                            View Results
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteSearch(search.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="messages" className="space-y-6">
            <h2 className="text-2xl font-semibold">Messages</h2>
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No messages yet.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-semibold">Profile Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={user?.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email} />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
