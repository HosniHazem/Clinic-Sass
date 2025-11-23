import { NextRequest, NextResponse } from 'next/server';
import { prismaScoped } from '@/lib/prisma-scoped';
import { z } from 'zod';
import { requireRole, requireAuth, runWithSessionClinic } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const services = await db.service.findMany({ orderBy: { createdAt: 'desc' } });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // only ADMIN or RECEPTIONIST can create services
    const session = await requireRole(['ADMIN', 'RECEPTIONIST']);

    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const body = await req.json();

    const ServiceCreate = z.object({
      name: z.string().min(1),
      description: z.string().optional().nullable(),
      price: z.number().nonnegative(),
      duration: z.number().int().nonnegative(),
      category: z.string().optional(),
      isActive: z.boolean().optional(),
    });

    const parsed = ServiceCreate.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const { name, description, price, duration, category, isActive } = parsed.data;

    const service = await runWithSessionClinic(async (tx: any) => {
      return tx.service.create({
        data: {
          clinicId,
          name,
          description: description || null,
          price,
          duration,
          category: category as any,
          isActive: typeof isActive === 'boolean' ? isActive : true,
        },
      });
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
