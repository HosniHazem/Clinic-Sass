import { PrismaClient, Role, Gender, ServiceCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo clinic
  const clinic = await prisma.clinic.create({
    data: {
      name: 'MedFlow Demo Clinic',
      address: '123 Medical Street, Health City, HC 12345',
      phone: '+1234567890',
      email: 'contact@medflowdemo.com',
      description: 'A full-service medical clinic providing comprehensive healthcare.',
      settings: {
        workingHours: {
          monday: { start: '08:00', end: '18:00' },
          tuesday: { start: '08:00', end: '18:00' },
          wednesday: { start: '08:00', end: '18:00' },
          thursday: { start: '08:00', end: '18:00' },
          friday: { start: '08:00', end: '18:00' },
          saturday: { start: '09:00', end: '14:00' },
          sunday: { closed: true }
        }
      }
    }
  });

  console.log('✅ Created clinic:', clinic.name);

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@medflow.com',
      password: hashedPassword,
      role: Role.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      isActive: true,
      emailVerified: true,
      clinicId: clinic.id
    }
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create Doctor Users
  const doctor1User = await prisma.user.create({
    data: {
      email: 'dr.smith@medflow.com',
      password: hashedPassword,
      role: Role.DOCTOR,
      firstName: 'John',
      lastName: 'Smith',
      phone: '+1234567891',
      isActive: true,
      emailVerified: true,
      clinicId: clinic.id
    }
  });

  const doctor1 = await prisma.doctor.create({
    data: {
      userId: doctor1User.id,
      clinicId: clinic.id,
      specialization: 'General Practitioner',
      licenseNumber: 'MD123456',
      consultationFee: 100,
      biography: 'Experienced GP with 15 years of practice',
      availability: {
        monday: [{ start: '09:00', end: '17:00' }],
        tuesday: [{ start: '09:00', end: '17:00' }],
        wednesday: [{ start: '09:00', end: '17:00' }],
        thursday: [{ start: '09:00', end: '17:00' }],
        friday: [{ start: '09:00', end: '17:00' }]
      }
    }
  });

  console.log('✅ Created doctor:', doctor1User.email);

  const doctor2User = await prisma.user.create({
    data: {
      email: 'dr.johnson@medflow.com',
      password: hashedPassword,
      role: Role.DOCTOR,
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1234567892',
      isActive: true,
      emailVerified: true,
      clinicId: clinic.id
    }
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      userId: doctor2User.id,
      clinicId: clinic.id,
      specialization: 'Cardiologist',
      licenseNumber: 'MD789012',
      consultationFee: 150,
      biography: 'Specialized in cardiovascular diseases',
      availability: {
        monday: [{ start: '10:00', end: '18:00' }],
        wednesday: [{ start: '10:00', end: '18:00' }],
        friday: [{ start: '10:00', end: '18:00' }]
      }
    }
  });

  console.log('✅ Created doctor:', doctor2User.email);

  // Create Receptionist User
  const receptionistUser = await prisma.user.create({
    data: {
      email: 'receptionist@medflow.com',
      password: hashedPassword,
      role: Role.RECEPTIONIST,
      firstName: 'Emily',
      lastName: 'Brown',
      phone: '+1234567893',
      isActive: true,
      emailVerified: true,
      clinicId: clinic.id
    }
  });

  console.log('✅ Created receptionist:', receptionistUser.email);

  // Create Patient Users
  const patient1User = await prisma.user.create({
    data: {
      email: 'patient1@example.com',
      password: hashedPassword,
      role: Role.PATIENT,
      firstName: 'Michael',
      lastName: 'Davis',
      phone: '+1234567894',
      isActive: true,
      emailVerified: true,
      clinicId: clinic.id
    }
  });

  const patient1 = await prisma.patient.create({
    data: {
      userId: patient1User.id,
      clinicId: clinic.id,
      dateOfBirth: new Date('1985-05-15'),
      gender: Gender.MALE,
      bloodType: 'A+',
      address: '456 Patient Avenue, Health City',
      emergencyContact: 'Jane Davis: +1234567895',
      allergies: 'Penicillin',
      chronicConditions: 'None',
      medicalHistory: {
        previousSurgeries: [],
        familyHistory: 'Diabetes in family'
      }
    }
  });

  console.log('✅ Created patient:', patient1User.email);

  const patient2User = await prisma.user.create({
    data: {
      email: 'patient2@example.com',
      password: hashedPassword,
      role: Role.PATIENT,
      firstName: 'Lisa',
      lastName: 'Wilson',
      phone: '+1234567896',
      isActive: true,
      emailVerified: true,
      clinicId: clinic.id
    }
  });

  const patient2 = await prisma.patient.create({
    data: {
      userId: patient2User.id,
      clinicId: clinic.id,
      dateOfBirth: new Date('1992-08-22'),
      gender: Gender.FEMALE,
      bloodType: 'O+',
      address: '789 Health Boulevard, Health City',
      emergencyContact: 'Robert Wilson: +1234567897',
      allergies: 'None',
      chronicConditions: 'Asthma',
      medicalHistory: {
        previousSurgeries: ['Appendectomy 2015'],
        familyHistory: 'Heart disease in family'
      }
    }
  });

  console.log('✅ Created patient:', patient2User.email);

  // Create Services
  const services = [
    {
      name: 'General Consultation',
      description: 'Standard consultation with a general practitioner',
      price: 100,
      duration: 30,
      category: ServiceCategory.CONSULTATION
    },
    {
      name: 'Cardiology Consultation',
      description: 'Specialized cardiovascular consultation',
      price: 150,
      duration: 45,
      category: ServiceCategory.CONSULTATION
    },
    {
      name: 'Blood Test',
      description: 'Complete blood count and analysis',
      price: 50,
      duration: 15,
      category: ServiceCategory.DIAGNOSTIC
    },
    {
      name: 'ECG',
      description: 'Electrocardiogram test',
      price: 75,
      duration: 20,
      category: ServiceCategory.DIAGNOSTIC
    },
    {
      name: 'Physical Therapy Session',
      description: 'One hour physical therapy session',
      price: 80,
      duration: 60,
      category: ServiceCategory.THERAPY
    },
    {
      name: 'Minor Surgery',
      description: 'Minor surgical procedures',
      price: 500,
      duration: 120,
      category: ServiceCategory.SURGERY
    }
  ];

  for (const service of services) {
    await prisma.service.create({
      data: {
        ...service,
        clinicId: clinic.id,
        isActive: true
      }
    });
  }

  console.log('✅ Created services');

  console.log('🎉 Seeding completed!');
  console.log('\n📋 Test Credentials:');
  console.log('Admin: admin@medflow.com / password123');
  console.log('Doctor 1: dr.smith@medflow.com / password123');
  console.log('Doctor 2: dr.johnson@medflow.com / password123');
  console.log('Receptionist: receptionist@medflow.com / password123');
  console.log('Patient 1: patient1@example.com / password123');
  console.log('Patient 2: patient2@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
