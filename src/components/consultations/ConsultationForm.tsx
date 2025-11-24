'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Consultation, CreateConsultationInput, UpdateConsultationInput } from '@/types/consultation';

// Types for dropdown options
interface DropdownOption {
  value: string;
  label: string;
  [key: string]: any;
}

const consultationFormSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment is required'),
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().min(1, 'Doctor is required'),
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
  // Vital signs
  bloodPressure: z.string().optional(),
  heartRate: z.string().optional(),
  temperature: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
});

type ConsultationFormValues = z.infer<typeof consultationFormSchema>;

interface ConsultationFormProps {
  initialData?: Partial<Consultation>;
  onSuccess?: () => void;
  onCancel?: () => void;
  appointmentId?: string;
  patientId?: string;
  doctorId?: string;
}

export function ConsultationForm({ 
  initialData, 
  onSuccess, 
  onCancel,
  appointmentId: propAppointmentId,
  patientId: propPatientId,
  doctorId: propDoctorId
}: ConsultationFormProps) {
  // State for dropdown options
  const [appointments, setAppointments] = useState<DropdownOption[]>([]);
  const [patients, setPatients] = useState<DropdownOption[]>([]);
  const [doctors, setDoctors] = useState<DropdownOption[]>([]);
  const [isLoading, setIsLoading] = useState({
    appointments: false,
    patients: false,
    doctors: false
  });

  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);


  // Helper function to handle API responses
  const fetchWithErrorHandling = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      // Handle both { data: [...] } and direct array responses
      return Array.isArray(result) ? result : (result.data || []);
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      return []; // Return empty array on error
    }
  };

  // Fetch data for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Set all loading states to true
        setIsLoading({
          appointments: true,
          patients: true,
          doctors: true
        });

        // Fetch all data in parallel
        const [appointmentsData, patientsData, doctorsData] = await Promise.all([
          fetchWithErrorHandling('/api/appointments'),
          fetchWithErrorHandling('/api/patients'),
          fetchWithErrorHandling('/api/doctors')
        ]);

        // Process appointments (use nested patient.user name if available)
        setAppointments(appointmentsData.map((appt: any) => {
          const patientLabel = appt.patient?.user
            ? `${appt.patient.user.firstName} ${appt.patient.user.lastName}`
            : (appt.patientName || 'Appointment');

          return {
            value: appt.id,
            label: `${patientLabel} - ${appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString() : ''}`,
            patientId: appt.patientId,
            doctorId: appt.doctorId,
          };
        }));

        // Process patients
        setPatients(patientsData.map((patient: any) => ({
          value: patient.id,
          label: patient.user 
            ? `${patient.user.firstName} ${patient.user.lastName}`
            : `Patient ${patient.id}`
        })));

        // Process doctors
        setDoctors(doctorsData.map((doctor: any) => ({
          value: doctor.id,
          label: doctor.user 
            ? `${doctor.user.firstName} ${doctor.user.lastName}`
            : `Doctor ${doctor.id}`
        })));

      } catch (error) {
        console.error('Error in fetchData:', error);
        toast({
          title: 'Error',
          description: 'Failed to load form data. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading({
          appointments: false,
          patients: false,
          doctors: false
        });
      }
    };

    fetchData();
  }, [toast]);

  // Handle appointment selection
  const handleAppointmentSelect = (appointmentId: string) => {
    const selectedAppointment = appointments.find(a => a.value === appointmentId);
    if (selectedAppointment) {
      form.setValue('patientId', selectedAppointment.patientId);
      form.setValue('doctorId', selectedAppointment.doctorId);
    }
  };
  const [isEditingVitals, setIsEditingVitals] = useState(false);

  const form = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationFormSchema),
    defaultValues: {
      appointmentId: initialData?.appointmentId || propAppointmentId || '',
      patientId: initialData?.patientId || propPatientId || '',
      doctorId: initialData?.doctorId || propDoctorId || '',
      chiefComplaint: initialData?.chiefComplaint || '',
      diagnosis: initialData?.diagnosis || '',
      notes: initialData?.notes || '',
      status: (initialData?.status as any) || 'scheduled',
      bloodPressure: initialData?.vitalSigns?.bloodPressure || '',
      heartRate: initialData?.vitalSigns?.heartRate?.toString() || '',
      temperature: initialData?.vitalSigns?.temperature?.toString() || '',
      weight: initialData?.vitalSigns?.weight?.toString() || '',
      height: initialData?.vitalSigns?.height?.toString() || '',
    },
  });

  const anyLoading = isSaving || form.formState.isSubmitting || isLoading.appointments || isLoading.patients || isLoading.doctors;

  useEffect(() => {
    if (initialData) {
      form.reset({
        appointmentId: initialData.appointmentId || propAppointmentId || '',
        patientId: initialData.patientId || propPatientId || '',
        doctorId: initialData.doctorId || propDoctorId || '',
        chiefComplaint: initialData.chiefComplaint || '',
        diagnosis: initialData.diagnosis || '',
        notes: initialData.notes || '',
        status: (initialData.status as any) || 'scheduled',
        bloodPressure: initialData.vitalSigns?.bloodPressure || '',
        heartRate: initialData.vitalSigns?.heartRate?.toString() || '',
        temperature: initialData.vitalSigns?.temperature?.toString() || '',
        weight: initialData.vitalSigns?.weight?.toString() || '',
        height: initialData.vitalSigns?.height?.toString() || '',
      });
    }
  }, [initialData, form, propAppointmentId, propPatientId, propDoctorId]);

  const onSubmit = async (values: ConsultationFormValues) => {
    try {
      setIsSaving(true);
      
      const vitalSigns = {
        bloodPressure: values.bloodPressure,
        heartRate: values.heartRate ? Number(values.heartRate) : undefined,
        temperature: values.temperature ? Number(values.temperature) : undefined,
        weight: values.weight ? Number(values.weight) : undefined,
        height: values.height ? Number(values.height) : undefined,
      };

      const consultationData = {
        ...values,
        vitalSigns,
      };

      const url = initialData?.id 
        ? `/api/consultations/${initialData.id}`
        : '/api/consultations';
      
      const method = initialData?.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consultationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      const result = await response.json();
      
      toast({
        title: initialData?.id ? 'Consultation updated' : 'Consultation created',
        description: initialData?.id 
          ? 'The consultation has been updated successfully.'
          : 'A new consultation has been created successfully.',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error saving consultation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save consultation',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Appointment */}
          <FormField
            control={form.control}
            name="appointmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Appointment</FormLabel>
                <Select
                  disabled={isLoading.appointments || form.formState.isSubmitting}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleAppointmentSelect(value);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an appointment" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoading.appointments ? (
                      <div className="p-2 text-center text-sm text-gray-500">
                        Loading appointments...
                      </div>
                    ) : appointments.length > 0 ? (
                      appointments.map((appointment) => (
                        <SelectItem key={appointment.value} value={appointment.value}>
                          {appointment.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-gray-500">
                        No appointments found
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Patient */}
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient</FormLabel>
                <Select
                  disabled={isLoading.patients || form.formState.isSubmitting}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoading.patients ? (
                      <div className="p-2 text-center text-sm text-gray-500">
                        Loading patients...
                      </div>
                    ) : patients.length > 0 ? (
                      patients.map((patient) => (
                        <SelectItem key={patient.value} value={patient.value}>
                          {patient.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-gray-500">
                        No patients found
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Doctor */}
          <FormField
            control={form.control}
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doctor</FormLabel>
                <Select
                  disabled={isLoading.doctors || form.formState.isSubmitting}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoading.doctors ? (
                      <div className="p-2 text-center text-sm text-gray-500">
                        Loading doctors...
                      </div>
                    ) : doctors.length > 0 ? (
                      doctors.map((doctor) => (
                        <SelectItem key={doctor.value} value={doctor.value}>
                          {doctor.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-gray-500">
                        No doctors found
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={form.formState.isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="chiefComplaint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chief Complaint</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the patient's chief complaint"
                  className="min-h-[100px]"
                  {...field}
                  disabled={anyLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="diagnosis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Diagnosis</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter diagnosis"
                  className="min-h-[100px]"
                  {...field}
                  disabled={anyLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes"
                  className="min-h-[100px]"
                  {...field}
                  disabled={anyLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Vital Signs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Vital Signs</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditingVitals(!isEditingVitals)}
              disabled={anyLoading}
            >
              {isEditingVitals ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vital Signs
                </>
              )}
            </Button>
          </div>

          {isEditingVitals && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
              <FormField
                control={form.control}
                name="bloodPressure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Pressure</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 120/80"
                        {...field}
                        disabled={anyLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heartRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heart Rate (bpm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 72"
                        {...field}
                        disabled={anyLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature (°C)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 36.8"
                        {...field}
                        disabled={anyLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 70.5"
                        {...field}
                        disabled={anyLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 175"
                        {...field}
                        disabled={anyLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={anyLoading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={anyLoading}>
            {anyLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id ? 'Update Consultation' : 'Create Consultation'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
