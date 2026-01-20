export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import {
  getCustomers,
  getCustomer,
  addCustomer,
  updateCustomer,
  deleteCustomer
} from '@/lib/firestoreService'; // Assuming these functions will be in firestoreService
import type { Customer, FirestoreCustomer } from '@/lib/types';

// GET /api/customers - Fetch all customers
// GET /api/customers?id=<customerId> - Fetch a single customer
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('id');

  try {
    if (customerId) {
      const customer = await getCustomer(customerId);
      if (customer) {
        return NextResponse.json(customer);
      } else {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
    } else {
      const limitParam = searchParams.get('limit');
      const cursor = searchParams.get('cursor');

      const limit = limitParam ? parseInt(limitParam, 10) : undefined;

      const result = await getCustomers(limit, cursor);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error fetching customer(s):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch customer(s)', details: errorMessage }, { status: 500 });
  }
}

// POST /api/customers - Add a new customer
export async function POST(request: NextRequest) {
  try {
    const customerData = (await request.json()) as Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;

    if (!customerData || !customerData.name || !customerData.phone) {
      return NextResponse.json({ error: 'Missing required customer fields (name, phone)' }, { status: 400 });
    }

    const customerToCreate = {
      ...customerData,
      name_lowercase: customerData.name.toLowerCase(),
      shopName_lowercase: customerData.shopName?.toLowerCase(),
    };

    const customerId = await addCustomer(customerToCreate);
    return NextResponse.json({ id: customerId, ...customerToCreate }, { status: 201 });
  } catch (error) {
    console.error('Error adding customer:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to add customer', details: errorMessage }, { status: 500 });
  }
}

// PUT /api/customers?id=<customerId> - Update an existing customer
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('id');

  if (!customerId) {
    return NextResponse.json({ error: 'Customer ID is required for updating' }, { status: 400 });
  }

  try {
    const customerUpdateData = (await request.json()) as Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>;

    if (customerUpdateData.name === '' || customerUpdateData.phone === '') {
      return NextResponse.json({ error: 'Name and phone cannot be empty if provided for update.' }, { status: 400 });
    }

    const dataToUpdate: Partial<Omit<Customer, 'id'>> = { ...customerUpdateData };
    if (customerUpdateData.name) {
      dataToUpdate.name_lowercase = customerUpdateData.name.toLowerCase();
    }
    if (customerUpdateData.shopName) {
      dataToUpdate.shopName_lowercase = customerUpdateData.shopName.toLowerCase();
    }


    await updateCustomer(customerId, dataToUpdate);
    return NextResponse.json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Error updating customer:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if (errorMessage.includes("Failed to update customer.") || errorMessage.includes("not found")) {
      return NextResponse.json({ error: 'Customer not found or failed to update', details: errorMessage }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update customer', details: errorMessage }, { status: 500 });
  }
}

// DELETE /api/customers?id=<customerId> - Delete a customer
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('id');

  if (!customerId) {
    return NextResponse.json({ error: 'Customer ID is required for deletion' }, { status: 400 });
  }

  try {
    await deleteCustomer(customerId);
    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if (errorMessage.includes("Failed to delete customer.") || errorMessage.includes("not found")) {
      return NextResponse.json({ error: 'Customer not found or failed to delete', details: errorMessage }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete customer', details: errorMessage }, { status: 500 });
  }
}
