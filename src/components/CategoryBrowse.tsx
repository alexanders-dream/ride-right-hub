import cruiserImage from "@/assets/cruiser-category.jpg";
import sportImage from "@/assets/sport-category.jpg";
import touringImage from "@/assets/touring-category.jpg";
import adventureImage from "@/assets/adventure-category.jpg";

const categories = [
  { name: "Cruiser", image: cruiserImage, count: "250+ bikes" },
  { name: "Sport", image: sportImage, count: "180+ bikes" },
  { name: "Touring", image: touringImage, count: "120+ bikes" },
  { name: "Adventure", image: adventureImage, count: "95+ bikes" },
];

const CategoryBrowse = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Browse by Category</h2>
          <p className="text-xl text-muted-foreground">Find the perfect ride for your style</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <div 
              key={category.name}
              className="group relative overflow-hidden rounded-lg border border-border hover:border-primary transition-all duration-300 cursor-pointer hover:shadow-glow animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="aspect-square relative">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-2xl font-bold mb-1 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-muted-foreground">{category.count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryBrowse;
