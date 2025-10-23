import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Heart, 
  Search, 
  MessageSquare, 
  ShoppingCart, 
  Eye, 
  Filter,
  TrendingUp,
  Bell,
  Star,
  Calendar,
  DollarSign,
  MapPin,
  Loader2 
} from 'lucide-react';
import { favoriteService, savedSearchService, messageService, listingService } from '../database';
import { Favorite, SavedSearch, Message, Listing } from '../types/database';

const BuyerDashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Listing[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!user || user.role === 'SELLER' || user.role === 'ADMIN') {
      toast({
        title: "Access Denied", 
        description: "This dashboard is for buyers only",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    loadBuyerData();
  }, [isAuthenticated, navigate, user]);

  const loadBuyerData = async () => {
    try {
      setLoading(true);
      
      // Load favorites
      const userFavorites = await favoriteService.getUserFavorites();
      setFavorites(userFavorites || []);
      
      // Load saved searches
      const userSavedSearches = await savedSearchService.getSavedSearches();
      setSavedSearches(userSavedSearches || []);
      
      // Load messages
      const userMessages = await messageService.getUserMessages();
      setMessages(userMessages || []);
      
      // Load recently viewed listings (mock data for now)
      const allListings = await listingService.getAllListings();
      setRecentlyViewed(allListings.slice(0, 4));
      
      // Mock price alerts
      setPriceAlerts([
        { id: 1, make: 'Honda', model: 'CBR600RR', year: 2020, targetPrice: 8500, currentPrice: 8200, savings: 300 },
        { id: 2, make: 'Yamaha', model: 'R6', year: 2019, targetPrice: 9000, currentPrice: 8800, savings: 200 }
      ]);
      
    } catch (error) {
      console.error('Failed to load buyer data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (id: number, listingId: number) => {
    try {
      const success = await favoriteService.removeFromFavorites(user!.id, listingId.toString());
      if (success) {
        setFavorites(favorites.filter(f => f.id !== id));
        toast({
          title: "Removed from Favorites",
          description: "Listing has been removed from your favorites",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    }
  };

  const deleteSavedSearch = async (id: number) => {
    try {
      const success = await savedSearchService.deleteSavedSearch(id.toString());
      if (success) {
        setSavedSearches(savedSearches.filter(s => s.id !== id));
        toast({
          title: "Search Deleted",
          description: "Saved search has been removed",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete saved search",
        variant: "destructive",
      });
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await messageService.markAsRead(messageId);
      setMessages(messages.map(m => 
        m.id === parseInt(messageId) ? { ...m, status: 'read' as const } : m
      ));
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const runSavedSearch = (search: SavedSearch) => {
    const queryParams = new URLSearchParams();
    Object.entries(search.filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });
    navigate(`/listings?${queryParams.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your buyer dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const unreadMessages = messages.filter(m => m.status === 'unread');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
            <p className="text-muted-foreground">Manage your motorcycle search and favorites</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/listings')}>
              <Search className="h-4 w-4 mr-2" />
              Browse Listings
            </Button>
            {user.role === 'BOTH' && (
              <Button variant="outline" onClick={() => navigate('/seller-dashboard')}>
                <Bike className="h-4 w-4 mr-2" />
                Switch to Seller View
              </Button>
            )}
            <Button variant="outline" onClick={logout}>Logout</Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Favorites</p>
                  <p className="text-2xl font-bold">{favorites.length}</p>
                </div>
                <Heart className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saved Searches</p>
                  <p className="text-2xl font-bold">{savedSearches.length}</p>
                </div>
                <Search className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unread Messages</p>
                  <p className="text-2xl font-bold">{unreadMessages.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Price Alerts</p>
                  <p className="text-2xl font-bold">{priceAlerts.length}</p>
                </div>
                <Bell className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="favorites" className="space-y-6">
          <TabsList>
            <TabsTrigger value="favorites">
              <Heart className="h-4 w-4 mr-2" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="searches">
              <Search className="h-4 w-4 mr-2" />
              Saved Searches
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="h-4 w-4 mr-2" />
              Price Alerts
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages {unreadMessages.length > 0 && 
                <Badge variant="destructive" className="ml-2">{unreadMessages.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="recently-viewed">
              <Eye className="h-4 w-4 mr-2" />
              Recently Viewed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="space-y-4">
            {favorites.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No favorites yet</p>
                  <Button onClick={() => navigate('/listings')}>
                    <Search className="h-4 w-4 mr-2" />
                    Browse Motorcycles
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((favorite) => (
                  <Card key={favorite.id} className="overflow-hidden">
                    <div className="aspect-video relative">
                      <img 
                        src={favorite.listing?.images?.[0] || '/placeholder.svg'} 
                        alt={favorite.listing?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{favorite.listing?.title}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-green-600">
                          ${favorite.listing?.price?.toLocaleString()}
                        </span>
                        <Badge variant="secondary">{favorite.listing?.year}</Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <MapPin className="h-3 w-3 mr-1" />
                        {favorite.listing?.location}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/listing/${favorite.listing_id}`)}
                        >
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => removeFavorite(favorite.id, favorite.listing_id)}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="searches" className="space-y-4">
            {savedSearches.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No saved searches</p>
                  <Button onClick={() => navigate('/listings')}>
                    <Filter className="h-4 w-4 mr-2" />
                    Start Searching
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {savedSearches.map((search) => (
                  <Card key={search.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{search.name}</h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {search.filters.make && <Badge variant="secondary">{search.filters.make}</Badge>}
                            {search.filters.model && <Badge variant="secondary">{search.filters.model}</Badge>}
                            {search.filters.minPrice && <Badge variant="secondary">Min: ${search.filters.minPrice}</Badge>}
                            {search.filters.maxPrice && <Badge variant="secondary">Max: ${search.filters.maxPrice}</Badge>}
                            {search.filters.minYear && <Badge variant="secondary">Year: {search.filters.minYear}+</Badge>}
                            {search.filters.location && <Badge variant="secondary">{search.filters.location}</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(search.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => runSavedSearch(search)}>
                            <Search className="h-4 w-4 mr-2" />
                            Run Search
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => deleteSavedSearch(search.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            {priceAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No price alerts set</p>
                  <Button onClick={() => navigate('/listings')}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Set Price Alert
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {priceAlerts.map((alert) => (
                  <Card key={alert.id} className="border-green-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {alert.year} {alert.make} {alert.model}
                          </h3>
                          <div className="flex items-center gap-4 mt-2">
                            <div>
                              <p className="text-sm text-muted-foreground">Target Price</p>
                              <p className="font-semibold">${alert.targetPrice.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Current Price</p>
                              <p className="font-semibold text-green-600">${alert.currentPrice.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">You Save</p>
                              <p className="font-semibold text-green-600">${alert.savings.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Listing
                          </Button>
                          <Button size="sm" variant="outline">
                            <Bell className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No messages</p>
                  <Button onClick={() => navigate('/listings')}>
                    Contact Sellers
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <Card key={message.id} className={message.status === 'unread' ? 'border-blue-200' : ''}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{message.subject}</h3>
                            {message.status === 'unread' && <Badge variant="default">New</Badge>}
                            {message.listing_id && <Badge variant="secondary">About Listing</Badge>}
                          </div>
                          <p className="text-muted-foreground mb-2">{message.content}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(message.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {message.status === 'unread' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => markMessageAsRead(message.id.toString())}
                            >
                              Mark Read
                            </Button>
                          )}
                          <Button size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Reply
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recently-viewed" className="space-y-4">
            {recentlyViewed.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No recently viewed listings</p>
                  <Button onClick={() => navigate('/listings')}>
                    Start Browsing
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentlyViewed.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden">
                    <div className="aspect-video relative">
                      <img 
                        src={listing.images?.[0] || '/placeholder.svg'} 
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm mb-2">{listing.title}</h3>
                      <p className="text-lg font-bold text-green-600 mb-2">
                        ${listing.price?.toLocaleString()}
                      </p>
                      <Button size="sm" className="w-full">
                        View Again
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BuyerDashboard;