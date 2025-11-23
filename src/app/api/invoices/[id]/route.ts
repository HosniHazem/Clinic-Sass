import { NextResponse } from 'next/server';
import { prismaScoped } from '@/lib/prisma-scoped';
import { requireAuth, requireRole, runWithSessionClinic } from '@/lib/auth-utils';
import { z } from 'zod';

const UpdateInvoice = z.object({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const invoice = await db.raw.invoice.findUnique({
      where: { id: params.id },
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
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Failed to fetch invoice', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['RECEPTIONIST', 'ADMIN']);
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const body = await request.json();
    const parsed = UpdateInvoice.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updatedInvoice = await db.raw.invoice.update({
      where: { id: params.id },
      data: {
        status: parsed.data.status,
        notes: parsed.data.notes,
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Failed to update invoice', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}
