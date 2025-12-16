
export const runtime = 'nodejs';
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

async function calculateAvailableCredit(customerId: string): Promise<number> {
  const [returnsAgg, salesAgg] = await Promise.all([
    prisma.returnTransaction.aggregate({
      _sum: { refundAmount: true },
      where: { customerId },
    }),
    prisma.sale.aggregate({
      _sum: { creditUsed: true },
      where: { customerId },
    }),
  ]);

  const totalRefundsNet = Number(returnsAgg._sum.refundAmount ?? 0);
  const totalCreditUsedOnSales = Number(salesAgg._sum.creditUsed ?? 0);
  return totalRefundsNet - totalCreditUsedOnSales;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('id');

  if (!customerId) {
    return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
  }

  try {
    const availableCredit = await calculateAvailableCredit(customerId);
    return NextResponse.json({ customerId, availableCredit });
  } catch (error) {
    console.error(`Error calculating credit for customer ${customerId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to calculate available credit', details: errorMessage }, { status: 500 });
  }
}
