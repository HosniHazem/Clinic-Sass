import Link from 'next/link';
import { getSessionServer } from '@/lib/auth-utils';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export default async function PortalIndexPage() {
  const session = await getSessionServer();
  if (!session?.user) return <div className="p-6">Unauthorized</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patient Portal</h1>
          <p className="text-muted-foreground">Welcome back, {session.user.name || session.user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>View or book appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/portal/appointments" className="text-primary underline">Go to Appointments</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prescriptions</CardTitle>
            <CardDescription>View your prescriptions and download PDFs</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/portal/prescriptions" className="text-primary underline">View Prescriptions</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>View and update your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/portal/profile" className="text-primary underline">Your Profile</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
