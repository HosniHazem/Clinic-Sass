"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

type StaffRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST';

interface StaffFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
}

export default function EditStaffPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<StaffFormData>({ 
    firstName: '', 
    lastName: '', 
    email: '',
    role: 'RECEPTIONIST',
    isActive: true
  });
  
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch(`/api/staff/${id}`);
        if (!response.ok) throw new Error('Failed to fetch staff');
        const data = await response.json();
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          role: data.role || 'RECEPTIONIST',
          isActive: data.isActive ?? true
        });
      } catch (error) {
        console.error('Error fetching staff:', error);
        toast({
          title: 'Error',
          description: 'Failed to load staff details',
          variant: 'destructive',
        });
        router.push('/dashboard/staff');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchStaff();
    }
  }, [id, router, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRoleChange = (value: string) =>
    setForm(prev => ({ ...prev, role: value as StaffRole }));

  const handleStatusChange = (value: string) =>
    setForm(prev => ({ ...prev, isActive: value === 'active' }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
          isActive: form.isActive
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update staff');
      }

      toast({
        title: 'Success',
        description: 'Staff member updated successfully',
      });
      
      router.push('/dashboard/staff');
      router.refresh();
    } catch (error: any) {
      console.error('Error updating staff:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update staff',
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
        <h1 className="text-2xl font-bold">Edit Staff Member</h1>
        <p className="text-muted-foreground">Update staff details and permissions</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-medium">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                name="firstName" 
                value={form.firstName} 
                onChange={handleChange} 
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                name="lastName" 
                value={form.lastName} 
                onChange={handleChange} 
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              value={form.email} 
              onChange={handleChange} 
              required
              disabled
              className="bg-muted/50"
            />
            <p className="text-sm text-muted-foreground mt-1">Email cannot be changed after creation</p>
          </div>
        </div>

        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-medium">Role & Permissions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Role</Label>
              <Select 
                value={form.role} 
                onValueChange={handleRoleChange}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="DOCTOR">Doctor</SelectItem>
                  <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {form.role === 'ADMIN' && 'Full access to all features and settings'}
                {form.role === 'DOCTOR' && 'Can manage appointments and patient records'}
                {form.role === 'RECEPTIONIST' && 'Can manage appointments and basic patient information'}
              </p>
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
                {form.isActive ? 'This staff member can sign in' : 'This staff member cannot sign in'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/dashboard/staff')}
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
