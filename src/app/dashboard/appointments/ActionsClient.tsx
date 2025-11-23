"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function ActionsClient({ appointment }: { appointment: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function postPatch(data: any) {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed');
      toast({ title: 'Saved', description: 'Appointment updated' });
      router.refresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed', variant: 'destructive' });
    } finally { setLoading(false); }
  }

  async function markCompleted() {
    await postPatch({ status: 'COMPLETED' });
  }

  async function cancel() {
    if (!confirm('Cancel this appointment?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed');
      toast({ title: 'Cancelled', description: 'Appointment cancelled' });
      router.push('/dashboard/appointments');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed', variant: 'destructive' });
    } finally { setLoading(false); }
  }

  async function reschedule() {
    // Handle both string and Date objects for appointmentDate
    const currentDate = appointment.appointmentDate 
      ? new Date(appointment.appointmentDate).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0];
    
    const newDate = prompt('Enter new date (YYYY-MM-DD)', currentDate);
    if (!newDate) return;
    
    const newTime = prompt('Enter new start time (HH:MM)', appointment.startTime || '');
    if (!newTime) return;
    
    // Compute end time based on same duration (if available)
    let endTime = appointment.endTime;
    try {
      const [sh, sm] = (appointment.startTime || '00:00').split(':').map(Number);
      const [eh, em] = (appointment.endTime || '00:00').split(':').map(Number);
      const durationMins = (eh * 60 + em) - (sh * 60 + sm);
      const [nh, nm] = newTime.split(':').map(Number);
      const start = new Date(); 
      start.setHours(nh, nm, 0, 0);
      const end = new Date(start.getTime() + Math.max(15, durationMins) * 60000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
    } catch (e) {
      console.error('Error calculating end time:', e);
      // keep original endTime if calculation fails
    }

    try {
      await postPatch({ 
        appointmentDate: newDate, 
        startTime: newTime, 
        endTime 
      });
    } catch (error) {
      console.error('Failed to reschedule:', error);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={() => { window.location.href = `/dashboard/appointments/${appointment.id}`; }} disabled={loading}>View</Button>
      <Button size="sm" variant="outline" onClick={() => { window.location.href = `/dashboard/appointments/${appointment.id}/edit`; }} disabled={loading}>Edit</Button>
      <Button size="sm" variant="outline" onClick={reschedule} disabled={loading}>Reschedule</Button>
      <Button size="sm" variant="secondary" onClick={markCompleted} disabled={loading}>Mark Completed</Button>
      <Button size="sm" variant="destructive" onClick={cancel} disabled={loading}>Cancel</Button>
    </div>
  );
}
