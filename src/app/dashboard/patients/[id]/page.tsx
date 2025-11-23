"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PatientDetail {
  id: string;
  user: { firstName: string; lastName: string; email: string; phone: string };
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodType?: string | null;
  address?: string | null;
}

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      const res = await fetch(`/api/patients/${id}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setPatient(data);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load patient', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch(`/api/prescriptions?patientId=${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setPrescriptions(data || []);
    } catch (err) {
      console.error('Failed to load prescriptions', err);
    }
  };

  useEffect(() => { if (id) fetchPrescriptions(); }, [id]);

  if (isLoading) return <div className="py-12">Loading...</div>;
  if (!patient) return <div className="py-12">Patient not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/patients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{patient.user.firstName} {patient.user.lastName}</h1>
          <p className="text-muted-foreground">{patient.user.email}</p>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="font-semibold">Prescriptions</h3>
        {prescriptions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No prescriptions found</div>
        ) : (
          <ul className="space-y-2 mt-2">
            {prescriptions.map((p) => (
              <li key={p.id} className="p-2 border rounded flex justify-between items-center">
                <div>
                  <div className="font-medium">Prescription {p.id}</div>
                  <div className="text-sm text-muted-foreground">Date: {new Date(p.prescriptionDate).toLocaleString()}</div>
                </div>
                <div>
                  {p.pdfUrl ? (
                    <a href={p.pdfUrl} target="_blank" rel="noreferrer" className="link">Download</a>
                  ) : (
                    <span className="text-sm text-muted-foreground">PDF not available</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-md shadow">
          <h3 className="font-semibold mb-2">Contact</h3>
          <div>{patient.user.phone}</div>
          <div className="mt-4">Address: {patient.address || 'N/A'}</div>
        </div>

        <div className="p-4 bg-white rounded-md shadow">
          <h3 className="font-semibold mb-2">Medical</h3>
          <div>Gender: {patient.gender || 'N/A'}</div>
          <div>Blood Type: {patient.bloodType || 'N/A'}</div>
          <div>Date of Birth: {patient.dateOfBirth || 'N/A'}</div>
        </div>
      </div>
    </div>
  );
}
