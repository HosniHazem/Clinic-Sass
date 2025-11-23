import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password, phone, clinicName } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !clinicName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create clinic and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create clinic
      const clinic = await tx.clinic.create({
        data: {
          name: clinicName,
          email: email,
          phone: phone,
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: Role.ADMIN,
          clinicId: clinic.id,
          isActive: true,
          emailVerified: true,
        },
      });

      return { clinic, user };
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        userId: result.user.id,
        clinicId: result.clinic.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
