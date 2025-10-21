import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, User, ArrowLeft, Clock, Loader2, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { blogService } from "../database";
import { BlogPost as BlogPostType } from "../types/database";

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const loadBlogPost = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          throw new Error("Blog post ID is required");
        }

        const postId = parseInt(id);
        const blogPost = blogService.getBlogPostById(postId);
        
        if (!blogPost) {
          throw new Error("Blog post not found");
        }

        setPost(blogPost);
      } catch (error) {
        console.error('Failed to load blog post:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load blog post",
          variant: "destructive",
        });
        navigate('/blog');
      } finally {
        setLoading(false);
      }
    };

    loadBlogPost();
  }, [id, navigate, toast]);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      
      if (navigator.share && post) {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "Blog post URL has been copied to your clipboard.",
        });
      }
    } catch (error) {
      console.error('Failed to share:', error);
      if (!navigator.share) {
        toast({
          title: "Share Failed",
          description: "Unable to share this post. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading blog post...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-2">Blog Post Not Found</h1>
            <p className="text-muted-foreground mb-4">The blog post you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/blog')}>
              Back to Blog
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/blog')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Button>

        {/* Hero Section */}
        <div className="mb-8">
          {post.image && (
            <div className="aspect-video overflow-hidden rounded-lg mb-8">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Badge variant="secondary">
              {post.category}
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              {post.readTime}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              disabled={isSharing}
              className="text-sm"
            >
              <Share2 className="h-4 w-4 mr-1" />
              {isSharing ? "Sharing..." : "Share"}
            </Button>
          </div>

          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>{formatDate(post.published_at || post.created_at)}</span>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <Separator className="my-8" />

        {/* Footer */}
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">Enjoyed this article?</h3>
          <p className="text-muted-foreground mb-6">
            Share it with fellow motorcycle enthusiasts and help spread the knowledge!
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={handleShare} disabled={isSharing}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Article
            </Button>
            <Button variant="outline" onClick={() => navigate('/blog')}>
              Read More Articles
            </Button>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;
