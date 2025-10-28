import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  BarChart3, 
  MessageSquare, 
  Edit, 
  Trash2, 
  Plus, 
  Eye, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Settings,
  Upload,
  Check,
  X,
  Search,
  Filter,
  MoreHorizontal,
  Image,
  XCircle
} from 'lucide-react';
import { ListingEntity } from '@/domain/entities/listing.entity';
import { apiClient } from '@/services/api-client';
import { useNavigate } from 'react-router-dom';

// Form schemas
const listingFormSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title must be less than 200 characters'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.string().min(4, 'Year is required').max(4),
  mileage: z.string().min(1, 'Mileage is required'),
  location: z.string().min(1, 'Location is required'),
  engineSize: z.string().min(1, 'Engine size is required'),
  color: z.string().min(1, 'Color is required'),
  sellerType: z.enum(['dealer', 'private']),
  description: z.string().min(50, 'Description must be at least 50 characters').max(2000),
  price: z.string().min(1, 'Price is required'),
});

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
});

interface DashboardStats {
  activeListings: number;
  totalViews: number;
  unreadMessages: number;
  soldListings: number;
  totalRevenue: number;
  responseRate: number;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  year: number;
  make: string;
  model: string;
  mileage: number;
  status: 'active' | 'sold' | 'pending' | 'expired';
  views: number;
  inquiries: number;
  createdAt: string;
  updatedAt: string;
}

const SellerDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'create' | 'messages' | 'profile'>('overview');
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeListings: 0,
    totalViews: 0,
    unreadMessages: 0,
    soldListings: 0,
    totalRevenue: 0,
    responseRate: 95
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Forms
  const listingForm = useForm<z.infer<typeof listingFormSchema>>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      title: '',
      make: '',
      model: '',
      year: '',
      mileage: '',
      location: '',
      engineSize: '',
      color: '',
      sellerType: 'private',
      description: '',
      price: '',
    },
  });

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: '',
    },
  });

  // Load seller data
  useEffect(() => {
    const loadSellerData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Load user's listings
        const { listings: userListings } = await apiClient.getUserListings(user.id);
        setListings(userListings);

        // Calculate stats
        const activeListings = userListings.filter((l: any) => l.status === 'active').length;
        const soldListings = userListings.filter((l: any) => l.status === 'sold').length;
        const totalViews = userListings.reduce((sum: number, listing: any) => sum + (listing.views || 0), 0);
        const totalRevenue = userListings
          .filter((l: any) => l.status === 'sold')
          .reduce((sum: number, listing: any) => sum + (listing.price || 0), 0);
        
        setStats({
          activeListings,
          totalViews,
          unreadMessages: 0, // TODO: Implement message system
          soldListings,
          totalRevenue,
          responseRate: 95
        });
      } catch (error) {
        console.error('Failed to load seller data:', error);
        toast({
          title: 'Data Load Error',
          description: 'Failed to load your listings',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user?.role === 'seller') {
      loadSellerData();
    }
  }, [user, isAuthenticated, toast]);

  // Handle listing creation
  const onCreateListing = async (data: z.infer<typeof listingFormSchema>) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      const listingData = {
        userId: user.id,
        title: data.title,
        description: data.description,
        year: parseInt(data.year),
        make: data.make,
        model: data.model,
        price: parseFloat(data.price),
        mileage: parseInt(data.mileage),
        engineSize: parseInt(data.engineSize),
        color: data.color,
        location: data.location,
        sellerType: data.sellerType,
      };

      const { listing } = await apiClient.createListing(listingData);
      
      const newListing = ListingEntity.create({
        userId: user.id,
        title: listing.title,
        description: listing.description,
        year: listing.year,
        make: listing.make,
        model: listing.model,
        price: listing.price,
        mileage: listing.mileage,
        engineSize: listing.engineSize,
        color: listing.color,
        location: listing.location,
        sellerType: listing.sellerType,
      });

      setListings([newListing as any, ...listings]);
      setActiveTab('listings');
      
      toast({
        title: 'Listing Created!',
        description: 'Your motorcycle has been listed successfully.',
      });

      listingForm.reset();
    } catch (error) {
      console.error('Failed to create listing:', error);
      toast({
        title: 'Creation Failed',
        description: 'Failed to create your listing. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle listing deletion
  const handleDeleteListing = async (listingId: string) => {
    if (!user) return;

    try {
      await apiClient.deleteListing(listingId);
      setListings(listings.filter(l => l.id !== listingId));
      
      toast({
        title: 'Listing Deleted',
        description: 'Your listing has been successfully deleted'
      });
    } catch (error) {
      console.error('Failed to delete listing:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete the listing',
        variant: 'destructive'
      });
    }
  };

  // Image upload handlers
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages = Array.from(files);
    
    // Validate file types and size
    const validImages = newImages.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValidType) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload only image files',
          variant: 'destructive'
        });
      }
      
      if (!isValidSize) {
        toast({
          title: 'File too large',
          description: 'Please upload images smaller than 5MB',
          variant: 'destructive'
        });
      }
      
      return isValidType && isValidSize;
    });

    // Create preview URLs
    const newPreviews = validImages.map(file => URL.createObjectURL(file));
    
    setImages(prev => [...prev, ...validImages]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0) return; // Already primary
    
    const newImages = [...images];
    const newPreviews = [...imagePreviews];
    
    // Move the selected image to the first position
    const [selectedImage] = newImages.splice(index, 1);
    const [selectedPreview] = newPreviews.splice(index, 1);
    
    newImages.unshift(selectedImage);
    newPreviews.unshift(selectedPreview);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
    
    toast({
      title: 'Primary image set',
      description: 'The first image will be shown as the main photo'
    });
  };

  // Filter listings
  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Redirect if not seller
  if (!isAuthenticated || user?.role !== 'seller') {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Seller Dashboard</h1>
            <p className="text-muted-foreground">Manage your motorcycle listings and sales</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/listings')}
            >
              <Eye className="w-4 h-4 mr-2" />
              Browse Listings
            </Button>
            <Button 
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Listing
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="create">Create Listing</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Listings</p>
                      <p className="text-2xl font-bold">{stats.activeListings}</p>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Eye className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                      <p className="text-2xl font-bold">{stats.totalViews}</p>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Messages</p>
                      <p className="text-2xl font-bold">{stats.unreadMessages}</p>
                    </div>
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sold</p>
                      <p className="text-2xl font-bold">{stats.soldListings}</p>
                    </div>
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                      <p className="text-2xl font-bold">KSh {stats.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                      <p className="text-2xl font-bold">{stats.responseRate}%</p>
                    </div>
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Users className="w-6 h-6 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your seller account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('create')}
                  >
                    <Plus className="w-6 h-6" />
                    <span>Create New Listing</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('listings')}
                  >
                    <Eye className="w-6 h-6" />
                    <span>View All Listings</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('messages')}
                  >
                    <MessageSquare className="w-6 h-6" />
                    <span>View Messages</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest listing updates</CardDescription>
              </CardHeader>
              <CardContent>
                {listings.slice(0, 3).map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{listing.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {listing.status === 'active' ? 'Active' : 'Sold'} • {listing.views} views
                      </p>
                    </div>
                    <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                      {listing.status}
                    </Badge>
                  </div>
                ))}
                {listings.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <h2 className="text-2xl font-semibold">My Listings</h2>
              <div className="flex gap-2 w-full lg:w-auto">
                <div className="relative flex-1 lg:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search listings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Listings Grid */}
            <div className="grid gap-6">
              {filteredListings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No listings found</p>
                    <Button 
                      onClick={() => setActiveTab('create')}
                      className="mt-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Listing
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredListings.map((listing) => (
                  <Card key={listing.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{listing.title}</h3>
                              <p className="text-muted-foreground">
                                {listing.year} {listing.make} {listing.model} • {listing.mileage.toLocaleString()} miles
                              </p>
                            </div>
                            <Badge variant={
                              listing.status === 'active' ? 'default' :
                              listing.status === 'sold' ? 'secondary' :
                              listing.status === 'pending' ? 'outline' : 'destructive'
                            }>
                              {listing.status}
                            </Badge>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Price</p>
                              <p className="font-semibold">KSh {listing.price.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Views</p>
                              <p className="font-semibold">{listing.views}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Inquiries</p>
                              <p className="font-semibold">{listing.inquiries}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Listed</p>
                              <p className="font-semibold">{new Date(listing.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteListing(listing.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Create Listing Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Listing</CardTitle>
                <CardDescription>Add a new motorcycle to your inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...listingForm}>
                  <form onSubmit={listingForm.handleSubmit(onCreateListing)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={listingForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Listing Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 2023 Harley Davidson Street Glide" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={listingForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (KSh)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="25000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={listingForm.control}
                        name="make"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Make</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Harley Davidson" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={listingForm.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Street Glide" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={listingForm.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="2023" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={listingForm.control}
                        name="mileage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mileage</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="5000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={listingForm.control}
                        name="engineSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Engine Size (cc)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="1868" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={listingForm.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Black" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={listingForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Los Angeles, CA" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={listingForm.control}
                        name="sellerType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seller Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select seller type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="private">Private Seller</SelectItem>
                                <SelectItem value="dealer">Dealer</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Image Upload Section */}
                    <div className="col-span-1 md:col-span-2">
                      <FormItem>
                        <FormLabel>Listing Images</FormLabel>
                        <div className="space-y-4">
                          {/* Upload Area */}
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                            <Input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id="image-upload"
                            />
                            <label
                              htmlFor="image-upload"
                              className="cursor-pointer flex flex-col items-center gap-2"
                            >
                              <Image className="w-8 h-8 text-muted-foreground" />
                              <div>
                                <p className="font-medium">Upload Images</p>
                                <p className="text-sm text-muted-foreground">
                                  Drag and drop or click to upload
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Up to 10 images, 5MB each
                                </p>
                              </div>
                            </label>
                          </div>

                          {/* Image Previews */}
                          {imagePreviews.length > 0 && (
                            <div className="space-y-4">
                              <p className="text-sm font-medium">
                                Uploaded Images ({imagePreviews.length}/10)
                              </p>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {imagePreviews.map((preview, index) => (
                                  <div
                                    key={index}
                                    className="relative group rounded-lg overflow-hidden border"
                                  >
                                    <img
                                      src={preview}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-24 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setPrimaryImage(index)}
                                        disabled={index === 0}
                                        className="h-8 px-2 text-xs"
                                      >
                                        {index === 0 ? 'Primary' : 'Set Primary'}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => removeImage(index)}
                                        className="h-8 px-2 text-xs"
                                      >
                                        <XCircle className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    {index === 0 && (
                                      <div className="absolute top-1 left-1">
                                        <Badge variant="default" className="text-xs">
                                          Primary
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    </div>

                    <FormField
                      control={listingForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your motorcycle in detail..."
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-4">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Listing
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => listingForm.reset()}
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>Communicate with potential buyers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    When buyers contact you about your listings, your messages will appear here.
                  </p>
                  <Button onClick={() => setActiveTab('listings')}>
                    View Your Listings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seller Profile</CardTitle>
                <CardDescription>Manage your seller information</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex gap-4">
                      <Button type="submit" className="flex-1">
                        Update Profile
                      </Button>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SellerDashboard;
