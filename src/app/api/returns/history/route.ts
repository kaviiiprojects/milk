export const runtime = 'nodejs';
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { ReturnTransaction, CartItem } from '@/lib/types';

// GET /api/returns/history - Fetch all return transactions
export async function GET(request: NextRequest) {
  try {
    // Fetch all returns without pagination limit for day end report
    const rows = await prisma.returnTransaction.findMany({ 
      include: { items: true },
      orderBy: { returnDate: 'desc' }
    });
    
    const returns: ReturnTransaction[] = rows.map(r => {
      // Separate returned and exchanged items
      const returnedItems: CartItem[] = r.items
        .filter(item => item.lineType === 'returned')
        .map(item => ({
          id: item.productId,
          quantity: item.quantity,
          appliedPrice: Number(item.appliedPrice),
          saleType: item.saleType as any,
          name: item.name,
          category: item.category as any,
          price: Number(item.price),
          sku: item.sku || undefined,
          isOfferItem: item.isOfferItem,
        }));
      
      const exchangedItems: CartItem[] = r.items
        .filter(item => item.lineType === 'exchanged')
        .map(item => ({
          id: item.productId,
          quantity: item.quantity,
          appliedPrice: Number(item.appliedPrice),
          saleType: item.saleType as any,
          name: item.name,
          category: item.category as any,
          price: Number(item.price),
          sku: item.sku || undefined,
          isOfferItem: item.isOfferItem,
        }));
      
      return {
        id: r.id,
        originalSaleId: r.originalSaleId,
        returnDate: r.returnDate,
        staffId: r.staffId,
        customerId: r.customerId || undefined,
        customerName: r.customerName || undefined,
        customerShopName: r.customerShopName || undefined,
        returnedItems,
        exchangedItems,
        notes: r.notes || undefined,
        amountPaid: r.amountPaid ? Number(r.amountPaid) : undefined,
        paymentSummary: r.paymentSummary || undefined,
        chequeDetails: r.chequeNumber ? { number: r.chequeNumber, bank: r.chequeBank || undefined, date: r.chequeDate || undefined, amount: r.chequeAmount ? Number(r.chequeAmount) : undefined } : undefined,
        bankTransferDetails: r.bankName ? { bankName: r.bankName, referenceNumber: r.referenceNumber || undefined, amount: r.bankAmount ? Number(r.bankAmount) : undefined } : undefined,
        changeGiven: r.changeGiven ? Number(r.changeGiven) : undefined,
        settleOutstandingAmount: r.settleOutstandingAmount ? Number(r.settleOutstandingAmount) : undefined,
        refundAmount: r.refundAmount ? Number(r.refundAmount) : undefined,
        cashPaidOut: r.cashPaidOut ? Number(r.cashPaidOut) : undefined,
        createdAt: r.createdAt || undefined,
      };
    });
    
    return NextResponse.json(returns);
  } catch (error) {
    console.error('Error fetching return transactions:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch return transactions', details: errorMessage }, { status: 500 });
  }
}
