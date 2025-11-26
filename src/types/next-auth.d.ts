import 'next-auth';
import { Role } from '@prisma/client';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: Role;
    clinicId: string;
    clinicName?: string;
    patientId?: string;
    doctorId?: string;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
      clinicId: string;
      clinicName?: string;
      patientId?: string;
      doctorId?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role;
    clinicId: string;
    clinicName?: string;
    patientId?: string;
    doctorId?: string;
  }
}