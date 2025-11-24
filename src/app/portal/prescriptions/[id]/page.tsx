import { getSessionServer } from '@/lib/auth-utils';
import { prismaScoped } from '@/lib/prisma-scoped';
import { getDownloadUrl } from '@/lib/storage';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function PortalPrescriptionDetail({ params }: { params: { id: string } }) {
  const session = await getSessionServer();
  if (!session?.user) return <div className="p-6">Unauthorized</div>;

  const clinicId = session.user.clinicId as string;
  const db = prismaScoped(clinicId);

  const patients = await db.patient.findMany({ where: { userId: session.user.id } });
  const patient = patients?.[0];
  if (!patient) return <div className="p-6">No patient record found</div>;

  const pres = await db.raw.prescription.findFirst({ where: { id: params.id, patientId: patient.id }, include: { doctor: { include: { user: true } } } });
  if (!pres) return <div className="p-6">Prescription not found</div>;

  let pdfUrl = pres.pdfUrl;
  if (pdfUrl) {
    try { pdfUrl = await getDownloadUrl(pdfUrl); } catch (err) { console.warn('failed to get pdf url', err); }
  }

  let meds = [];
  try { meds = pres.medications ? JSON.parse(String(pres.medications)) : []; } catch (e) { meds = []; }

  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Prescription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-sm text-muted-foreground">Date: {new Date(pres.createdAt).toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Doctor: {pres.doctor?.user?.firstName ? `${pres.doctor.user.firstName} ${pres.doctor.user.lastName}` : '—'}</div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold">Medications</h4>
            <ul className="list-disc pl-6 mt-2">
              {meds.length ? meds.map((m: any, i: number) => (
                <li key={i} className="mb-2">
                  <div className="font-medium">{m.name}{m.dosage ? ` — ${m.dosage}` : ''}</div>
                  <div className="text-sm text-muted-foreground">{m.frequency || ''}{m.duration ? ` • ${m.duration}` : ''}</div>
                  {m.notes ? <div className="text-sm mt-1">{m.notes}</div> : null}
                </li>
              )) : <li>No medications listed</li>}
            </ul>
          </div>

          {pres.instructions ? (
            <div className="mb-4">
              <h4 className="font-semibold">Instructions</h4>
              <div className="whitespace-pre-wrap mt-2">{pres.instructions}</div>
            </div>
          ) : null}

          {pdfUrl ? (
            <div className="mb-4">
              <a className="text-primary underline" href={pdfUrl} target="_blank" rel="noreferrer">Download PDF</a>
            </div>
          ) : null}

          <div className="flex gap-2 justify-end">
            <Link href="/portal">
              <button className="inline-flex items-center rounded-md border px-3 py-1 text-sm">Back</button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
