import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToasterClient } from '@/components/ui/ToasterClient';
import SessionProviderClient from '@/components/SessionProviderClient';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MedFlow - Medical Clinic Management',
  description: 'Comprehensive SaaS solution for medical clinics and healthcare providers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProviderClient>
          {children}
          <ToasterClient />
        </SessionProviderClient>
      </body>
    </html>
  );
}
