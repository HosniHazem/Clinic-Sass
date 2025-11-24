'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Edit, FileText, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Consultation, Prescription } from '@/types/consultation';
import Link from 'next/link';

export function ConsultationDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchConsultation = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/consultations/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch consultation');
        }
        
        const data = await response.json();
        if (data.success) {
          setConsultation(data.data);
        }
      } catch (error) {
        console.error('Error fetching consultation:', error);
        toast({
          title: 'Error',
          description: 'Failed to load consultation details',
          variant: 'destructive',
        });
        router.push('/dashboard/consultations');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchConsultation();
    }
  }, [id, router, toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading || !consultation) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading consultation details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Consultation Details
            </h1>
            <p className="text-sm text-muted-foreground">
              {consultation.patientName} - {formatDate(consultation.consultationDate)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/dashboard/consultations/${consultation.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button asChild>
            <Link href={`/dashboard/consultations/${consultation.id}/prescriptions/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New Prescription
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  Consultation Information
                  {getStatusBadge(consultation.status)}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  ID: {consultation.id}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Patient</h3>
                  <p className="font-medium">{consultation.patientName || 'N/A'}</p>
                  {consultation.patientId && (
                    <p className="text-sm text-muted-foreground">ID: {consultation.patientId}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Doctor</h3>
                  <p className="font-medium">{consultation.doctorName || 'N/A'}</p>
                  {consultation.doctorId && (
                    <p className="text-sm text-muted-foreground">ID: {consultation.doctorId}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Appointment</h3>
                  <p className="font-medium">
                    {consultation.appointmentId ? (
                      <Link 
                        href={`/dashboard/appointments/${consultation.appointmentId}`}
                        className="text-primary hover:underline"
                      >
                        View Appointment
                      </Link>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Consultation Date</h3>
                  <p className="font-medium">{formatDate(consultation.consultationDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Chief Complaint</h3>
                <div className="p-4 bg-muted/20 rounded-md">
                  {consultation.chiefComplaint || 'No chief complaint recorded'}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Diagnosis</h3>
                <div className="p-4 bg-muted/20 rounded-md">
                  {consultation.diagnosis || 'No diagnosis recorded'}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                <div className="p-4 bg-muted/20 rounded-md">
                  {consultation.notes || 'No additional notes'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vital Signs Card */}
          {consultation.vitalSigns && (
            <Card>
              <CardHeader>
                <CardTitle>Vital Signs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {consultation.vitalSigns.bloodPressure && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Blood Pressure</h3>
                      <p className="font-medium">{consultation.vitalSigns.bloodPressure}</p>
                    </div>
                  )}
                  {consultation.vitalSigns.heartRate && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Heart Rate</h3>
                      <p className="font-medium">{consultation.vitalSigns.heartRate} bpm</p>
                    </div>
                  )}
                  {consultation.vitalSigns.temperature && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Temperature</h3>
                      <p className="font-medium">{consultation.vitalSigns.temperature}°C</p>
                    </div>
                  )}
                  {consultation.vitalSigns.weight && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Weight</h3>
                      <p className="font-medium">{consultation.vitalSigns.weight} kg</p>
                    </div>
                  )}
                  {consultation.vitalSigns.height && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Height</h3>
                      <p className="font-medium">{consultation.vitalSigns.height} cm</p>
                    </div>
                  )}
                  {consultation.vitalSigns.bmi && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">BMI</h3>
                      <p className="font-medium">{consultation.vitalSigns.bmi}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="md:w-80 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Print Summary
              </Button>
              {consultation.status !== 'completed' && (
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Complete Consultation
                </Button>
              )}
              {consultation.status !== 'cancelled' && (
                <Button variant="outline" className="w-full justify-start text-destructive">
                  <FileText className="mr-2 h-4 w-4" />
                  Cancel Consultation
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Prescriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Prescriptions</CardTitle>
              <CardDescription>
                {consultation.prescriptions?.length || 0} prescriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {consultation.prescriptions && consultation.prescriptions.length > 0 ? (
                <div className="space-y-2">
                  {consultation.prescriptions.map((prescription: Prescription) => (
                    <div key={prescription.id} className="p-3 border rounded-md hover:bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{prescription.medications ? JSON.parse(String(prescription.medications)).length : 0} medications</p>
                          <p className="text-sm text-muted-foreground">{formatDate(prescription.prescriptionDate)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/prescriptions/${prescription.id}`}>View</Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/prescriptions/${prescription.id}/edit`}>Edit</Link>
                          </Button>
                          <Button size="sm" variant="destructive" onClick={async () => {
                            if (!confirm('Delete this prescription?')) return;
                            try {
                              const res = await fetch(`/api/prescriptions/${prescription.id}`, { method: 'DELETE' });
                              const body = await res.json().catch(() => ({}));
                              if (!res.ok) throw new Error(body?.error || 'Failed to delete');
                              // remove locally
                              setConsultation((c) => c ? { ...c, prescriptions: c.prescriptions?.filter((p) => p.id !== prescription.id) } as any : c);
                              toast({ title: 'Deleted', description: 'Prescription removed' });
                            } catch (err: any) {
                              toast({ title: 'Error', description: err.message || 'Delete failed', variant: 'destructive' });
                            }
                          }}>Delete</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">No prescriptions found</div>
              )}
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href={`/dashboard/consultations/${consultation.id}/prescriptions/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Prescription
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
