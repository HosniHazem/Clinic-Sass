import { getSessionServer } from '@/lib/auth-utils';
import { prismaScoped } from '@/lib/prisma-scoped';
import { getDownloadUrl } from '@/lib/storage';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function PortalPrescriptionsPage() {
  const session = await getSessionServer();
  if (!session?.user) return <div className="p-6">Unauthorized</div>;

  const clinicId = session.user.clinicId as string;
  const db = prismaScoped(clinicId);

  // Find patient record for the logged-in user
  const patients = await db.patient.findMany({ where: { userId: session.user.id } });
  const patient = patients?.[0];
  if (!patient) return <div className="p-6">No patient record found</div>;

  // Fetch prescriptions for this patient (use raw prisma via scoped helper)
  const prescriptions = await db.raw.prescription.findMany({ where: { patientId: patient.id }, include: { doctor: { include: { user: true } } }, orderBy: { createdAt: 'desc' } });

  // Convert storage keys to download URLs where applicable
  const converted = await Promise.all(
    prescriptions.map(async (p: any) => {
      if (p.pdfUrl) {
        try { p.pdfUrl = await getDownloadUrl(p.pdfUrl); } catch (err) { console.warn('Failed to get pdf url', err); }
      }
      return p;
    })
  );

  return (
    <div className="space-y-6 max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Prescriptions</h1>
          <p className="text-muted-foreground">View and download your prescriptions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {converted.length === 0 && <div className="p-4 text-muted-foreground">No prescriptions found</div>}
        {converted.map((p: any) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>Prescription • {new Date(p.createdAt).toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Doctor: {p.doctor?.user?.firstName ? `${p.doctor.user.firstName} ${p.doctor.user.lastName}` : p.doctorName || '—'}</div>
                  <div className="text-sm text-muted-foreground">Consultation: {p.consultationId}</div>
                </div>
                <div className="flex items-center gap-2">
                  {p.pdfUrl ? (
                    <a className="inline-flex items-center rounded-md border px-3 py-1 text-sm" href={p.pdfUrl} target="_blank" rel="noreferrer">Download PDF</a>
                  ) : (
                    <div className="text-sm text-muted-foreground">PDF not available</div>
                  )}
                  <Link href={`/portal/prescriptions/${p.id}`}>
                    <button className="inline-flex items-center rounded-md border px-3 py-1 text-sm">View</button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
