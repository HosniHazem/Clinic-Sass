import { prisma } from './prisma';

/**
 * Returns a small helper object scoped to a clinicId (tenant).
 * Use this to ensure all queries include `clinicId` and to centralize tenant enforcement.
 */
export function prismaScoped(clinicId: string) {
  if (!clinicId) throw new Error('clinicId is required for scoped prisma');

  return {
    patient: {
      findMany: (args: any = {}) => prisma.patient.findMany({ where: { clinicId, ...(args.where || {}) }, ...(args || {}) }),
      findUnique: (args: any) => prisma.patient.findFirst({ where: { clinicId, ...(args.where || {}) }, ...(args || {}) }),
      create: (data: any) => prisma.patient.create({ data: { ...data, clinicId } }),
      update: (args: any) => prisma.patient.update({ where: { id: args.where.id }, data: args.data }),
      delete: (args: any) => prisma.patient.delete({ where: { id: args.where.id } }),
    },
    appointment: {
      findMany: (args: any = {}) => prisma.appointment.findMany({ where: { clinicId, ...(args.where || {}) }, ...(args || {}) }),
      create: (data: any) => prisma.appointment.create({ data: { ...data, clinicId } }),
      update: (args: any) => prisma.appointment.update({ where: { id: args.where.id }, data: args.data }),
    },
    service: {
      findMany: (args: any = {}) => prisma.service.findMany({ where: { clinicId, ...(args.where || {}) }, ...(args || {}) }),
      create: (data: any) => prisma.service.create({ data: { ...data, clinicId } }),
    },
    invoice: {
      findMany: (args: any = {}) => prisma.invoice.findMany({ where: { clinicId, ...(args.where || {}) }, ...(args || {}) }),
      create: (data: any) => prisma.invoice.create({ data: { ...data, clinicId } }),
    },
    // passthrough generic access when needed (use sparingly)
    raw: prisma,
  };
}
