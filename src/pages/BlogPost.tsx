import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowLeft, Clock } from "lucide-react";

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock blog post data
  const post = {
    id,
    title: "Top 10 Motorcycles for Beginners in 2024",
    category: "Buying Guide",
    author: "Mike Rodriguez",
    date: "March 15, 2024",
    readTime: "5 min read",
    image: "/placeholder.svg",
    content: `
      <p>Starting your motorcycle journey is an exciting adventure, but choosing the right bike can be overwhelming. This comprehensive guide will help you find the perfect beginner motorcycle that matches your needs, budget, and riding style.</p>
      
      <h2>What Makes a Great Beginner Motorcycle?</h2>
      <p>Before diving into specific models, let's understand what characteristics make a motorcycle ideal for new riders:</p>
      <ul>
        <li><strong>Manageable Power:</strong> 300-650cc engines provide enough power without being overwhelming</li>
        <li><strong>Comfortable Ergonomics:</strong> Upright riding position reduces fatigue</li>
        <li><strong>Low Seat Height:</strong> Ability to plant both feet firmly on the ground</li>
        <li><strong>Light Weight:</strong> Easier to handle at low speeds and when stopped</li>
        <li><strong>Reliability:</strong> Well-established models with good track records</li>
      </ul>

      <h2>Our Top 10 Picks</h2>
      
      <h3>1. Honda CB500F</h3>
      <p>The CB500F is the quintessential beginner bike. Its 471cc parallel-twin engine delivers smooth, predictable power that's perfect for learning. The upright riding position and light clutch make it incredibly user-friendly.</p>
      
      <h3>2. Kawasaki Ninja 400</h3>
      <p>Don't let the sportbike styling fool you - the Ninja 400 is remarkably forgiving. Its 399cc engine provides thrilling performance without overwhelming new riders, and the lightweight chassis inspires confidence.</p>
      
      <h3>3. Yamaha MT-03</h3>
      <p>Yamaha's naked bike philosophy shines in the MT-03. With a 321cc engine and aggressive styling, it's perfect for riders who want something visually exciting that's still easy to manage.</p>

      <h2>Making Your Decision</h2>
      <p>Remember, the best beginner motorcycle is the one that fits you physically, matches your budget, and excites you every time you look at it. Visit dealers, sit on different models, and if possible, take MSF courses that provide bikes for you to try.</p>
      
      <p>Your first motorcycle is just the beginning of an incredible journey. Choose wisely, ride safely, and enjoy every mile!</p>
    `
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/blog")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>

          <article>
            <div className="mb-6">
              <Badge variant="secondary" className="mb-4">{post.category}</Badge>
              <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {post.author}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {post.date}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
              </div>
            </div>

            <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-8">
              <img 
                src={post.image} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div 
              className="prose prose-slate max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
