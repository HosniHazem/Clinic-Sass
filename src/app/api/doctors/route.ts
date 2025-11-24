import { NextRequest, NextResponse } from 'next/server';
import { prismaScoped } from '@/lib/prisma-scoped';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    // Return Doctor records with nested user info so frontend can display names
    const doctors = await db.raw.doctor.findMany({
      where: { clinicId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(doctors);
  } catch (err) {
    console.error('Failed to list doctors', err);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

