export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { type Customer } from '@/lib/types';

export const revalidate = 60; // Re-add server-side caching for 60 seconds

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('q');
  const searchLimit = 10;

  if (!searchTerm || searchTerm.length < 2) {
    return NextResponse.json({ error: 'A search term of at least 2 characters is required' }, { status: 400 });
  }

  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  const isNumeric = /^\d+$/.test(searchTerm);
  
  try {
    let results: Customer[] = [];
    if (isNumeric) {
      const rows = await prisma.customer.findMany({
        where: { phone: { contains: lowerCaseSearchTerm, mode: 'insensitive' }, status: { not: 'pending' as any } },
        take: searchLimit,
      });
      results = rows.map(c => ({
        id: c.id,
        avatar: c.avatar || undefined,
        name: c.name,
        phone: c.phone,
        address: c.address || undefined,
        shopName: c.shopName || undefined,
        status: c.status as Customer['status'],
        createdAt: c.createdAt || undefined,
        updatedAt: c.updatedAt || undefined,
        name_lowercase: c.name_lowercase || undefined,
        shopName_lowercase: c.shopName_lowercase || undefined,
      }));
    } else {
      const rows = await prisma.customer.findMany({
        where: {
          status: { not: 'pending' as any },
          OR: [
            { name_lowercase: { startsWith: lowerCaseSearchTerm } },
            { shopName_lowercase: { startsWith: lowerCaseSearchTerm } },
          ],
        },
        take: searchLimit,
      });
      results = rows.map(c => ({
        id: c.id,
        avatar: c.avatar || undefined,
        name: c.name,
        phone: c.phone,
        address: c.address || undefined,
        shopName: c.shopName || undefined,
        status: c.status as Customer['status'],
        createdAt: c.createdAt || undefined,
        updatedAt: c.updatedAt || undefined,
        name_lowercase: c.name_lowercase || undefined,
        shopName_lowercase: c.shopName_lowercase || undefined,
      }));
    }
    
    return NextResponse.json(results);

  } catch (error) {
    console.error('Error searching customers:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to search for customers', details: errorMessage }, { status: 500 });
  }
}
