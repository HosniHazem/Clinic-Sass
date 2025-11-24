"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

type Medication = { name: string; dosage?: string; frequency?: string; duration?: string; notes?: string };

export default function PrescriptionViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/prescriptions/${params.id}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || 'Failed to load prescription');
        if (mounted) setPrescription(body);
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Could not load prescription', variant: 'destructive' });
        router.back();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [params.id, router, toast]);

  const handleDelete = async () => {
    if (!confirm('Delete this prescription?')) return;
    try {
      const res = await fetch(`/api/prescriptions/${params.id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Delete failed');
      toast({ title: 'Deleted', description: 'Prescription deleted' });
      // go back to consultation or list
      router.push('/dashboard/consultations');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Delete failed', variant: 'destructive' });
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!prescription) return <div className="p-6">Not found</div>;

  let meds: Medication[] = [];
  try { meds = prescription.medications ? JSON.parse(String(prescription.medications)) : []; } catch (e) { meds = []; }

  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Prescription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-sm text-muted-foreground">Issued by: {prescription.doctorName || '—'}</div>
            <div className="text-sm text-muted-foreground">For patient: {prescription.patientName || '—'}</div>
            <div className="text-sm text-muted-foreground">Date: {new Date(prescription.createdAt).toLocaleString()}</div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold">Medications</h4>
            <ul className="list-disc pl-6 mt-2">
              {meds.length ? meds.map((m, i) => (
                <li key={i} className="mb-2">
                  <div className="font-medium">{m.name}{m.dosage ? ` — ${m.dosage}` : ''}</div>
                  <div className="text-sm text-muted-foreground">{m.frequency || ''}{m.duration ? ` • ${m.duration}` : ''}</div>
                  {m.notes ? <div className="text-sm mt-1">{m.notes}</div> : null}
                </li>
              )) : <li>No medications listed</li>}
            </ul>
          </div>

          {prescription.instructions ? (
            <div className="mb-4">
              <h4 className="font-semibold">Instructions</h4>
              <div className="whitespace-pre-wrap mt-2">{prescription.instructions}</div>
            </div>
          ) : null}

          {prescription.pdfUrl ? (
            <div className="mb-4">
              <a className="text-primary underline" href={prescription.pdfUrl} target="_blank" rel="noreferrer">Open prescription PDF</a>
            </div>
          ) : null}

          <div className="flex gap-2 justify-end">
            <Link href={`/dashboard/prescriptions/${params.id}/edit`}><Button>Edit</Button></Link>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
