import { NextResponse } from 'next/server';
import { prismaScoped } from '@/lib/prisma-scoped';
import { requireAuth, requireRole, runWithSessionClinic } from '@/lib/auth-utils';
import { Consultation, ConsultationResponse, CreateConsultationInput } from '@/types/consultation';
import { z } from 'zod';
import { setCurrentClinic } from '@/lib/db-rls';

// Validation schema for creating a consultation
const CreateConsultationSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  vitalSigns: z.record(z.any()).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional().default('scheduled'),
});

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');

    const where: any = { clinicId };
    
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status.toUpperCase();

    const consultations = await db.raw.consultation.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { consultationDate: 'desc' },
    });

    // Map the data to include patient and doctor names and normalize status to lowercase for the frontend
    const formattedConsultations = consultations.map((consultation: any) => ({
      ...consultation,
      patientName: `${consultation.patient.user.firstName} ${consultation.patient.user.lastName}`,
      doctorName: `${consultation.doctor.user.firstName} ${consultation.doctor.user.lastName}`,
      status: consultation.status ? (consultation.status as string).toLowerCase() : consultation.status,
    }));

    return NextResponse.json({
      success: true,
      data: formattedConsultations,
    } as ConsultationResponse);
  } catch (error: any) {
    console.error('Failed to fetch consultations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch consultations' } as ConsultationResponse,
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireRole(['DOCTOR', 'ADMIN']);
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const body = await req.json();
    
    // Validate the request body
    const validation = CreateConsultationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validation.error.format() 
        } as ConsultationResponse,
        { status: 400 }
      );
    }

    // Extract status and normalize to Prisma enum value (UPPERCASE)
    const { appointmentId, patientId, doctorId, status, ...data } = validation.data as any;
    const prismaStatus = status ? (String(status).toUpperCase()) : undefined;

    // Check if appointment exists and is available
    const appointment = await db.raw.appointment.findUnique({
      where: { id: appointmentId, clinicId },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' } as ConsultationResponse,
        { status: 404 }
      );
    }

    // Check if there's already a consultation for this appointment
    const existingConsultation = await db.raw.consultation.findFirst({
      where: { appointmentId, clinicId },
    });

    if (existingConsultation) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A consultation already exists for this appointment' 
        } as ConsultationResponse,
        { status: 400 }
      );
    }

    // Compute consultationDate from appointment.appointmentDate and appointment.startTime
    let consultationDateValue: Date | undefined = undefined;
    try {
      if (appointment?.appointmentDate) {
        // appointmentDate is stored as a DateTime. Use it as base.
        const base = new Date(appointment.appointmentDate);

        // If startTime is present and looks like HH:mm, set hours/minutes
        if (appointment.startTime && typeof appointment.startTime === 'string') {
          const m = appointment.startTime.match(/^(\d{1,2}):(\d{2})$/);
          if (m) {
            const hh = Number(m[1]);
            const mm = Number(m[2]);
            base.setHours(hh, mm, 0, 0);
          }
        }

        consultationDateValue = base;
      }
    } catch (err) {
      console.warn('Failed to compute consultationDate from appointment, falling back to now', err);
      consultationDateValue = new Date();
    }

    // Create the consultation
    const consultation = await runWithSessionClinic(async (tx: any) => {
      return tx.consultation.create({
        data: {
          ...data,
          appointmentId,
          patientId,
          doctorId,
          clinicId,
          consultationDate: consultationDateValue || new Date(),
          ...(prismaStatus ? { status: prismaStatus } : {}),
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          doctor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
    });

    // Format the response
    const formattedConsultation = {
      ...consultation,
      patientName: `${consultation.patient?.user?.firstName || ''} ${consultation.patient?.user?.lastName || ''}`.trim(),
      doctorName: `${consultation.doctor?.user?.firstName || ''} ${consultation.doctor?.user?.lastName || ''}`.trim(),
      status: consultation.status ? (String(consultation.status).toLowerCase()) : consultation.status,
    };

    return NextResponse.json(
      { 
        success: true, 
        data: formattedConsultation,
        message: 'Consultation created successfully' 
      } as ConsultationResponse,
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create consultation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create consultation' 
      } as ConsultationResponse,
      { status: 500 }
    );
  }
}
