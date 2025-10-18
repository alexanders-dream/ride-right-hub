import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, User, ArrowRight } from "lucide-react";

const mockBlogPosts = [
  {
    id: 1,
    title: "Top 10 Motorcycles for Beginners in 2024",
    excerpt: "Starting your riding journey? Discover the best motorcycles for new riders, balancing power, handling, and affordability.",
    category: "Buying Guide",
    author: "Mike Rodriguez",
    date: "March 15, 2024",
    image: "/placeholder.svg",
    readTime: "5 min read"
  },
  {
    id: 2,
    title: "Essential Motorcycle Maintenance Tips",
    excerpt: "Keep your bike running smoothly with these essential maintenance practices every rider should know.",
    category: "Maintenance",
    author: "Sarah Johnson",
    date: "March 12, 2024",
    image: "/placeholder.svg",
    readTime: "8 min read"
  },
  {
    id: 3,
    title: "How to Negotiate the Best Price When Buying Used",
    excerpt: "Master the art of negotiation and get the best deal on your next motorcycle purchase with these proven strategies.",
    category: "Buying Guide",
    author: "Tom Williams",
    date: "March 10, 2024",
    image: "/placeholder.svg",
    readTime: "6 min read"
  },
  {
    id: 4,
    title: "Motorcycle Safety Gear: What You Really Need",
    excerpt: "A comprehensive guide to essential safety gear that could save your life on the road.",
    category: "Safety",
    author: "Lisa Chen",
    date: "March 8, 2024",
    image: "/placeholder.svg",
    readTime: "7 min read"
  },
  {
    id: 5,
    title: "Spring Riding Season: Prep Your Bike for the Road",
    excerpt: "Winter's over! Follow this checklist to get your motorcycle ready for the riding season ahead.",
    category: "Maintenance",
    author: "Mike Rodriguez",
    date: "March 5, 2024",
    image: "/placeholder.svg",
    readTime: "5 min read"
  },
  {
    id: 6,
    title: "Understanding Motorcycle Insurance: A Complete Guide",
    excerpt: "Navigate the complex world of motorcycle insurance and find the coverage that's right for you.",
    category: "Insurance",
    author: "David Kim",
    date: "March 1, 2024",
    image: "/placeholder.svg",
    readTime: "10 min read"
  }
];

const Blog = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Motorcycle Blog</h1>
            <p className="text-muted-foreground text-lg">
              Expert tips, guides, and insights for motorcycle enthusiasts
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockBlogPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="aspect-video bg-muted overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{post.category}</Badge>
                    <span className="text-xs text-muted-foreground">{post.readTime}</span>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.date}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 group/btn"
                    onClick={() => navigate(`/blog/${post.id}`)}
                  >
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
