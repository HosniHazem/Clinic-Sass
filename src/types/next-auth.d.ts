import 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    role: Role;
    clinicId: string;
    clinicName?: string;
    patientId?: string;
    doctorId?: string;
  }

  interface Session {
    user: User & {
      id: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role;
    clinicId: string;
    clinicName: string;
    patientId?: string;
    doctorId?: string;
  }
}
