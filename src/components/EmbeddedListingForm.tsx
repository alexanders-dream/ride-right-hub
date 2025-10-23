import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Check, Upload, DollarSign, Eye } from 'lucide-react';
import { listingService } from '@/database';

const formSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.string().min(1, 'Year is required'),
  mileage: z.string().min(1, 'Mileage is required'),
  vin: z.string().min(17, 'VIN must be 17 characters').max(17, 'VIN must be 17 characters'),
  location: z.string().min(1, 'Location is required'),
  engineSize: z.string().min(1, 'Engine size is required'),
  color: z.string().min(1, 'Color is required'),
  transmission: z.string().min(1, 'Transmission is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.string().min(1, 'Price is required'),
});

interface EmbeddedListingFormProps {
  onFinish: () => void;
  listingId?: number;
}

const EmbeddedListingForm = ({ onFinish, listingId }: EmbeddedListingFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setUploadedImages(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      const listingData = {
        title: `${data.year} ${data.make} ${data.model}`,
        make: data.make,
        model: data.model,
        year: parseInt(data.year),
        mileage: parseInt(data.mileage),
        vin: data.vin,
        location: data.location,
        engine_size: parseInt(data.engineSize),
        color: data.color,
        transmission: data.transmission,
        price: parseInt(data.price),
        description: data.description.trim(),
        images: uploadedImages.filter(img => img && img.trim() !== ''),
        seller_id: user!.id,
        seller_type: 'private' as const,
        status: 'active' as const,
      };

      // Additional validation
      if (!listingData.make || !listingData.model || !listingData.location) {
        throw new Error('Required fields are missing');
      }

      if (!listingData.images || listingData.images.length === 0) {
        throw new Error('At least one image is required');
      }

      if (listingData.year < 1900 || listingData.year > new Date().getFullYear() + 1) {
        throw new Error('Invalid year');
      }

      if (listingData.price <= 0) {
        throw new Error('Price must be greater than 0');
      }

      if (listingData.mileage < 0) {
        throw new Error('Mileage cannot be negative');
      }

      const newListing = await listingService.createListing(listingData);
      
      if (newListing) {
        toast({
          title: "Listing Created!",
          description: "Your motorcycle has been listed successfully.",
        });
        onFinish();
      } else {
        throw new Error('Failed to create listing');
      }
    } catch (error) {
      console.error('Failed to create listing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Listing Creation Failed",
        description: errorMessage || "Failed to create listing. Please check all fields and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    currentStep >= step.number
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold text-sm">{step.number}</span>
                  )}
                </div>
                <span className="text-xs mt-1 font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-all ${
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
          <Card className="p-6">
            {/* Step 1: Core Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold mb-4">Core Details</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
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
                <h2 className="text-xl font-bold mb-4">Description & Photos</h2>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your motorcycle's condition, features, and any modifications..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label>Photos</Label>
                  <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">
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
                    <div className="grid grid-cols-4 gap-3 mt-4">
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
                <h2 className="text-xl font-bold mb-4">Pricing</h2>

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

                <Card className="p-4 bg-muted">
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
                <h2 className="text-xl font-bold mb-4">Review Your Listing</h2>

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
            <div className="flex justify-between mt-6 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep} disabled={isSubmitting}>
                  Next Step
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Creating...
                    </>
                  ) : (
                    "Publish Listing"
                  )}
                </Button>
              )}
            </div>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default EmbeddedListingForm;