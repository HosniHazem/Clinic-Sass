'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Consultation } from '@/types/consultation';

export function ConsultationList() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/consultations');
        
        if (!response.ok) {
          throw new Error('Failed to fetch consultations');
        }
        
        const data = await response.json();
        if (data.success) {
          setConsultations(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching consultations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load consultations',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultations();
  }, [toast]);

  const filteredConsultations = consultations.filter(consultation => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (consultation.patientName?.toLowerCase().includes(searchLower)) ||
      (consultation.doctorName?.toLowerCase().includes(searchLower)) ||
      (consultation.chiefComplaint?.toLowerCase().includes(searchLower)) ||
      (consultation.diagnosis?.toLowerCase().includes(searchLower)) ||
      (consultation.status?.toLowerCase().includes(searchLower))
    );
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading consultations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Consultations</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search consultations..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => router.push('/dashboard/consultations/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Consultation
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Consultations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Complaint</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsultations.length > 0 ? (
                  filteredConsultations.map((consultation) => (
                    <TableRow key={consultation.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {consultation.patientName || 'N/A'}
                      </TableCell>
                      <TableCell>{consultation.doctorName || 'N/A'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {consultation.chiefComplaint || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {consultation.consultationDate 
                          ? formatDate(consultation.consultationDate)
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(consultation.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/consultations/${consultation.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No matching consultations found' : 'No consultations found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
