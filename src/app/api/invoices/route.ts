import { NextResponse } from 'next/server';
import { prismaScoped } from '@/lib/prisma-scoped';
import { requireAuth, requireRole, runWithSessionClinic } from '@/lib/auth-utils';
import { z } from 'zod';

const InvoiceItem = z.object({
  description: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().nonnegative(),
  serviceId: z.string().optional().nullable(),
});

const CreateInvoice = z.object({
  patientId: z.string(),
  items: z.array(InvoiceItem).min(1),
  tax: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const session = await requireAuth();
  const clinicId = session.user.clinicId as string;
  const db = prismaScoped(clinicId);

  try {
    const invoices = await db.raw.invoice.findMany({ 
      where: { clinicId }, 
      include: { 
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }, 
        payments: true 
      } 
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Failed to fetch invoices', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await requireRole(['RECEPTIONIST', 'ADMIN']);
  const clinicId = session.user.clinicId as string;
  const db = prismaScoped(clinicId);

  try {
    const body = await req.json();
    const parsed = CreateInvoice.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });

    const { patientId, items, tax = 0, notes } = parsed.data;

    // Compute totals server-side
    const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const total = +(subtotal + tax);

    // Generate invoice inside a transaction that sets session clinic for RLS
    const invoice = await runWithSessionClinic(async (tx: any) => {
      const count = await tx.invoice.count({ where: { clinicId } });
      const invoiceNumber = `INV-${clinicId.slice(0, 6).toUpperCase()}-${String(count + 1).padStart(5, '0')}`;
      return tx.invoice.create({
        data: {
          clinicId,
          patientId,
          invoiceNumber,
          items: JSON.stringify(items),
          subtotal,
          tax,
          total,
          notes,
          status: 'PENDING',
        },
      });
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Failed to create invoice', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
