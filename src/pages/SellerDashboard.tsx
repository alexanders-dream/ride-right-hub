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
  Bike, 
  MessageSquare, 
  Eye, 
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Star,
  Edit,
  Trash2,
  Plus,
  BarChart3,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2, 
  Heart,
  ArrowLeft
} from 'lucide-react';
import { listingService, messageService, userService } from '../database';
import { Listing, Message, User } from '../types/database';

const SellerDashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sellerStats, setSellerStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    averageViews: 0,
    inquiries: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [showListingForm, setShowListingForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!user || (user.role !== 'SELLER' && user.role !== 'BOTH')) {
      toast({
        title: "Access Denied",
        description: "This dashboard is for sellers only",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    loadSellerData();
  }, [isAuthenticated, navigate, user]);

  const loadSellerData = async () => {
    try {
      setLoading(true);
      
      // Load seller's listings
      let sellerListings: Listing[] = [];
      try {
        const response = await listingService.getListingsBySeller(user!.id);
        sellerListings = (Array.isArray(response) ? response : []).map(listing => ({
          ...listing,
          transmission: listing.transmission as 'Manual' | 'Automatic' | 'Semi-Automatic'
        }));
      } catch (listingError) {
        console.warn('Failed to fetch listings:', listingError);
        sellerListings = [];
      }
      setListings(sellerListings);
      
      // Load messages related to seller's listings
      let allMessages: Message[] = [];
      try {
        const response = await messageService.getMessages();
        allMessages = Array.isArray(response) ? response : [];
      } catch (messageError) {
        console.warn('Failed to fetch messages:', messageError);
        allMessages = [];
      }
      
      const sellerMessages = allMessages.filter((msg: Message) => 
        msg.listing_id && sellerListings.some((listing: Listing) => listing.id === msg.listing_id)
      );
      setMessages(sellerMessages);
      
      // Calculate seller statistics
      const activeListings = sellerListings.filter((l: Listing) => l.status === 'active');
      const totalViews = sellerListings.reduce((sum: number, l: Listing) => sum + (l.views || 0), 0);
      const averageViews = sellerListings.length > 0 ? totalViews / sellerListings.length : 0;
      
      setSellerStats({
        totalListings: sellerListings.length,
        activeListings: activeListings.length,
        totalViews,
        averageViews: Math.round(averageViews),
        inquiries: sellerMessages.length,
        conversionRate: sellerListings.length > 0 ? Math.round((activeListings.length / sellerListings.length) * 100) : 0
      });
      
    } catch (error) {
      console.error('Failed to load seller data:', error);
      toast({
        title: "Error",
        description: "Failed to load seller dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleListingCreated = () => {
    setShowListingForm(false);
    loadSellerData();
  };

  // Temporary component until EmbeddedListingForm is created
  const EmbeddedListingForm = ({ onFinish }: { onFinish: () => void }) => {
    return (
      <div className="p-6 bg-white rounded-lg border">
        <p className="text-muted-foreground mb-4">Listing form component coming soon...</p>
        <Button onClick={onFinish}>Close Form</Button>
      </div>
    );
  };

  const editListing = (listingId: number) => {
    // For now, we'll just show the form for creating new listings
    // TODO: Add editing functionality to EmbeddedListingForm
    setShowListingForm(true);
  };

  const deleteListing = async (id: number) => {
    try {
      const success = await listingService.deleteListing(id);
      if (success) {
        setListings(listings.filter(l => l.id !== id));
        toast({
          title: "Listing Deleted",
          description: "Your listing has been deleted successfully",
        });
        loadSellerData(); // Refresh stats
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete listing",
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'sold':
        return <Badge variant="destructive">Sold</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your seller dashboard...</p>
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
        {showListingForm ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <Button variant="ghost" onClick={() => setShowListingForm(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold">Create New Listing</h1>
              <div></div>
            </div>
            <EmbeddedListingForm onFinish={handleListingCreated} />
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold">Seller Dashboard</h1>
                <p className="text-muted-foreground">Manage your motorcycle listings and track performance</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowListingForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Listing
                </Button>
                {user.role === 'BOTH' && (
                  <Button variant="outline" onClick={() => navigate('/buyer-dashboard')}>
                    <Heart className="h-4 w-4 mr-2" />
                    Switch to Buyer View
                  </Button>
                )}
                <Button variant="outline" onClick={logout}>Logout</Button>
              </div>
            </div>

            {/* Seller Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Listings</p>
                  <p className="text-2xl font-bold">{sellerStats.totalListings}</p>
                </div>
                <Bike className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                  <p className="text-2xl font-bold">{sellerStats.activeListings}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{sellerStats.totalViews.toLocaleString()}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inquiries</p>
                  <p className="text-2xl font-bold">{sellerStats.inquiries}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="listings">
              <Bike className="h-4 w-4 mr-2" />
              My Listings
            </TabsTrigger>
            <TabsTrigger value="inquiries">
              <MessageSquare className="h-4 w-4 mr-2" />
              Inquiries {unreadMessages.length > 0 && 
                <Badge variant="destructive" className="ml-2">{unreadMessages.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            {listings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bike className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">You haven't created any listings yet.</p>
                  <Button onClick={() => setShowListingForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Listing
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <Card key={listing.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <img 
                          src={listing.images?.[0] || '/placeholder.svg'} 
                          alt={listing.title}
                          className="w-32 h-32 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{listing.title}</h3>
                              <p className="text-muted-foreground">
                                {listing.year} • {listing.mileage?.toLocaleString()} miles • {listing.location}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">${listing.price?.toLocaleString()}</p>
                              {getStatusBadge(listing.status)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{listing.views} views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {messages.filter(m => m.listing_id === listing.id).length} inquiries
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {new Date(listing.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/listing/${listing.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => editListing(listing.id)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => deleteListing(listing.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No inquiries yet</p>
                  <p className="text-sm text-muted-foreground">When buyers contact you about your listings, their messages will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const relatedListing = listings.find(l => l.id === message.listing_id);
                  return (
                    <Card key={message.id} className={message.status === 'unread' ? 'border-blue-200' : ''}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{message.subject}</h3>
                              {message.status === 'unread' && <Badge variant="default">New</Badge>}
                              {relatedListing && (
                                <Badge variant="secondary" className="cursor-pointer"
                                  onClick={() => navigate(`/listing/${relatedListing.id}`)}>
                                  About: {relatedListing.title}
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground mb-2">{message.content}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>From: Buyer #{message.sender_id}</span>
                              <span>{new Date(message.created_at).toLocaleDateString()}</span>
                            </div>
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
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>Your listing performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Views per Listing</span>
                      <span className="font-bold">{sellerStats.averageViews}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Inquiry Rate</span>
                      <span className="font-bold">
                        {sellerStats.totalListings > 0 ? Math.round((sellerStats.inquiries / sellerStats.totalListings) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active Listing Rate</span>
                      <span className="font-bold">{sellerStats.conversionRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Listings</CardTitle>
                  <CardDescription>Listings with most views</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {listings
                      .sort((a, b) => (b.views || 0) - (a.views || 0))
                      .slice(0, 3)
                      .map((listing) => (
                        <div key={listing.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{listing.title}</p>
                            <p className="text-sm text-muted-foreground">{listing.views} views</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/listing/${listing.id}`)}>
                            View
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seller Profile Settings</CardTitle>
                <CardDescription>Manage your seller profile and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="business-name">Business Name</Label>
                      <Input id="business-name" placeholder="Your Business Name" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" placeholder="(555) 123-4567" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Business Description</Label>
                    <textarea 
                      id="description" 
                      className="w-full min-h-[100px] p-3 border rounded-md"
                      placeholder="Tell buyers about your business..."
                    />
                  </div>
                  <Button>Save Settings</Button>
                </div>
              </CardContent>
            </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export { SellerDashboard as default };