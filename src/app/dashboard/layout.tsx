'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Home,
  DollarSign,
  Stethoscope,
  UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { name: 'Patients', href: '/dashboard/patients', icon: Users, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { name: 'Appointments Patient', href: '/portal/appointments', icon: Calendar, roles: ['PATIENT'] },
    { name: 'Consultations', href: '/dashboard/consultations', icon: Stethoscope, roles: ['DOCTOR'] },
    { name: 'Billing', href: '/dashboard/billing', icon: DollarSign, roles: ['ADMIN', 'RECEPTIONIST'] },
    { name: 'Services', href: '/dashboard/services', icon: FileText, roles: ['ADMIN'] },
    { name: 'Staff', href: '/dashboard/staff', icon: UserCircle, roles: ['ADMIN'] },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['ADMIN'] },
  ];

  const filteredNav = navigationItems.filter(item => 
    item.roles.includes(session.user.role)
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">MedFlow</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            {session.user.clinicName}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {filteredNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              {session.user.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{session.user.role}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
