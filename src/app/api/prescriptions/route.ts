import { NextResponse } from 'next/server';
import { prismaScoped } from '@/lib/prisma-scoped';
import { getDownloadUrl } from '@/lib/storage';
import { requireAuth, requireRole, runWithSessionClinic } from '@/lib/auth-utils';
import { z } from 'zod';
import { jsPDF } from 'jspdf';
import { uploadBuffer } from '@/lib/storage';

const Medication = z.object({
  name: z.string(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  notes: z.string().optional(),
});

const CreatePrescription = z.object({
  consultationId: z.string(),
  patientId: z.string(),
  medications: z.array(Medication).min(1),
  instructions: z.string().optional().nullable(),
  doctorId: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await requireAuth();
  const clinicId = session.user.clinicId as string;
  const db = prismaScoped(clinicId);

  try {
    const url = new URL(req.url);
    const patientId = url.searchParams.get('patientId');
    const doctorId = url.searchParams.get('doctorId');

    const where: any = { clinicId };
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;

    const prescriptions = await db.raw.prescription.findMany({ where, include: { patient: true, doctor: true } });

    // convert stored pdf keys to downloadable URLs when possible
    const converted = await Promise.all(
      prescriptions.map(async (p: any) => {
        if (p.pdfUrl) {
          try {
            p.pdfUrl = await getDownloadUrl(p.pdfUrl);
          } catch (err) {
            console.warn('Failed to get pdf url', err);
          }
        }
        return p;
      })
    );

    return NextResponse.json(converted);
  } catch (error) {
    console.error('Failed to fetch prescriptions', error);
    return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await requireRole(['DOCTOR', 'ADMIN']);
  const clinicId = session.user.clinicId as string;
  const db = prismaScoped(clinicId);

  try {
    const body = await req.json();
    const parsed = CreatePrescription.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });

    const { consultationId, patientId, medications, instructions, doctorId: providedDoctorId } = parsed.data;

    // Resolve doctorId: if provided (admin) use it, otherwise try to find doctor by current user
    let doctorId = providedDoctorId as string | undefined;
    if (!doctorId) {
      const doctor = await db.raw.doctor.findFirst({ where: { userId: session.user.id } });
      if (doctor) doctorId = doctor.id;
    }

    if (!doctorId) return NextResponse.json({ error: 'Doctor ID could not be resolved' }, { status: 400 });

    // Create prescription within a transaction so RLS is set, then generate PDF
    const created = await runWithSessionClinic(async (tx: any) => {
      return tx.prescription.create({
        data: {
          clinicId,
          consultationId,
          patientId,
          doctorId,
          medications: JSON.stringify(medications),
          instructions: instructions ?? null,
          pdfUrl: null,
        },
      });
    });

    // Generate the PDF after record creation (do not hold the DB transaction open)
    try {
      const doc = new jsPDF();
      const title = `Prescription - ${created.id}`;
      doc.setFontSize(14);
      doc.text(title, 10, 20);

      doc.setFontSize(11);
      doc.text(`Patient ID: ${patientId}`, 10, 32);
      doc.text(`Consultation ID: ${consultationId}`, 10, 40);

      let y = 54;
      medications.forEach((m, idx) => {
        const line = `${idx + 1}. ${m.name}${m.dosage ? ' - ' + m.dosage : ''}${m.frequency ? ' - ' + m.frequency : ''}${m.duration ? ' - ' + m.duration : ''}`;
        doc.text(line, 10, y);
        y += 8;
        if (m.notes) {
          doc.text(`   Notes: ${m.notes}`, 10, y);
          y += 8;
        }
      });

      if (instructions) {
        doc.text('Doctor notes:', 10, y + 4);
        doc.text(String(instructions), 10, y + 12);
      }

      const arrayBuffer = doc.output('arraybuffer');
      const filename = `prescriptions/prescription-${Date.now()}-${Math.floor(Math.random() * 10000)}.pdf`;
      const { key } = await uploadBuffer(filename, Buffer.from(arrayBuffer), 'application/pdf');

      // Save the storage key in the prescription record, and return a download URL on reads
      await runWithSessionClinic(async (tx: any) => {
        await tx.prescription.update({ where: { id: created.id }, data: { pdfUrl: key } });
      });

      created.pdfUrl = key;
    } catch (pdfErr) {
      console.error('Failed to generate prescription PDF', pdfErr);
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create prescription', error);
    return NextResponse.json({ error: 'Failed to create prescription' }, { status: 500 });
  }
}
