import { NextRequest, NextResponse } from 'next/server';
import { prismaScoped } from '@/lib/prisma-scoped';
import { requireAuth, requireRole } from '@/lib/auth-utils';
import { z } from 'zod';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const { id } = params;
    const service = await db.raw.service.findUnique({ where: { id } });
    if (!service || service.clinicId !== clinicId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(service);
  } catch (err) {
    console.error('Error fetching service:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(['ADMIN']);
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const { id } = params;
    const body = await req.json();

    const ServiceUpdate = z.object({
      name: z.string().optional(),
      description: z.string().optional().nullable(),
      price: z.number().optional(),
      duration: z.number().int().optional(),
      category: z.enum(['CONSULTATION', 'PROCEDURE', 'DIAGNOSTIC', 'THERAPY', 'SURGERY', 'OTHER']).optional(),
      isActive: z.boolean().optional(),
    });

    const parsed = ServiceUpdate.safeParse({
      ...body,
      category: body.category ? (body.category as string).toUpperCase() : undefined
    });
    
    if (!parsed.success) {
      console.error('Validation error:', parsed.error);
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const existing = await db.raw.service.findUnique({ where: { id } });
    if (!existing || existing.clinicId !== clinicId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = { ...parsed.data };
    
    // Ensure we don't send undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updated = await db.raw.service.update({ 
      where: { id }, 
      data: updateData 
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('Error updating service:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(['ADMIN']);
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const { id } = params;
    const existing = await db.raw.service.findUnique({ where: { id } });
    if (!existing || existing.clinicId !== clinicId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.raw.service.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error deleting service:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
