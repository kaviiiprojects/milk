export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { type Product } from '@/lib/types';

export const revalidate = 300; // cache for 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('q')?.toLowerCase();
  const category = searchParams.get('category');
  const ids = searchParams.get('ids')?.split(',');
  const searchLimit = 50;

  try {
    let results: Product[] = [];
    if (ids && ids.length > 0) {
      const rows = await prisma.product.findMany({ where: { id: { in: ids.slice(0, 30) } } });
      results = rows.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category as Product['category'],
        price: Number(p.price),
        wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : undefined,
        stock: p.stock,
        imageUrl: p.imageUrl || undefined,
        description: p.description || undefined,
        sku: p.sku || undefined,
        reorderLevel: p.reorderLevel || undefined,
        aiHint: p.aiHint || undefined,
        createdAt: p.createdAt || undefined,
        updatedAt: p.updatedAt || undefined,
      }));
    } else {
      const where: any = {};
      if (category) where.category = category as any;
      if (searchTerm) {
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { sku: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
      const rows = await prisma.product.findMany({ where, take: searchLimit });
      results = rows.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category as Product['category'],
        price: Number(p.price),
        wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : undefined,
        stock: p.stock,
        imageUrl: p.imageUrl || undefined,
        description: p.description || undefined,
        sku: p.sku || undefined,
        reorderLevel: p.reorderLevel || undefined,
        aiHint: p.aiHint || undefined,
        createdAt: p.createdAt || undefined,
        updatedAt: p.updatedAt || undefined,
      }));
    }
    
    return NextResponse.json(results);

  } catch (error) {
    console.error('Error searching products:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to search for products', details: errorMessage }, { status: 500 });
  }
}
