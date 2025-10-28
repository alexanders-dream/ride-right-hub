import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft } from 'lucide-react';
import { ListingEntity } from '@/domain/entities/listing.entity';
import { apiClient } from '@/services/api-client';

const formSchema = z.object({
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

interface CreateListingFormProps {
  onListingCreated: (listing: ListingEntity) => void;
  onCancel: () => void;
}

export const CreateListingForm: React.FC<CreateListingFormProps> = ({ onListingCreated, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to create a listing',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create listing data
      const listingData = {
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

      // Create the listing using API client
      const { listing } = await apiClient.createListing({
        userId: user.id,
        ...listingData
      });
      
      // Convert the API listing to a ListingEntity
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
      
      onListingCreated(newListing);
      
      toast({
        title: 'Listing Created!',
        description: 'Your motorcycle has been listed successfully.',
      });

      // Reset form
      form.reset();

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

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onCancel}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                Create New Listing
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Listing Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 2022 Harley-Davidson Street Glide Special - Low Miles" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                            <SelectItem value="Triumph">Triumph</SelectItem>
                            <SelectItem value="Indian">Indian</SelectItem>
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
                        <Input placeholder="e.g., 2022" {...field} maxLength={4} />
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
                  name="sellerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seller Type *</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select seller type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">Private Seller</SelectItem>
                            <SelectItem value="dealer">Dealer</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Asking Price *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">KSh</span>
                          <Input placeholder="0" className="pl-12 text-lg" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your motorcycle's condition, features, maintenance history, and any modifications. Be detailed to attract serious buyers..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-between pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Publish Listing'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
};
