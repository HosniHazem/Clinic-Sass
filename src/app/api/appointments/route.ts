import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, runWithSessionClinic } from '@/lib/auth-utils';
import { prismaScoped } from '@/lib/prisma-scoped';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const appointments = await db.appointment.findMany({
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        service: true,
      },
      orderBy: { appointmentDate: 'desc' },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['ADMIN', 'RECEPTIONIST', 'PATIENT']);
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const body = await req.json();
    const AppointmentCreate = z.object({
      patientId: z.string(),
      doctorId: z.string(),
      serviceId: z.string().optional(),
      appointmentDate: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      notes: z.string().optional(),
    });

    const parsed = AppointmentCreate.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });

    const { patientId, doctorId, serviceId, appointmentDate, startTime, endTime, notes } = parsed.data;

    // Basic existence checks to provide clearer errors for common 500 causes.
    // Accept either a Doctor.id or a User.id (some clients send the user id).
    const patientExists = await db.patient.findUnique({ where: { id: patientId } });
    if (!patientExists) return NextResponse.json({ error: 'Patient not found' }, { status: 400 });

    // Resolve doctor: try to find by Doctor.id first, then by Doctor.userId (user id)
    let resolvedDoctorId = doctorId;
    let doctorRecord = await db.raw.doctor.findUnique({ where: { id: doctorId } });
    if (!doctorRecord) {
      // try treating provided value as a User.id and find the doctor record
      const byUser = await db.raw.doctor.findFirst({ where: { userId: doctorId } });
      if (byUser) {
        resolvedDoctorId = byUser.id;
        doctorRecord = byUser;
        console.warn('Resolved doctorId from userId to doctor id', { provided: doctorId, resolved: resolvedDoctorId });
      }
    }
    if (!doctorRecord) return NextResponse.json({ error: 'Doctor not found' }, { status: 400 });

    // Basic conflict detection: ensure no overlapping appointment for same doctor
    // Run conflict check and create inside a transaction so RLS applies
    let appointment;
    try {
      appointment = await runWithSessionClinic(async (tx: any) => {
      const overlapping = await tx.appointment.findMany({
        where: {
          doctorId: resolvedDoctorId,
          appointmentDate: new Date(appointmentDate),
          OR: [
            { startTime: { lte: endTime }, endTime: { gte: startTime } },
          ],
        },
      });

      if (overlapping.length > 0) {
        throw new Error('APPOINTMENT_CONFLICT');
      }

      const appt = await tx.appointment.create({
        data: {
          patientId,
          doctorId: resolvedDoctorId,
          serviceId: serviceId || null,
          appointmentDate: new Date(appointmentDate),
          startTime,
          endTime,
          notes,
          status: 'SCHEDULED',
          clinicId,
        },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          service: true,
        },
      });

      return appt;
      });
    } catch (err: any) {
      if (err?.message === 'APPOINTMENT_CONFLICT') return NextResponse.json({ error: 'Appointment conflict detected' }, { status: 409 });
      console.error('Appointment creation failed:', err);
      const isProd = process.env.NODE_ENV === 'production';
      return NextResponse.json({ error: isProd ? 'Internal server error' : (err?.message || String(err)) }, { status: 500 });
    }

    return NextResponse.json(appointment, { status: 201 });
    } catch (error) {
    console.error('Error creating appointment (outer):', error);
    const isProd = process.env.NODE_ENV === 'production';
    const msg = (error as any)?.message ?? String(error);
    return NextResponse.json(
      { error: isProd ? 'Internal server error' : msg },
      { status: 500 }
    );
  }
}
