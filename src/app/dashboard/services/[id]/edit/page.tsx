"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';

const ServiceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  price: z.number().nonnegative('Price must be a positive number'),
  duration: z.number().int().min(1, 'Duration must be at least 1 minute'),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ServiceFormData = z.infer<typeof ServiceSchema>;

const DURATION_OPTIONS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
];

const CATEGORIES = [
  'Consultation',
  'Treatment',
  'Therapy',
  'Check-up',
  'Screening',
  'Vaccination',
  'Other'
];

export default function EditServicePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<ServiceFormData>({ 
    name: '', 
    description: '',
    price: 0,
    duration: 30,
    category: '',
    isActive: true
  });
  
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/services/${id}`);
        if (!response.ok) throw new Error('Failed to fetch service');
        const data = await response.json();
        setForm({
          name: data.name || '',
          description: data.description || '',
          price: data.price || 0,
          duration: data.duration || 30,
          category: data.category || '',
          isActive: data.isActive ?? true
        });
      } catch (error) {
        console.error('Error fetching service:', error);
        toast({
          title: 'Error',
          description: 'Failed to load service details',
          variant: 'destructive',
        });
        router.push('/dashboard/services');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchService();
    }
  }, [id, router, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'duration' 
        ? value === '' ? '' : Number(value)
        : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [name]: name === 'duration' ? Number(value) : value
    }));
  };

  const handleStatusChange = (value: string) => {
    setForm(prev => ({ ...prev, isActive: value === 'active' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form data
      const parsed = ServiceSchema.safeParse({
        ...form,
        price: Number(form.price),
        duration: Number(form.duration)
      });

      if (!parsed.success) {
        const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
        throw new Error(firstError || 'Validation failed');
      }

      const response = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update service');
      }

      toast({
        title: 'Success',
        description: 'Service updated successfully',
      });
      
      router.push('/dashboard/services');
      router.refresh();
    } catch (error: any) {
      console.error('Error updating service:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update service',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Edit Service</h1>
        <p className="text-muted-foreground">Update service details and pricing</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-medium">Service Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input 
                id="name" 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                required 
                disabled={isSubmitting}
                placeholder="e.g., Initial Consultation"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={form.category || ''} 
                onValueChange={(value) => handleSelectChange('category', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="duration">Duration *</Label>
              <Select 
                value={form.duration.toString()} 
                onValueChange={(value) => handleSelectChange('duration', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="price">Price *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input 
                  id="price" 
                  name="price" 
                  type="number" 
                  value={form.price} 
                  onChange={handleChange} 
                  min="0"
                  step="0.01"
                  required
                  disabled={isSubmitting}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select 
                value={form.isActive ? 'active' : 'inactive'} 
                onValueChange={handleStatusChange}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {form.isActive ? 'This service is currently active' : 'This service is hidden from booking'}
              </p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={form.description || ''}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Add a detailed description of the service..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/dashboard/services')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
