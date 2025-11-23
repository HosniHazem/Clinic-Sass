import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireAuth, runWithSessionClinic } from '@/lib/auth-utils';
import { prismaScoped } from '@/lib/prisma-scoped';
import { z } from 'zod';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const appointment = await db.raw.appointment.findUnique({
      where: { id: params.id },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        doctor: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        service: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(['ADMIN', 'RECEPTIONIST', 'DOCTOR']);
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const body = await req.json();
    const Schema = z.object({
      status: z.string().optional(),
      appointmentDate: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      notes: z.string().optional().nullable(),
      doctorId: z.string().optional(),
      serviceId: z.string().optional(),
    });

    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });

    const data = parsed.data;

    const updated = await runWithSessionClinic(async (tx: any) => {
      return tx.appointment.update({
        where: { id: params.id },
        data: {
          status: data.status as any,
          appointmentDate: data.appointmentDate ? new Date(data.appointmentDate) : undefined,
          startTime: data.startTime,
          endTime: data.endTime,
          notes: data.notes,
          doctorId: data.doctorId,
          serviceId: data.serviceId,
        },
        include: { patient: { include: { user: true } }, doctor: { include: { user: true } }, service: true },
      });
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Failed to update appointment', err);
    return NextResponse.json({ error: err?.message || 'Internal' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(['ADMIN', 'RECEPTIONIST', 'DOCTOR']);
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const updated = await runWithSessionClinic(async (tx: any) => {
      return tx.appointment.update({ where: { id: params.id }, data: { status: 'CANCELLED' }, include: { patient: true } });
    });

    return NextResponse.json({ ok: true, appointment: updated });
  } catch (err: any) {
    console.error('Failed to cancel appointment', err);
    return NextResponse.json({ error: err?.message || 'Internal' }, { status: 500 });
  }
}
