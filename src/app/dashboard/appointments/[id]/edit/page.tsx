"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function EditAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    patientName: '',
    doctorName: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    status: 'SCHEDULED',
    notes: ''
  });

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const res = await fetch(`/api/appointments/${params.id}`);
        if (!res.ok) throw new Error('Failed to fetch appointment');
        const data = await res.json();
        setForm({
          patientName: `${data.patient?.user?.firstName || ''} ${data.patient?.user?.lastName || ''}`.trim(),
          doctorName: `${data.doctor?.user?.firstName || ''} ${data.doctor?.user?.lastName || ''}`.trim(),
          appointmentDate: data.appointmentDate?.split('T')[0] || '',
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          status: data.status || 'SCHEDULED',
          notes: data.notes || ''
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load appointment details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointment();
  }, [params.id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`/api/appointments/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentDate: form.appointmentDate,
          startTime: form.startTime,
          endTime: form.endTime,
          status: form.status,
          notes: form.notes,
        }),
      });

      if (!res.ok) throw new Error('Failed to update appointment');
      
      toast({
        title: 'Success',
        description: 'Appointment updated successfully',
      });
      router.push(`/dashboard/appointments/${params.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update appointment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Appointment</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Patient</Label>
            <Input value={form.patientName} disabled />
          </div>
          <div className="space-y-2">
            <Label>Doctor</Label>
            <Input value={form.doctorName} disabled />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={form.appointmentDate}
              onChange={(e) => setForm({...form, appointmentDate: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({...form, startTime: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <Input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({...form, endTime: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm({...form, status: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({...form, notes: e.target.value})}
            rows={3}
          />
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/appointments/${params.id}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
