export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';
import type { CartItem, ChequeInfo, BankTransferInfo } from '@/lib/types';

interface ReturnRequestBody {
  saleId: string;
  returnedItems?: (CartItem & { isResellable: boolean })[];
  exchangedItems?: CartItem[];
  staffId: string;
  customerId?: string;
  customerName?: string;
  customerShopName?: string;
  settleOutstandingAmount?: number;
  refundAmount?: number; // Credit added to account
  cashPaidOut?: number; // Cash given to customer
  payment?: {
    amountPaid: number;
    paymentSummary: string;
    changeGiven?: number;
    chequeDetails?: ChequeInfo;
    bankTransferDetails?: BankTransferInfo;
  }
  vehicleId?: string;
}

async function generateCustomReturnId(): Promise<string> {
  const today = new Date();
  const datePart = format(today, "yyMMdd");
  
  // Get the latest return for today or initialize counter
  const latestReturn = await prisma.returnTransaction.findFirst({
    where: {
      id: {
        startsWith: `RET-${datePart}-`
      }
    },
    orderBy: {
      id: 'desc'
    }
  });
  
  let newCount = 1;
  if (latestReturn) {
    const lastIdPart = latestReturn.id.split('-').pop();
    if (lastIdPart) {
      const lastCount = parseInt(lastIdPart, 10);
      if (!isNaN(lastCount)) {
        newCount = lastCount + 1;
      }
    }
  }
  
  return `RET-${datePart}-${String(newCount).padStart(4, '0')}`;
}

