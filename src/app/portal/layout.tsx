"use client";

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Home, Calendar, FileText, UserCircle, LogOut, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
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

  if (!session) return null;

  const navigation = [
    { name: 'Portal Home', href: '/portal', icon: Home },
    { name: 'Appointments', href: '/portal/appointments', icon: Calendar },
    { name: 'Invoices', href: '/portal/invoices', icon: DollarSign },
    { name: 'Prescriptions', href: '/portal/prescriptions', icon: FileText },
    { name: 'Profile', href: '/portal/profile', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/portal" className="flex items-center gap-3">
            <Home className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Patient Portal</span>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden sm:flex items-center gap-3">
              {navigation.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm text-muted-foreground hover:text-foreground">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                {session.user.name?.charAt(0) || session.user.email?.charAt(0)}</div>
              <div className="hidden sm:block text-sm text-muted-foreground">{session.user.name || session.user.email}</div>
              <Button variant="outline" onClick={() => signOut({ callbackUrl: '/auth/login' })}>
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">{children}</main>
    </div>
  );
}
