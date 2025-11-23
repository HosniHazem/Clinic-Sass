import { NextRequest, NextResponse } from 'next/server';
import { prismaScoped } from '@/lib/prisma-scoped';
import { requireRole } from '@/lib/auth-utils';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST']);
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const clinic = await db.raw.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        description: true,
        settings: true,
      },
    });

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    return NextResponse.json(clinic);
  } catch (err) {
    console.error('Error fetching clinic:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireRole(['ADMIN']);
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);
    const body = await req.json();

    const ClinicUpdateSchema = z.object({
      name: z.string().min(1, 'Clinic name is required'),
      address: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      email: z.string().email('Invalid email').optional().nullable(),
      description: z.string().optional().nullable(),
      settings: z.record(z.any()).optional(),
    });

    const parsed = ClinicUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updatedClinic = await db.raw.clinic.update({
      where: { id: clinicId },
      data: {
        ...parsed.data,
        settings: parsed.data.settings ? JSON.stringify(parsed.data.settings) : undefined,
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        description: true,
        settings: true,
      },
    });

    // Parse settings JSON string back to object
    const response = {
      ...updatedClinic,
      settings: updatedClinic.settings ? JSON.parse(updatedClinic.settings as string) : {},
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Error updating clinic:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
