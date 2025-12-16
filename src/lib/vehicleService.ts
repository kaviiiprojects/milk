import 'server-only';
import prisma from "./prisma";
import { Vehicle } from "./types";

export const VehicleService = {
  async getAllVehicles(): Promise<Vehicle[]> {
    const vehicles = await prisma.vehicle.findMany();
    return vehicles.map(v => ({
      id: v.id,
      vehicleNumber: v.vehicleNumber,
      driverName: v.driverName || undefined,
      notes: v.notes || undefined,
      createdAt: v.createdAt || undefined,
      updatedAt: v.updatedAt || undefined,
    }));
  },

  async getVehicleById(id: string): Promise<Vehicle | null> {
    const v = await prisma.vehicle.findUnique({ where: { id } });
    return v
      ? {
          id: v.id,
          vehicleNumber: v.vehicleNumber,
          driverName: v.driverName || undefined,
          notes: v.notes || undefined,
          createdAt: v.createdAt || undefined,
          updatedAt: v.updatedAt || undefined,
        }
      : null;
  },

  async createVehicle(vehicleData: Omit<Vehicle, 'id'>): Promise<string> {
    const created = await prisma.vehicle.create({
      data: {
        vehicleNumber: vehicleData.vehicleNumber,
        driverName: vehicleData.driverName ?? null,
        notes: vehicleData.notes ?? null,
      },
      select: { id: true },
    });
    return created.id;
  },

  async updateVehicle(id: string, vehicleData: Partial<Omit<Vehicle, 'id'>>): Promise<void> {
    await prisma.vehicle.update({
      where: { id },
      data: {
        vehicleNumber: vehicleData.vehicleNumber,
        driverName: vehicleData.driverName,
        notes: vehicleData.notes,
      },
    });
  },

  async deleteVehicle(id: string): Promise<void> {
    await prisma.vehicle.delete({ where: { id } });
  },
};
