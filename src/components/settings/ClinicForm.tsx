'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useEffect, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';

const workingHoursSchema = z.object({
  start: z.string().min(1, 'Start time is required'),
  end: z.string().min(1, 'End time is required'),
  closed: z.boolean().optional(),
});

type WorkingHours = {
  [key: string]: {
    start: string;
    end: string;
    closed?: boolean;
  };
};

const clinicFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Clinic name must be at least 2 characters.',
  }),
  address: z.string().min(5, {
    message: 'Please enter a valid address.',
  }),
  phone: z.string().min(10, {
    message: 'Please enter a valid phone number.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  description: z.string().optional(),
  logo: z.any().optional(),
  settings: z.object({
    workingHours: z.record(z.string(), workingHoursSchema).optional(),
  }).optional(),
});

type ClinicFormValues = z.infer<typeof clinicFormSchema>;

export function ClinicForm() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [clinicData, setClinicData] = useState<ClinicFormValues | null>(null);

  const form = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicFormSchema),
    defaultValues: async () => {
      try {
        const response = await fetch('/api/clinic');
        if (response.ok) {
          const data = await response.json();
          setClinicData(data);
          return {
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            description: data.description || '',
            logo: data.logo || null,
            settings: data.settings || {
              workingHours: {
                monday: { start: '09:00', end: '17:00' },
                tuesday: { start: '09:00', end: '17:00' },
                wednesday: { start: '09:00', end: '17:00' },
                thursday: { start: '09:00', end: '17:00' },
                friday: { start: '09:00', end: '17:00' },
                saturday: { closed: true },
                sunday: { closed: true },
              },
            },
          };
        }
      } catch (error) {
        console.error('Error fetching clinic data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load clinic data',
          variant: 'destructive',
        });
      }
      return {
        name: '',
        address: '',
        phone: '',
        email: '',
        description: '',
        settings: {
          workingHours: {
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
            thursday: { start: '09:00', end: '17:00' },
            friday: { start: '09:00', end: '17:00' },
            saturday: { closed: true },
            sunday: { closed: true },
          },
        },
      };
    },
  });

  // Remove the separate useEffect for fetching data since we're using async defaultValues

  const onSubmit = async (data: ClinicFormValues) => {
    try {
      setIsLoading(true);
      console.log('Form data:', data);
      
      // Prepare the data to send
      const dataToSend: any = {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        description: data.description,
        settings: data.settings
      };

      // Handle file upload if a new logo is selected
      if (data.logo && data.logo instanceof File) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', data.logo);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload logo');
          }

          const { url } = await uploadResponse.json();
          dataToSend.logo = url;
        } catch (error) {
          console.error('Error uploading logo:', error);
          throw new Error('Failed to upload logo');
        }
      } else if (typeof data.logo === 'string') {
        dataToSend.logo = data.logo;
      }
      
      console.log('Sending data to server:', dataToSend);
      
      const response = await fetch('/api/clinic', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      const responseData = await response.json();
      console.log('Server response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update clinic settings');
      }

      if (!response.ok) {
        throw new Error('Failed to update clinic settings');
      }

      toast({
        title: 'Success',
        description: 'Clinic settings have been updated.',
      });
    } catch (error) {
      console.error('Error updating clinic settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update clinic settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!session?.user?.clinicId) {
    return (
      <div className="text-muted-foreground">
        No clinic associated with your account. Please contact support.
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
          <FormField
            control={form.control}
            name="name"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Clinic Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your clinic name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Clinic address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contact@clinic.com" {...field} />
                </FormControl>
                <FormDescription>
                  This email will be used for clinic-related communications.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="A brief description of your clinic"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="logo"
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel>Clinic Logo</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-4">
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Upload Logo</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        {...field}
                      />
                    </label>
                    {value && (
                      <div className="relative w-32 h-32">
                        <Image
                          src={typeof value === 'string' ? value : URL.createObjectURL(value)}
                          alt="Clinic logo"
                          fill
                          className="object-cover rounded-lg border"
                          sizes="128px"
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div>
            <h3 className="text-lg font-medium mb-4">Working Hours</h3>
            <div className="space-y-4">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-24">
                    <FormField
                      control={form.control}
                      name={`settings.workingHours.${day}.closed`}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) {
                                  form.setValue(`settings.workingHours.${day}.start`, '');
                                  form.setValue(`settings.workingHours.${day}.end`, '');
                                } else {
                                  form.setValue(`settings.workingHours.${day}.start`, '09:00');
                                  form.setValue(`settings.workingHours.${day}.end`, '17:00');
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="capitalize !m-0">{day}</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`settings.workingHours.${day}.start`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="time"
                              disabled={form.watch(`settings.workingHours.${day}.closed`)}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <span className="text-muted-foreground">to</span>
                    <FormField
                      control={form.control}
                      name={`settings.workingHours.${day}.end`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="time"
                              disabled={form.watch(`settings.workingHours.${day}.closed`)}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`settings.workingHours.${day}.closed`}
                      render={({ field }) => (
                        <FormItem className="ml-2">
                          <FormControl>
                            <span className="text-sm text-muted-foreground">
                              {field.value ? 'Closed' : 'Open'}
                            </span>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </form>
    </Form>
  );
}
