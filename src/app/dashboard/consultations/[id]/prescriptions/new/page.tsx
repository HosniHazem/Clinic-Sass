"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

type Medication = { name: string; dosage?: string; frequency?: string; duration?: string; notes?: string };

export default function NewPrescriptionPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [medications, setMedications] = useState<Medication[]>([{ name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/consultations/${id}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || 'Failed to load consultation');
        const data = body?.data || body;
        if (mounted && data) setPatientId(data.patientId);
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Could not load consultation', variant: 'destructive' });
        router.back();
      }
    })();
    return () => { mounted = false };
  }, [id, router, toast]);

  const updateMedication = (index: number, patch: Partial<Medication>) => {
    setMedications((m) => m.map((item, i) => i === index ? { ...item, ...patch } : item));
  };

  const addMedication = () => setMedications((m) => [...m, { name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
  const removeMedication = (index: number) => setMedications((m) => m.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !patientId) return;
    setIsLoading(true);
    try {
      const payload = { consultationId: id, patientId, medications: medications.filter(m => m.name.trim() !== ''), instructions };
      const res = await fetch('/api/prescriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Failed to create prescription');
      toast({ title: 'Created', description: 'Prescription created' });
      router.push(`/dashboard/consultations/${id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Create failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>New Prescription</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Medications</Label>
              <div className="space-y-2 mt-2">
                {medications.map((m, idx) => (
                  <div key={idx} className="p-3 border rounded grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input value={m.name} onChange={(e) => updateMedication(idx, { name: e.target.value })} required />
                    </div>
                    <div>
                      <Label className="text-xs">Dosage</Label>
                      <Input value={m.dosage} onChange={(e) => updateMedication(idx, { dosage: e.target.value })} />
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-xs">Frequency / Duration</Label>
                        <Input value={`${m.frequency || ''}${m.duration ? ' / ' + m.duration : ''}`} onChange={(e) => {
                          const parts = e.target.value.split('/').map(p => p.trim());
                          updateMedication(idx, { frequency: parts[0] || '', duration: parts[1] || '' });
                        }} />
                      </div>
                      <div>
                        <Button type="button" variant="destructive" onClick={() => removeMedication(idx)}>Remove</Button>
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs">Notes</Label>
                      <Textarea value={m.notes} onChange={(e) => updateMedication(idx, { notes: e.target.value })} />
                    </div>
                  </div>
                ))}
                <Button type="button" onClick={addMedication}><span className="mr-2">+</span>Add medication</Button>
              </div>
            </div>

            <div>
              <Label>Instructions</Label>
              <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Create Prescription'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
