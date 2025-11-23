import { format } from 'date-fns';
import Link from 'next/link';
import { prismaScoped } from '@/lib/prisma-scoped';
import { getSessionServer } from '@/lib/auth-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ActionsClient from '@/app/dashboard/appointments/ActionsClient';

export default async function AppointmentPage({ params }: { params: { id: string } }) {
  const session = await getSessionServer();
  if (!session?.user) return (
    <div className="p-6">Unauthorized</div>
  );

  const clinicId = session.user.clinicId as string;
  const db = prismaScoped(clinicId);

  const appt = await db.appointment.findMany({ where: { id: params.id }, include: { patient: { include: { user: true } }, doctor: { include: { user: true } }, service: true } });
  const appointment: any = appt?.[0];
  if (!appointment) return <div className="p-6">Appointment not found</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointment Details</h1>
          <p className="text-muted-foreground">Details for appointment #{appointment.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <ActionsClient appointment={appointment} />
          <Link href="/dashboard/appointments">
            <button className="btn btn-ghost">Back</button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
            <CardDescription>Patient & doctor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Patient:</strong> {appointment.patient.user.firstName} {appointment.patient.user.lastName}</div>
              <div><strong>Doctor:</strong> Dr. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}</div>
              {appointment.service && <div><strong>Service:</strong> {appointment.service.name}</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>Date and time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Date:</strong> {format(new Date(appointment.appointmentDate), 'PPP')}</div>
              <div><strong>Start:</strong> {appointment.startTime}</div>
              <div><strong>End:</strong> {appointment.endTime}</div>
              <div><strong>Status:</strong> {appointment.status}</div>
              {appointment.notes && <div><strong>Notes:</strong> {appointment.notes}</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
