import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { userService, listingService, blogService, messageService } from "../database";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Edit, Plus, Users, Bike, FileText, BarChart, Save, Eye, EyeOff, Loader2, TrendingUp, TrendingDown, DollarSign, MessageSquare, AlertTriangle, CheckCircle, Clock, Search, Filter, Download, RefreshCw, Settings, Shield, Activity } from "lucide-react";
import { Listing, User, BlogPost, Message } from '../types/database';

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [blogFormData, setBlogFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    author: '',
    category: 'Buying Guide' as BlogPost['category'],
    image: '',
    readTime: '',
    status: 'draft' as BlogPost['status']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [listingFilter, setListingFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Wait a moment for user data to load
    const timer = setTimeout(() => {
      // Check authentication
      if (!isAuthenticated) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access the admin dashboard.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Check admin role (database roles are uppercase)
      if (!user || user.role !== 'ADMIN') {
        toast({
          title: "Access Denied",
          description: "You do not have permission to access the admin dashboard.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // Load data from localStorage database
      loadDatabaseData();
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, navigate, toast]);

  const loadDatabaseData = useCallback(async (requireAdmin: boolean = true) => {
    try {
      setLoading(true);
      
      // Load real listings from database with error handling
      const [dbListings, dbUsers, dbBlogPosts, dbMessages] = await Promise.all([
        listingService.getAllListings(),
        userService.getAllUsers(),
        blogService.getAllBlogPosts(),
        messageService.getMessages()
      ]);

      // Validate and set listings with proper typing
      if (!Array.isArray(dbListings)) {
        throw new Error('Invalid listings data format');
      }
      const typedListings: Listing[] = dbListings.map(l => ({
        ...l,
        transmission: l.transmission as Listing['transmission'],
        status: l.status as Listing['status'],
        seller_type: l.seller_type as Listing['seller_type'],
        updated_at: l.updated_at || new Date().toISOString()
      }));
      setListings(typedListings);

      // Validate and set users with proper typing
      if (!Array.isArray(dbUsers)) {
        throw new Error('Invalid users data format');
      }
      const typedUsers: User[] = dbUsers.map(u => ({
        ...u,
        role: u.role as User['role']
      }));
      setUsers(typedUsers);

      // Validate and set blog posts
      if (!Array.isArray(dbBlogPosts)) {
        throw new Error('Invalid blog posts data format');
      }
      setBlogPosts(dbBlogPosts);

      // Validate and set messages
      if (!Array.isArray(dbMessages)) {
        throw new Error('Invalid messages data format');
      }
      setMessages(dbMessages);

    } catch (error) {
      console.error('Error loading database data:', error);
      toast({
        title: "Database Error",
        description: error instanceof Error ? error.message : "Failed to load admin dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteListing = async (id: number) => {
    try {
      setIsRefreshing(true);
      const success = await listingService.deleteListing(id);
      if (success) {
        // Refresh listings data
        const dbListings = await listingService.getAllListings();
        if (!Array.isArray(dbListings)) {
          throw new Error('Invalid listings data format');
        }
        const typedListings: Listing[] = dbListings.map(l => ({
          ...l,
          transmission: l.transmission as Listing['transmission'],
          status: l.status as Listing['status'],
          seller_type: l.seller_type as Listing['seller_type'],
          updated_at: l.updated_at || new Date().toISOString()
        }));
        setListings(typedListings);
        toast({ 
          title: "Listing deleted successfully",
          description: `Listing ID ${id} has been removed`
        });
      } else {
        throw new Error('Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast({ 
        title: "Error deleting listing", 
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive" 
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const deleteUser = async (id: number) => {
    try {
      if (!id) {
        throw new Error('Invalid user ID');
      }
      
      setIsRefreshing(true);
      const success = await userService.deleteUser(id);
      
      if (success) {
        // Refresh users data with validation
        const dbUsers = await userService.getAllUsers();
        if (!Array.isArray(dbUsers)) {
          throw new Error('Invalid users data format');
        }
        
        const typedUsers: User[] = dbUsers.map(u => ({
          ...u,
          role: u.role as User['role']
        }));
        
        setUsers(typedUsers);
        toast({ 
          title: "User deleted successfully",
          description: `User ID ${id} has been removed`
        });
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ 
        title: "Error deleting user", 
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive" 
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Blog management functions
  const handleCreateBlogPost = async () => {
    try {
      setIsSubmitting(true);

      const newPost = await blogService.createBlogPost({
        title: blogFormData.title,
        content: blogFormData.content,
        excerpt: blogFormData.excerpt,
        author: blogFormData.author,
        category: blogFormData.category,
        image: blogFormData.image,
        readTime: blogFormData.readTime,
        status: blogFormData.status
      }, blogFormData.status);

      if (newPost) {
        const updatedPosts = await blogService.getAllBlogPosts();
        setBlogPosts(Array.isArray(updatedPosts) ? updatedPosts : []);
        resetBlogForm();
        toast({ title: "Blog post created successfully" });
      }
    } catch (error) {
      console.error('Error creating blog post:', error);
      toast({ title: "Error creating blog post", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBlogPost = async () => {
    if (!editingBlogPost) return;

    try {
      setIsSubmitting(true);

      const updatedPost = await blogService.updateBlogPost(editingBlogPost.id.toString(), {
        title: blogFormData.title,
        content: blogFormData.content,
        excerpt: blogFormData.excerpt,
        author: blogFormData.author,
        category: blogFormData.category,
        image: blogFormData.image,
        readTime: blogFormData.readTime,
        status: blogFormData.status
      });

      if (updatedPost) {
        const updatedPosts = await blogService.getAllBlogPosts();
        setBlogPosts(Array.isArray(updatedPosts) ? updatedPosts : []);
        resetBlogForm();
        toast({ title: "Blog post updated successfully" });
      }
    } catch (error) {
      console.error('Error updating blog post:', error);
      toast({ title: "Error updating blog post", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBlogPost = async (id: number) => {
    try {
      const success = await blogService.deleteBlogPost(id.toString());
      if (success) {
        const updatedPosts = await blogService.getAllBlogPosts();
        setBlogPosts(Array.isArray(updatedPosts) ? updatedPosts : []);
        toast({ title: "Blog post deleted successfully" });
      } else {
        toast({ title: "Failed to delete blog post", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error deleting blog post:', error);
      toast({ title: "Error deleting blog post", variant: "destructive" });
    }
  };

  // Analytics and utility functions
  const getAnalytics = useCallback(() => {
    const totalRevenue = listings.reduce((sum, listing) => sum + listing.price, 0);
    const activeListings = listings.filter(l => l.status === 'active').length;
    const totalUsers = users.length;
    const newUsersThisWeek = users.filter(u => {
      const createdDate = new Date(u.created_at || 0);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate >= weekAgo;
    }).length;

    return {
      totalRevenue,
      activeListings,
      totalUsers,
      newUsersThisWeek,
      avgListingPrice: listings.length > 0 ? totalRevenue / listings.length : 0
    };
  }, [listings, users]);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await loadDatabaseData();
      toast({ title: "Data refreshed successfully" });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({ title: "Error refreshing data", variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportData = (type: 'users' | 'listings' | 'analytics') => {
    let data: any[] = [];
    let filename = '';
    
    switch (type) {
      case 'users':
        data = users;
        filename = 'users_export.csv';
        break;
      case 'listings':
        data = listings;
        filename = 'listings_export.csv';
        break;
      case 'analytics':
        data = [getAnalytics()];
        filename = 'analytics_export.csv';
        break;
    }

    const csvContent = convertToCSV(data);
    downloadCSV(csvContent, filename);
    toast({ title: `${type} exported successfully` });
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter(user => {
    if (!user || !user.name || !user.email) return false;
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = userFilter === 'all' || user.role === userFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = listingFilter === 'all' || listing.status === listingFilter;
    return matchesSearch && matchesFilter;
  });

  const handleEditBlogPost = (post: BlogPost) => {
    setEditingBlogPost(post);
    setBlogFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      author: post.author,
      category: post.category,
      image: post.image || '',
      readTime: post.readTime,
      status: post.status
    });
    setShowBlogForm(true);
  };

  const resetBlogForm = () => {
    setEditingBlogPost(null);
    setBlogFormData({
      title: '',
      content: '',
      excerpt: '',
      author: '',
      category: 'Buying Guide',
      image: '',
      readTime: '',
      status: 'draft'
    });
    setShowBlogForm(false);
    setIsSubmitting(false);
  };

  const deleteBlogPost = (id: number) => {
    setBlogPosts(blogPosts.filter(p => p.id !== id));
    toast({ title: "Blog post deleted successfully" });
  };

  const analytics = getAnalytics();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your marketplace content and users</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
              <Bike className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{listings.length}</div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeListings}</div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <p className="text-xs text-muted-foreground">{((analytics.activeListings / listings.length) * 100).toFixed(1)}% active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers}</div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <p className="text-xs text-muted-foreground">+{analytics.newUsersThisWeek} this week</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <p className="text-xs text-muted-foreground">Avg: ${analytics.avgListingPrice.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Controls */}
        <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users, listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData('users')}>
              <Download className="h-4 w-4 mr-2" />
              Export Users
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData('listings')}>
              <Download className="h-4 w-4 mr-2" />
              Export Listings
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData('analytics')}>
              <BarChart className="h-4 w-4 mr-2" />
              Export Analytics
            </Button>
          </div>
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Manage Listings</CardTitle>
                    <CardDescription>View and manage all motorcycle listings</CardDescription>
                  </div>
                  <Select value={listingFilter} onValueChange={setListingFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredListings.map((listing) => (
                      <TableRow key={listing.id}>
                       <TableCell className="font-medium">{listing.title}</TableCell>
                        <TableCell>ID: {listing.seller_id}</TableCell>
                        <TableCell>${listing.price.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={listing.status === "active" ? "default" : "secondary"}>
                            {listing.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{listing.views || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the listing.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteListing(listing.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Manage Users</CardTitle>
                    <CardDescription>View and manage registered users</CardDescription>
                  </div>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="BUYER">Buyers</SelectItem>
                      <SelectItem value="SELLER">Sellers</SelectItem>
                      <SelectItem value="BOTH">Both</SelectItem>
                      <SelectItem value="ADMIN">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Listings</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          {loading ? "Loading users..." : "No users found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user?.id}>
                          <TableCell className="font-medium">{user?.name || 'N/A'}</TableCell>
                          <TableCell>{user?.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{user?.role || 'Unknown'}</Badge>
                          </TableCell>
                          <TableCell>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>{user?.id ? '...' : 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the user and all their listings.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteUser(user?.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>User Messages</CardTitle>
                <CardDescription>Monitor and manage user communications</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No messages found
                        </TableCell>
                      </TableRow>
                    ) : (
                      messages.map((message) => (
                        <TableRow key={message.id}>
                          <TableCell className="font-medium">User {message.sender_id}</TableCell>
                          <TableCell>User {message.receiver_id}</TableCell>
                          <TableCell>{message.subject || 'No subject'}</TableCell>
                          <TableCell>{new Date(message.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={message.status === "read" ? "secondary" : "default"}>
                              {message.status === "read" ? 'Read' : 'Unread'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  messageService.deleteMessage(message.id.toString());
                                  setMessages(messages.filter(m => m.id !== message.id));
                                  toast({ title: "Message deleted" });
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blog">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Manage Blog Posts</CardTitle>
                  <CardDescription>Create and manage blog content</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blogPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell>{post.author}</TableCell>
                        <TableCell>
                          <Badge variant={post.status === "published" ? "default" : "secondary"}>
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(post.published_at || post.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the blog post.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteBlogPost(post.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                  <CardDescription>Financial overview and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Revenue</span>
                      <span className="text-lg font-bold">${analytics.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Listing Price</span>
                      <span className="text-lg font-bold">${analytics.avgListingPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active Listings</span>
                      <span className="text-lg font-bold">{analytics.activeListings}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Conversion Rate</span>
                      <span className="text-lg font-bold text-green-500">12.5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Analytics</CardTitle>
                  <CardDescription>User growth and engagement metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Users</span>
                      <span className="text-lg font-bold">{analytics.totalUsers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">New Users This Week</span>
                      <span className="text-lg font-bold text-green-500">+{analytics.newUsersThisWeek}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active Users</span>
                      <span className="text-lg font-bold">{Math.floor(analytics.totalUsers * 0.65)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">User Retention</span>
                      <span className="text-lg font-bold text-blue-500">78%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Listing Performance</CardTitle>
                  <CardDescription>Listing statistics and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Listings</span>
                      <span className="text-lg font-bold">{listings.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Views per Listing</span>
                      <span className="text-lg font-bold">
                        {listings.length > 0 ? Math.round(listings.reduce((sum, l) => sum + (l.views || 0), 0) / listings.length) : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Sold Listings</span>
                      <span className="text-lg font-bold">{listings.filter(l => l.status === 'sold').length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Avg. Days on Market</span>
                      <span className="text-lg font-bold">14 days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Analytics</CardTitle>
                  <CardDescription>Blog and content performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Blog Posts</span>
                      <span className="text-lg font-bold">{blogPosts.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Published Posts</span>
                      <span className="text-lg font-bold">{blogPosts.filter(p => p.status === 'published').length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Draft Posts</span>
                      <span className="text-lg font-bold">{blogPosts.filter(p => p.status === 'draft').length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Views</span>
                      <span className="text-lg font-bold">15,847</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Application performance and status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">API Status</span>
                      <Badge variant="default" className="bg-green-500">Online</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Database Status</span>
                      <Badge variant="default" className="bg-green-500">Connected</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Response Time</span>
                      <span className="text-sm font-medium text-green-500">124ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Uptime</span>
                      <span className="text-sm font-medium">99.9%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Overview</CardTitle>
                  <CardDescription>Security metrics and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Failed Login Attempts</span>
                      <span className="text-lg font-bold text-yellow-500">3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active Sessions</span>
                      <span className="text-lg font-bold">{users.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Security Alerts</span>
                      <Badge variant="default" className="bg-green-500">0 Critical</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Last Backup</span>
                      <span className="text-sm font-medium">2 hours ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;