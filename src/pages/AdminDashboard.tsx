import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { userService, listingService, blogService } from "../database";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Edit, Plus, Users, Bike, FileText, BarChart, Save, Eye, EyeOff, Loader2 } from "lucide-react";
import { Listing, User, BlogPost } from '../types/database';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
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

  useEffect(() => {
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

    // Check admin role
    if (user?.role !== 'admin') {
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
  }, [isAuthenticated, user, navigate, toast]);

  const loadDatabaseData = useCallback(() => {
    try {
      // Load real listings from database
      const dbListings = listingService.getAllListings();
      setListings(dbListings);

      // Load real users from database
      const dbUsers = userService.getAllUsers();
      setUsers(dbUsers);

      // Load real blog posts from database
      const dbBlogPosts = blogService.getAllBlogPosts();
      setBlogPosts(dbBlogPosts);
    } catch (error) {
      console.error('Error loading database data:', error);
      toast({
        title: "Database Error",
        description: "Failed to load admin dashboard data.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const deleteListing = async (id: number) => {
    try {
      const success = listingService.deleteListing(id);
      if (success) {
        // Refresh listings data
        const dbListings = listingService.getAllListings();
        setListings(dbListings);
        toast({ title: "Listing deleted successfully" });
      } else {
        toast({ title: "Failed to delete listing", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast({ title: "Error deleting listing", variant: "destructive" });
    }
  };

  const deleteUser = async (id: number) => {
    try {
      const success = userService.deleteUser(id);
      if (success) {
        // Refresh users data
        const dbUsers = userService.getAllUsers();
        setUsers(dbUsers);
        toast({ title: "User deleted successfully" });
      } else {
        toast({ title: "Failed to delete user", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ title: "Error deleting user", variant: "destructive" });
    }
  };

  // Blog management functions
  const handleCreateBlogPost = async () => {
    try {
      setIsSubmitting(true);
      
      const newPost = blogService.createBlogPost({
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
        const updatedPosts = blogService.getAllBlogPosts();
        setBlogPosts(updatedPosts);
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
      
      const updatedPost = blogService.updateBlogPost(editingBlogPost.id, {
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
        const updatedPosts = blogService.getAllBlogPosts();
        setBlogPosts(updatedPosts);
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
      const success = blogService.deleteBlogPost(id);
      if (success) {
        const updatedPosts = blogService.getAllBlogPosts();
        setBlogPosts(updatedPosts);
        toast({ title: "Blog post deleted successfully" });
      } else {
        toast({ title: "Failed to delete blog post", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error deleting blog post:', error);
      toast({ title: "Error deleting blog post", variant: "destructive" });
    }
  };

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
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{blogPosts.length}</div>
              <p className="text-xs text-muted-foreground">2 drafts pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Page Views</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,584</div>
              <p className="text-xs text-muted-foreground">+24% from last month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <Card>
              <CardHeader>
                <CardTitle>Manage Listings</CardTitle>
                <CardDescription>View and manage all motorcycle listings</CardDescription>
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
                    {listings.map((listing) => (
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
                <CardTitle>Manage Users</CardTitle>
                <CardDescription>View and manage registered users</CardDescription>
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
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{listingService.getListingsBySeller(user.id).length}</TableCell>
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
                                  <AlertDialogAction onClick={() => deleteUser(user.id)}>
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
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
