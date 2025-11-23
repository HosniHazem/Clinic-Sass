import { NextRequest, NextResponse } from 'next/server';
import { prismaScoped } from '@/lib/prisma-scoped';
import { requireAuth, requireRole } from '@/lib/auth-utils';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const session = await requireAuth();
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const patient = await db.patient.findUnique({ where: { id }, include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } });

    if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(['ADMIN', 'RECEPTIONIST']);
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const { id } = params;
    const patient = await db.raw.patient.findUnique({ where: { id } });
    if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (patient.clinicId !== clinicId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await db.raw.$transaction([
      db.raw.patient.delete({ where: { id } }),
      db.raw.user.delete({ where: { id: patient.userId } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(['ADMIN', 'RECEPTIONIST']);
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const { id } = params;
    const body = await req.json();

    const patient = await db.raw.patient.findUnique({ where: { id } });
    if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (patient.clinicId !== clinicId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updated = await db.raw.$transaction(async (tx) => {
      if (body.user) await tx.user.update({ where: { id: patient.userId }, data: body.user });
      const updatedPatient = await tx.patient.update({ where: { id }, data: body.patient });
      return updatedPatient;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
