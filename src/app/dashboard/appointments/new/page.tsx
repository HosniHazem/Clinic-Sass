"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function NewAppointmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ patientId: '', serviceId: '', doctorId: '', date: '', time: '', startTime: '', endTime: '', notes: '' });
  const [patients, setPatients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [pRes, sRes] = await Promise.all([fetch('/api/patients'), fetch('/api/services')]);
        if (pRes.ok) {
          const pdata = await pRes.json();
          if (mounted) setPatients(pdata || []);
        }
        if (sRes.ok) {
          const sdata = await sRes.json();
          if (mounted) setServices(sdata || []);
        }
        // fetch doctors (available clinicians)
        try {
          const dRes = await fetch('/api/doctors');
          if (dRes.ok) {
            const ddata = await dRes.json();
            if (mounted) setDoctors(ddata || []);
          }
        } catch (err) {
          // ignore
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // ensure start/end times are present; if missing compute from selected service duration
      let startTime = form.startTime;
      let endTime = form.endTime;
      if ((!startTime || !endTime) && form.time && form.serviceId) {
        const svc = services.find((s) => s.id === form.serviceId);
        if (svc) {
          const [hh, mm] = form.time.split(':').map(Number);
          const start = new Date();
          start.setHours(hh, mm, 0, 0);
          const end = new Date(start.getTime() + (Number(svc.duration || 0) * 60000));
          const pad = (n: number) => n.toString().padStart(2, '0');
          startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
          endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
        }
      }

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: form.patientId,
          doctorId: form.doctorId,
          serviceId: form.serviceId,
          appointmentDate: form.date,
          startTime,
          endTime,
          notes: form.notes,
        }),
      });

      if (!res.ok) throw new Error('Failed to create appointment');
      toast({ title: 'Success', description: 'Appointment created' });
      router.push('/dashboard/appointments');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to create', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Appointment</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <Label htmlFor="patientId">Patient</Label>
          <Select value={form.patientId} onValueChange={(val) => setForm((p) => ({ ...p, patientId: val }))}>
            <SelectTrigger>
              <SelectValue placeholder={patients.length ? 'Select patient' : 'Loading...'} />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.user?.firstName || p.user?.email ? `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() || p.user?.email : p.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="serviceId">Service</Label>
          <Select value={form.serviceId} onValueChange={(val) => setForm((p) => ({ ...p, serviceId: val }))}>
            <SelectTrigger>
              <SelectValue placeholder={services.length ? 'Select service' : 'Loading...'} />
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} {typeof s.price !== 'undefined' ? `– $${s.price}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
          </div>
          <div>
              <Label htmlFor="time">Time</Label>
              <Input id="time" name="time" type="time" value={form.time} onChange={(e) => {
                handleChange(e);
                // recompute endTime when time changes
                const val = e.target.value;
                const svc = services.find((s) => s.id === form.serviceId);
                if (svc && val) {
                  const [hh, mm] = val.split(':').map(Number);
                  const start = new Date();
                  start.setHours(hh, mm, 0, 0);
                  const end = new Date(start.getTime() + (Number(svc.duration || 0) * 60000));
                  const pad = (n: number) => n.toString().padStart(2, '0');
                  setForm((p) => ({ ...p, startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`, endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}` }));
                }
              }} required />
          </div>
        </div>
          <div>
            <Label htmlFor="doctorId">Doctor</Label>
            <Select value={form.doctorId} onValueChange={(val) => setForm((p) => ({ ...p, doctorId: val }))}>
              <SelectTrigger>
                <SelectValue placeholder={doctors.length ? 'Select doctor' : 'Loading...'} />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>{(d.firstName || d.email) ? `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.email : d.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" value={form.notes} onChange={handleChange} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Create'}</Button>
        </div>
      </form>
    </div>
  );
}
