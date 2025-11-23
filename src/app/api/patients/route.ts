import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireAuth, runWithSessionClinic } from '@/lib/auth-utils';
import { prismaScoped } from '@/lib/prisma-scoped';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const clinicId = session.user.clinicId as string;

    const db = prismaScoped(clinicId);

    const patients = await db.patient.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['ADMIN', 'RECEPTIONIST']);
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const body = await req.json();

    const PatientCreateSchema = z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      password: z.string().min(6).optional(),
      dateOfBirth: z.string().optional(),
      gender: z.string().optional(),
      bloodType: z.string().optional(),
      address: z.string().optional(),
      emergencyContact: z.string().optional(),
      allergies: z.string().optional(),
      chronicConditions: z.string().optional(),
    });

    const parsed = PatientCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;

    // Check existing user
    const existingUser = await db.raw.user.findUnique({ where: { email: data.email } });
    if (existingUser) return NextResponse.json({ error: 'Email already registered' }, { status: 400 });

    const hashedPassword = await bcrypt.hash(data.password || 'defaultPassword123', 10);

    const result = await runWithSessionClinic(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: Role.PATIENT,
          clinicId,
          isActive: true,
          emailVerified: true,
        },
      });

      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          clinicId,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          gender: data.gender ? (data.gender as any) : undefined,
          bloodType: data.bloodType,
          address: data.address,
          emergencyContact: data.emergencyContact,
          allergies: data.allergies,
          chronicConditions: data.chronicConditions,
        },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
      });

      return patient;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
