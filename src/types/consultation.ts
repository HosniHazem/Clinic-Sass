export type ConsultationStatus = 'scheduled' | 'completed' | 'cancelled';

export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  // Add other vital signs as needed
}

export interface Consultation {
  id: string;
  appointmentId: string;
  clinicId: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  chiefComplaint: string;
  diagnosis?: string;
  notes?: string;
  vitalSigns?: VitalSigns;
  consultationDate: string | Date;
  status: ConsultationStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  // Relations
  prescriptions?: Prescription[];
}

export interface CreateConsultationInput {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  chiefComplaint: string;
  diagnosis?: string;
  notes?: string;
  vitalSigns?: VitalSigns;
  status?: ConsultationStatus;
}

export interface UpdateConsultationInput extends Partial<CreateConsultationInput> {
  id: string;
}

// For API responses
export type ConsultationResponse = {
  success: boolean;
  data?: Consultation | Consultation[];
  error?: string;
  message?: string;
};

// For the prescriptions relation
export interface Prescription {
  id: string;
  consultationId: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  medications: Medication[];
  instructions?: string;
  prescriptionDate: string | Date;
  pdfUrl?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
}
