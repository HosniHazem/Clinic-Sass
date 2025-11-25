"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditPatientPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const loadPatient = async () => {
      try {
        const res = await fetch(`/api/patients/${id}`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setFormData({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          phone: data.user.phone,
          dateOfBirth: data.dateOfBirth || '',
          gender: data.gender || '',
          bloodType: data.bloodType || '',
          address: data.address || '',
          emergencyContact: data.emergencyContact || '',
          allergies: data.allergies || '',
          chronicConditions: data.chronicConditions || '',
        });
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load patient', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    loadPatient();
  }, [id, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
          },
          patient: {
            dateOfBirth: formData.dateOfBirth || null,
            gender: formData.gender,
            bloodType: formData.bloodType,
            address: formData.address,
            emergencyContact: formData.emergencyContact,
            allergies: formData.allergies,
            chronicConditions: formData.chronicConditions,
          }
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }

      toast({ title: 'Success', description: 'Patient updated' });
      router.push('/dashboard/patients');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/patients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Patient</h1>
          <p className="text-muted-foreground">Update patient information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" name="firstName" value={formData.firstName || ''} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" name="lastName" value={formData.lastName || ''} onChange={handleChange} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} required />
          </div>
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" name="address" value={formData.address || ''} onChange={handleChange} />
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/dashboard/patients">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </div>
  );
}