// Helper to resolve staffId to a valid user ID
async function resolveStaffId(staffId: string | undefined): Promise<string | null> {
  if (!staffId) return null;
  
  // Try by ID first
  const byId = await prisma.user.findUnique({ where: { id: String(staffId) }, select: { id: true } });
  if (byId) return byId.id;
  
  // Try by username
  const byUsername = await prisma.user.findFirst({ 
    where: { username: { equals: String(staffId), mode: 'insensitive' } }, 
    select: { id: true } 
  });
  if (byUsername) return byUsername.id;
  
  // Fallback to admin
  const admin = await prisma.user.findFirst({ 
    where: { username: { equals: 'admin', mode: 'insensitive' } }, 
    select: { id: true } 
  });
  return admin ? admin.id : null;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReturnRequestBody = await request.json();
    const { 
      saleId, 
      staffId,
      customerId,
      customerName,
      customerShopName,
      settleOutstandingAmount,
      refundAmount,
      cashPaidOut,
      payment,
      vehicleId,
    } = body;
    
    const returnedItems = Array.isArray(body.returnedItems) ? body.returnedItems : [];
    const exchangedItems = Array.isArray(body.exchangedItems) ? body.exchangedItems : [];

    if (!saleId || !staffId) {
      return NextResponse.json({ error: 'Invalid request body. Missing required fields.' }, { status: 400 });
    }
    
    if (returnedItems.length === 0 && exchangedItems.length === 0 && !refundAmount && !cashPaidOut && !settleOutstandingAmount) {
      return NextResponse.json({ error: 'Cannot process an empty transaction with no financial impact.' }, { status: 400 });
    }

    // Resolve staffId
    const staffIdFinal = await resolveStaffId(staffId);
    if (!staffIdFinal) {
      return NextResponse.json({ error: 'Could not resolve staff user' }, { status: 400 });
    }

    const returnId = await generateCustomReturnId();
    
    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. READ ORIGINAL SALE
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true, returns: { include: { items: true } } }
      });
      
      if (!sale) {
        throw new Error(`Sale with ID ${saleId} not found.`);
      }

      // 2. SETTLE OUTSTANDING BALANCE IF APPLICABLE
      if (settleOutstandingAmount && settleOutstandingAmount > 0) {
        if (Number(sale.outstandingBalance) < settleOutstandingAmount) {
          throw new Error(`Cannot settle ${settleOutstandingAmount}. Outstanding balance is only ${sale.outstandingBalance}.`);
        }
        
        // Create a payment record for the credit
        await tx.payment.create({
          data: {
            saleId: saleId,
            amount: settleOutstandingAmount,
            method: 'ReturnCredit' as any,
            date: new Date(),
            notes: `Credit from Return ID: ${returnId}`,
            staffId: staffIdFinal,
          },
        });
        
        // Update sale balances
        await tx.sale.update({
          where: { id: saleId },
          data: {
            outstandingBalance: Number(sale.outstandingBalance) - settleOutstandingAmount,
            totalAmountPaid: Number(sale.totalAmountPaid) + settleOutstandingAmount,
          },
        });
      }

      // 3. HANDLE STOCK & SALE ITEM UPDATES
      // Handle exchanged items (stock out)
      for (const item of exchangedItems) {
        const product = await tx.product.findUnique({ where: { id: item.id } });
        if (!product) {
          throw new Error(`Product with ID ${item.id} not found.`);
        }
        
        if (!vehicleId) {
          // Main inventory exchange - reduce stock
          await tx.product.update({
            where: { id: item.id },
            data: { stock: product.stock - item.quantity }
          });
        } else {
          // Vehicle exchange - create stock transaction
          await tx.stockTransaction.create({
            data: {
              productId: item.id,
              productName: item.name,
              productSku: item.sku || null,
              type: 'UNLOAD_FROM_VEHICLE' as any,
              quantity: item.quantity,
              previousStock: product.stock,
              newStock: product.stock,
              transactionDate: new Date(),
              notes: `Exchange in Return: ${returnId}`,
              vehicleId: vehicleId,
              userId: staffIdFinal,
            },
          });
        }
      }

      // Handle returned items (stock in)
      for (const item of returnedItems) {
        // Verify the item exists in the sale
        const saleItem = sale.items.find(si => si.productId === item.id && si.saleType === item.saleType);
        if (!saleItem) {
          throw new Error(`Item ${item.name} not found in original sale.`);
        }
        
        // Calculate already returned quantity from existing return transactions
        const alreadyReturned = sale.returns.reduce((sum, ret) => {
          return sum + ret.items
            .filter(ri => ri.productId === item.id && ri.saleType === item.saleType && ri.lineType === 'returned')
            .reduce((itemSum, ri) => itemSum + ri.quantity, 0);
        }, 0);
        
        if ((alreadyReturned + item.quantity) > saleItem.quantity) {
          throw new Error(`Cannot return ${item.quantity} of ${item.name}. Already returned: ${alreadyReturned}, Max: ${saleItem.quantity}`);
        }
        
        // Update stock if resellable
        if (item.isResellable) {
          const product = await tx.product.findUnique({ where: { id: item.id } });
          if (!product) {
            throw new Error(`Product with ID ${item.id} not found.`);
          }
          
          if (vehicleId) {
            // Return to vehicle - create stock transaction
            await tx.stockTransaction.create({
              data: {
                productId: item.id,
                productName: item.name,
                productSku: item.sku || null,
                type: 'LOAD_TO_VEHICLE' as any,
                quantity: item.quantity,
                previousStock: product.stock,
                newStock: product.stock,
                transactionDate: new Date(),
                notes: `Resellable return to vehicle. Return ID: ${returnId}`,
                vehicleId: vehicleId,
                userId: staffIdFinal,
              },
            });
          } else {
            // Return to main inventory - increase stock
            await tx.product.update({
              where: { id: item.id },
              data: { stock: product.stock + item.quantity }
            });
          }
        }
      }

      // 4. CREATE RETURN TRANSACTION
      const returnTransaction = await tx.returnTransaction.create({
        data: {
          id: returnId,
          originalSaleId: saleId,
          returnDate: new Date(),
          staffId: staffIdFinal,
          customerId: customerId || null,
          customerName: customerName || null,
          customerShopName: customerShopName || null,
          notes: `Return/Exchange for Sale ${saleId}`,
          amountPaid: payment?.amountPaid || null,
          paymentSummary: payment?.paymentSummary || null,
          changeGiven: payment?.changeGiven || null,
          settleOutstandingAmount: settleOutstandingAmount || null,
          refundAmount: refundAmount || null,
          cashPaidOut: cashPaidOut || null,
          chequeNumber: payment?.chequeDetails?.number || null,
          chequeBank: payment?.chequeDetails?.bank || null,
          chequeDate: payment?.chequeDetails?.date ? new Date(payment.chequeDetails.date) : null,
          chequeAmount: payment?.chequeDetails?.amount || null,
          bankName: payment?.bankTransferDetails?.bankName || null,
          referenceNumber: payment?.bankTransferDetails?.referenceNumber || null,
          bankAmount: payment?.bankTransferDetails?.amount || null,
          items: {
            create: [
              ...returnedItems.map(item => ({
                lineType: 'returned' as any,
                productId: item.id,
                quantity: item.quantity,
                appliedPrice: item.appliedPrice,
                saleType: item.saleType as any,
                name: item.name,
                category: item.category as any,
                price: item.price,
                sku: item.sku || null,
                isOfferItem: item.isOfferItem || false,
              })),
              ...exchangedItems.map(item => ({
                lineType: 'exchanged' as any,
                productId: item.id,
                quantity: item.quantity,
                appliedPrice: item.appliedPrice,
                saleType: item.saleType as any,
                name: item.name,
                category: item.category as any,
                price: item.price,
                sku: item.sku || null,
                isOfferItem: item.isOfferItem || false,
              })),
            ],
          },
        },
        include: { items: true },
      });

      return returnTransaction;
    });

    // Build response
    const returnData = {
      id: result.id,
      originalSaleId: result.originalSaleId,
      returnDate: result.returnDate,
      staffId: result.staffId,
      returnedItems: returnedItems,
      exchangedItems: exchangedItems,
      customerId: result.customerId || undefined,
      customerName: result.customerName || undefined,
      customerShopName: result.customerShopName || undefined,
      settleOutstandingAmount: result.settleOutstandingAmount ? Number(result.settleOutstandingAmount) : undefined,
      refundAmount: result.refundAmount ? Number(result.refundAmount) : undefined,
      cashPaidOut: result.cashPaidOut ? Number(result.cashPaidOut) : undefined,
      amountPaid: result.amountPaid ? Number(result.amountPaid) : undefined,
      paymentSummary: result.paymentSummary || undefined,
      changeGiven: result.changeGiven ? Number(result.changeGiven) : undefined,
      chequeDetails: result.chequeNumber ? {
        number: result.chequeNumber,
        bank: result.chequeBank || undefined,
        date: result.chequeDate || undefined,
        amount: result.chequeAmount ? Number(result.chequeAmount) : undefined,
      } : undefined,
      bankTransferDetails: result.bankName ? {
        bankName: result.bankName,
        referenceNumber: result.referenceNumber || undefined,
        amount: result.bankAmount ? Number(result.bankAmount) : undefined,
      } : undefined,
    };

    return NextResponse.json({ 
      message: 'Return/Exchange processed successfully and stock updated.', 
      returnId,
      returnData
    });

  } catch (error) {
    console.error('Error processing return/exchange:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process return/exchange', details: errorMessage }, { status: 500 });
  }
}
