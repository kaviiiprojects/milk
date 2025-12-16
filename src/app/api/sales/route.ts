export const runtime = 'nodejs';


import { NextResponse, type NextRequest } from 'next/server';
import { addSale, getSales } from '@/lib/firestoreService';
import type { Sale, CartItem, ChequeInfo, BankTransferInfo } from '@/lib/types'; 

// GET /api/sales - Fetch all sales
export async function GET(request: NextRequest) {
  try {
    const result = await getSales();
    return NextResponse.json(result.sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch sales', details: errorMessage }, { status: 500 });
  }
}

// POST /api/sales - Add a new sale and update stock
export async function POST(request: NextRequest) {
  try {
    const saleDataFromClient = await request.json();

    // --- Start Aggressive Validation ---
    if (!saleDataFromClient || !Array.isArray(saleDataFromClient.items) || saleDataFromClient.items.length === 0) {
      return NextResponse.json({ error: 'Invalid sale data: Items are missing or empty.' }, { status: 400 });
    }
    
    const requiredNumericFields = ['subTotal', 'discountAmount', 'totalAmount', 'totalAmountPaid', 'outstandingBalance'];
    for (const field of requiredNumericFields) {
      if (typeof saleDataFromClient[field] !== 'number') {
        return NextResponse.json({ error: `Invalid sale data: Field '${field}' is missing or not a number.` }, { status: 400 });
      }
    }

    if (typeof saleDataFromClient.paymentSummary !== 'string') {
      return NextResponse.json({ error: 'Invalid sale data: Missing payment summary string.' }, { status: 400 });
    }
    // --- End Validation ---

    const saleDate = saleDataFromClient.saleDate ? new Date(saleDataFromClient.saleDate) : new Date();
    
    // --- Start Definitive Defensive Payload Construction ---
    const payload: Omit<Sale, 'id'> = {
      // These are now guaranteed to be present and of the correct type by validation above
      items: saleDataFromClient.items,
      subTotal: saleDataFromClient.subTotal,
      discountAmount: saleDataFromClient.discountAmount,
      totalAmount: saleDataFromClient.totalAmount,
      totalAmountPaid: saleDataFromClient.totalAmountPaid,
      outstandingBalance: saleDataFromClient.outstandingBalance,
      paymentSummary: saleDataFromClient.paymentSummary,
      
      // These have safe defaults
      saleDate: saleDate,
      staffId: saleDataFromClient.staffId || "staff001",
      offerApplied: saleDataFromClient.offerApplied || false,
      discountPercentage: saleDataFromClient.discountPercentage || 0,

      // Handle optional fields safely to prevent 'undefined'
      customerId: saleDataFromClient.customerId || undefined,
      customerName: saleDataFromClient.customerName || undefined,
      customerShopName: saleDataFromClient.customerShopName || undefined,
      staffName: saleDataFromClient.staffName || undefined,
      vehicleId: saleDataFromClient.vehicleId || undefined,
      paidAmountCash: saleDataFromClient.paidAmountCash || undefined,
      paidAmountCheque: saleDataFromClient.paidAmountCheque || undefined,
      paidAmountBankTransfer: saleDataFromClient.paidAmountBankTransfer || undefined,
      creditUsed: saleDataFromClient.creditUsed || undefined,
      changeGiven: saleDataFromClient.changeGiven || undefined,
    };
    
    if (payload.outstandingBalance > 0) {
      payload.initialOutstandingBalance = payload.outstandingBalance;
    }

    if (saleDataFromClient.chequeDetails) {
      const details: ChequeInfo = {};
      if (saleDataFromClient.chequeDetails.number) details.number = saleDataFromClient.chequeDetails.number;
      if (saleDataFromClient.chequeDetails.bank) details.bank = saleDataFromClient.chequeDetails.bank;
      if (saleDataFromClient.chequeDetails.date) details.date = new Date(saleDataFromClient.chequeDetails.date);
      if (saleDataFromClient.chequeDetails.amount !== undefined) details.amount = saleDataFromClient.chequeDetails.amount;
      if (Object.keys(details).length > 0) payload.chequeDetails = details;
    }

    if (saleDataFromClient.bankTransferDetails) {
      const details: BankTransferInfo = {};
      if (saleDataFromClient.bankTransferDetails.bankName) details.bankName = saleDataFromClient.bankTransferDetails.bankName;
      if (saleDataFromClient.bankTransferDetails.referenceNumber) details.referenceNumber = saleDataFromClient.bankTransferDetails.referenceNumber;
      if (saleDataFromClient.bankTransferDetails.amount !== undefined) details.amount = saleDataFromClient.bankTransferDetails.amount;
      if (Object.keys(details).length > 0) payload.bankTransferDetails = details;
    }
    // --- End Defensive Payload Construction ---

    const saleId = await addSale(payload);
    
    return NextResponse.json({ id: saleId, ...payload, saleDate: saleDate.toISOString() }, { status: 201 });

  } catch (error) {
    console.error('Error processing sale:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if (errorMessage.includes("not found for stock update")) {
        return NextResponse.json({ error: 'Failed to process sale: Product not found for stock update.', details: errorMessage }, { status: 404 });
    }
    if (errorMessage.includes("Insufficient stock")) {
        return NextResponse.json({ error: 'Failed to process sale: Insufficient stock for one or more items.', details: errorMessage }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to process sale', details: errorMessage }, { status: 500 });
  }
}
