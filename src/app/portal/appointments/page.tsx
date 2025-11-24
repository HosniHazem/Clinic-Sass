import Link from 'next/link';
import { format } from 'date-fns';
import { getSessionServer } from '@/lib/auth-utils';
import { prismaScoped } from '@/lib/prisma-scoped';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function PortalAppointmentsPage() {
  const session = await getSessionServer();
  if (!session?.user) return <div className="p-6">Unauthorized</div>;

  const clinicId = session.user.clinicId as string;
  const db = prismaScoped(clinicId);

  const patients = await db.patient.findMany({ where: { userId: session.user.id } });
  const patient = patients?.[0];
  if (!patient) return <div className="p-6">No patient record found for your account</div>;

  const appointments = await db.appointment.findMany({
    where: { patientId: patient.id },
    include: { doctor: { include: { user: true } }, service: true },
    orderBy: { appointmentDate: 'desc' },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Appointments</h1>
          <p className="text-muted-foreground">Manage and view your upcoming and past appointments</p>
        </div>
        <div>
          <Link href="/portal/appointments/new">
            <button className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium">Book New</button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {appointments.length === 0 && <div className="p-4 text-muted-foreground">No appointments found</div>}
        {appointments.map((a: any) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle>{format(new Date(a.appointmentDate), 'PPP')}</CardTitle>
              <p className="text-sm text-muted-foreground">{a.startTime} — {a.endTime}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div><strong>Doctor:</strong> Dr. {a.doctor?.user?.firstName} {a.doctor?.user?.lastName}</div>
                  {a.service && <div><strong>Service:</strong> {a.service.name}</div>}
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Status: {a.status}</div>
                  <div className="mt-2">
                    <Link href={`/portal/appointments/${a.id}`}>
                      <button className="inline-flex items-center rounded-md border px-3 py-1 text-sm">View</button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
