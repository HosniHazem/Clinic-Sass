import { NextResponse } from 'next/server';
import { prismaScoped } from '@/lib/prisma-scoped';
import { requireAuth, requireRole, runWithSessionClinic } from '@/lib/auth-utils';
import { Consultation, ConsultationResponse, UpdateConsultationInput } from '@/types/consultation';
import { z } from 'zod';
// import { runWithSessionClinic } from '@/lib/db-rls';

// Validation schema for updating a consultation
const UpdateConsultationSchema = z.object({
  chiefComplaint: z.string().min(1, 'Chief complaint is required').optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  vitalSigns: z.record(z.any()).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
});

type Params = {
  params: {
    id: string;
  };
};

export async function GET(req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const clinicId = session.user.clinicId as string;
    const { id } = params;
    const db = prismaScoped(clinicId);

    const consultation = await db.raw.consultation.findUnique({
      where: { id, clinicId },
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
        prescriptions: true,
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { success: false, error: 'Consultation not found' } as ConsultationResponse,
        { status: 404 }
      );
    }

    // Format the response (normalize status to lowercase)
    const formattedConsultation = {
      ...consultation,
      patientName: `${consultation.patient?.user?.firstName || ''} ${consultation.patient?.user?.lastName || ''}`.trim(),
      doctorName: `${consultation.doctor?.user?.firstName || ''} ${consultation.doctor?.user?.lastName || ''}`.trim(),
      status: consultation.status ? (String(consultation.status).toLowerCase()) : consultation.status,
    };

    return NextResponse.json({
      success: true,
      data: formattedConsultation,
    } as ConsultationResponse);
  } catch (error: any) {
    console.error(`Failed to fetch consultation:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch consultation' } as ConsultationResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await requireRole(['DOCTOR', 'ADMIN']);
    const clinicId = session.user.clinicId as string;
    const { id } = params;
    const db = prismaScoped(clinicId);

    const body = await req.json();
    
    // Validate the request body
    const validation = UpdateConsultationSchema.safeParse(body);
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

    // Check if consultation exists
    const existingConsultation = await db.raw.consultation.findUnique({
      where: { id, clinicId },
    });

    if (!existingConsultation) {
      return NextResponse.json(
        { success: false, error: 'Consultation not found' } as ConsultationResponse,
        { status: 404 }
      );
    }

    // Update the consultation (map status to Prisma enum uppercase)
    const updateData: any = { ...validation.data };
    if (updateData.status) updateData.status = String(updateData.status).toUpperCase();

    const updatedConsultation = await runWithSessionClinic(async (tx: any) => {
      return tx.consultation.update({
        where: { id, clinicId },
        data: updateData,
        include: {
          patient: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
          doctor: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
          prescriptions: true,
        },
      });
    });

    // Format the response
    const formattedConsultation = {
      ...updatedConsultation,
      patientName: `${updatedConsultation.patient?.user?.firstName || ''} ${updatedConsultation.patient?.user?.lastName || ''}`.trim(),
      doctorName: `${updatedConsultation.doctor?.user?.firstName || ''} ${updatedConsultation.doctor?.user?.lastName || ''}`.trim(),
      status: updatedConsultation.status ? (String(updatedConsultation.status).toLowerCase()) : updatedConsultation.status,
    };

    return NextResponse.json({
      success: true,
      data: formattedConsultation,
      message: 'Consultation updated successfully',
    } as ConsultationResponse);
  } catch (error: any) {
    console.error(`Failed to update consultation:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update consultation' } as ConsultationResponse,
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const session = await requireRole(['ADMIN']); // Only admins can delete consultations
    const clinicId = session.user.clinicId as string;
    const { id } = params;
    const db = prismaScoped(clinicId);

    // Check if consultation exists
    const existingConsultation = await db.raw.consultation.findUnique({
      where: { id, clinicId },
    });

    if (!existingConsultation) {
      return NextResponse.json(
        { success: false, error: 'Consultation not found' } as ConsultationResponse,
        { status: 404 }
      );
    }

    // Delete the consultation
    await runWithSessionClinic(async (tx: any) => {
      // Note: Due to the ON DELETE CASCADE in the schema, related prescriptions will also be deleted
      return tx.consultation.delete({
        where: { id, clinicId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Consultation deleted successfully',
    } as ConsultationResponse);
  } catch (error: any) {
    console.error(`Failed to delete consultation:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete consultation' } as ConsultationResponse,
      { status: 500 }
    );
  }
}
