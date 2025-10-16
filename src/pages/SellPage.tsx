import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, Upload, DollarSign, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const formSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().min(4, "Year is required"),
  mileage: z.string().min(1, "Mileage is required"),
  vin: z.string().min(17, "VIN must be 17 characters").max(17),
  location: z.string().min(1, "Location is required"),
  engineSize: z.string().min(1, "Engine size is required"),
  color: z.string().min(1, "Color is required"),
  transmission: z.string().min(1, "Transmission is required"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  price: z.string().min(1, "Price is required"),
});

const SellPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      make: "",
      model: "",
      year: "",
      mileage: "",
      vin: "",
      location: "",
      engineSize: "",
      color: "",
      transmission: "",
      description: "",
      price: "",
    },
  });

  const steps = [
    { number: 1, title: "Core Details", icon: Check },
    { number: 2, title: "Description & Photos", icon: Upload },
    { number: 3, title: "Pricing", icon: DollarSign },
    { number: 4, title: "Review", icon: Eye },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedImages([...uploadedImages, ...newImages]);
    }
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    toast({
      title: "Listing Created!",
      description: "Your motorcycle has been listed successfully.",
    });
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof z.infer<typeof formSchema>)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ["make", "model", "year", "mileage", "vin", "location", "engineSize", "color", "transmission"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["description"];
    } else if (currentStep === 3) {
      fieldsToValidate = ["price"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Sell Your Motorcycle</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Reach thousands of potential buyers and get the best price for your bike
          </p>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <Card className="p-6">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="font-semibold mb-2">Maximum Exposure</h3>
              <p className="text-sm text-muted-foreground">Your listing reaches thousands of active buyers</p>
            </Card>
            <Card className="p-6">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="font-semibold mb-2">Verified Buyers</h3>
              <p className="text-sm text-muted-foreground">Connect with serious, verified motorcycle enthusiasts</p>
            </Card>
            <Card className="p-6">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold mb-2">Sell Fast</h3>
              <p className="text-sm text-muted-foreground">Average listing sells in under 14 days</p>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentStep >= step.number
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <span className="font-semibold">{step.number}</span>
                    )}
                  </div>
                  <span className="text-sm mt-2 font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 transition-all ${
                      currentStep > step.number ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl mx-auto">
            <Card className="p-8">
              {/* Step 1: Core Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6">Core Details</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="make"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Make *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select make" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Harley-Davidson">Harley-Davidson</SelectItem>
                                <SelectItem value="Honda">Honda</SelectItem>
                                <SelectItem value="Yamaha">Yamaha</SelectItem>
                                <SelectItem value="Kawasaki">Kawasaki</SelectItem>
                                <SelectItem value="BMW">BMW</SelectItem>
                                <SelectItem value="Ducati">Ducati</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Street Glide" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2022" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mileage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mileage *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 3200" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VIN *</FormLabel>
                          <FormControl>
                            <Input placeholder="17-character VIN" {...field} maxLength={17} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location *</FormLabel>
                          <FormControl>
                            <Input placeholder="City, State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="engineSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Engine Size (cc) *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 1868" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="transmission"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Transmission *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select transmission" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Manual">Manual</SelectItem>
                                <SelectItem value="Automatic">Automatic</SelectItem>
                                <SelectItem value="Semi-Automatic">Semi-Automatic</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Description & Photos */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6">Description & Photos</h2>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your motorcycle's condition, features, and any modifications..."
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <Label>Photos</Label>
                    <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Drag and drop your photos here, or click to select files
                      </p>
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        {uploadedImages.map((img, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden border border-border">
                            <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Pricing */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6">Pricing</h2>

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asking Price *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input placeholder="0" className="pl-7" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Card className="p-6 bg-muted">
                    <h3 className="font-semibold mb-2">Pricing Tips</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Research similar bikes in your area to set a competitive price</li>
                      <li>• Consider the bike's condition, mileage, and any upgrades</li>
                      <li>• Price slightly higher to leave room for negotiation</li>
                      <li>• Listing fee: 3% of final sale price</li>
                    </ul>
                  </Card>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6">Review Your Listing</h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Basic Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Make:</span>
                          <span>{form.watch("make")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Model:</span>
                          <span>{form.watch("model")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Year:</span>
                          <span>{form.watch("year")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mileage:</span>
                          <span>{form.watch("mileage")} mi</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location:</span>
                          <span>{form.watch("location")}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Additional Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Engine Size:</span>
                          <span>{form.watch("engineSize")} cc</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Color:</span>
                          <span>{form.watch("color")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transmission:</span>
                          <span>{form.watch("transmission")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="font-semibold text-primary">${form.watch("price")}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">{form.watch("description")}</p>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Photos ({uploadedImages.length})</h3>
                      <div className="grid grid-cols-6 gap-2">
                        {uploadedImages.map((img, index) => (
                          <div key={index} className="aspect-square rounded overflow-hidden border border-border">
                            <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                {currentStep < 4 ? (
                  <Button type="button" onClick={nextStep}>
                    Next Step
                  </Button>
                ) : (
                  <Button type="submit">
                    Publish Listing
                  </Button>
                )}
              </div>
            </Card>
          </form>
        </Form>
      </div>

      <Footer />
    </div>
  );
};

export default SellPage;
