export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { 
  VehicleService
} from '@/lib/vehicleService';
import type { Vehicle } from '@/lib/types';

// GET /api/vehicles - Fetch all vehicles
// GET /api/vehicles?id=<vehicleId> - Fetch a single vehicle
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('id');

  try {
    if (vehicleId) {
      const vehicle = await VehicleService.getVehicleById(vehicleId);
      if (vehicle) {
        return NextResponse.json(vehicle);
      } else {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }
    } else {
      const vehicles = await VehicleService.getAllVehicles();
      return NextResponse.json(vehicles);
    }
  } catch (error) {
    console.error('Error fetching vehicle(s):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch vehicle(s)', details: errorMessage }, { status: 500 });
  }
}

// POST /api/vehicles - Add a new vehicle
export async function POST(request: NextRequest) {
  try {
    const vehicleData = (await request.json()) as Omit<Vehicle, 'id'>;
    
    if (!vehicleData || !vehicleData.vehicleNumber) {
      return NextResponse.json({ error: 'Missing required field: vehicleNumber' }, { status: 400 });
    }

    const vehicleId = await VehicleService.createVehicle(vehicleData);
    const newVehicle = await VehicleService.getVehicleById(vehicleId); // Fetch the created vehicle to return
    return NextResponse.json(newVehicle, { status: 201 });
  } catch (error) {
    console.error('Error adding vehicle:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to add vehicle', details: errorMessage }, { status: 500 });
  }
}

// PUT /api/vehicles?id=<vehicleId> - Update an existing vehicle
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('id');

  if (!vehicleId) {
    return NextResponse.json({ error: 'Vehicle ID is required for updating' }, { status: 400 });
  }

  try {
    const vehicleUpdateData = (await request.json()) as Partial<Omit<Vehicle, 'id'>>;
    
    if (vehicleUpdateData.vehicleNumber === '') {
       return NextResponse.json({ error: 'Vehicle Number cannot be empty.' }, { status: 400 });
    }

    await VehicleService.updateVehicle(vehicleId, vehicleUpdateData);
    return NextResponse.json({ message: 'Vehicle updated successfully' });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to update vehicle', details: errorMessage }, { status: 500 });
  }
}

// DELETE /api/vehicles?id=<vehicleId> - Delete a vehicle
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('id');

  if (!vehicleId) {
    return NextResponse.json({ error: 'Vehicle ID is required for deletion' }, { status: 400 });
  }

  try {
    await VehicleService.deleteVehicle(vehicleId);
    return NextResponse.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to delete vehicle', details: errorMessage }, { status: 500 });
  }
}
