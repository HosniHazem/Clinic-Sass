"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

type Medication = { name: string; dosage?: string; frequency?: string; duration?: string; notes?: string };

export default function EditPrescriptionPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/prescriptions/${params.id}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || 'Failed to load prescription');
        const pres = body;
        // pres.medications may be stringified JSON
        let meds: Medication[] = [];
        try { meds = pres.medications ? JSON.parse(String(pres.medications)) : []; } catch (e) { meds = []; }
        if (mounted) {
          setMedications(meds.length ? meds : [{ name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
          setInstructions(pres.instructions || '');
        }
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Could not load prescription', variant: 'destructive' });
        router.back();
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [params.id, router, toast]);

  const updateMedication = (index: number, patch: Partial<Medication>) => {
    setMedications((m) => m.map((item, i) => i === index ? { ...item, ...patch } : item));
  };
  const addMedication = () => setMedications((m) => [...m, { name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
  const removeMedication = (i: number) => setMedications((m) => m.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = { medications, instructions };
      const res = await fetch(`/api/prescriptions/${params.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Failed to update prescription');
      toast({ title: 'Updated', description: 'Prescription updated' });
      router.push(`/dashboard/prescriptions/${params.id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Update failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Prescription</CardTitle>
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
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
