
export const runtime = 'nodejs';
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { Sale, Payment } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: saleId } = await context.params;

  if (!saleId) {
    return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
  }

  try {
    const paymentData = await request.json();
    const { paymentAmount, paymentMethod, paymentDate, notes, details, staffId } = paymentData;

    // Basic validation
    if (typeof paymentAmount !== 'number' || paymentAmount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }
     if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required for payment record' }, { status: 400 });
    }

    // Fetch current sale with payments
    const currentSale = await prisma.sale.findUnique({ 
      where: { id: saleId },
      include: { payments: true }
    });
    if (!currentSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Resolve staffId to a valid user ID (accept id or username); fallback to admin
    let staffIdFinal: string | undefined = undefined;
    if (staffId) {
      const byId = await prisma.user.findUnique({ where: { id: String(staffId) }, select: { id: true } });
      if (byId) {
        staffIdFinal = byId.id;
      } else {
        const byUsername = await prisma.user.findFirst({ where: { username: { equals: String(staffId), mode: 'insensitive' } }, select: { id: true } });
        if (byUsername) staffIdFinal = byUsername.id;
      }
    }
    if (!staffIdFinal) {
      const admin = await prisma.user.findFirst({ where: { username: { equals: 'admin', mode: 'insensitive' } }, select: { id: true } });
      if (admin) staffIdFinal = admin.id;
    }
    if (!staffIdFinal) {
      return NextResponse.json({ error: 'Could not resolve staff user' }, { status: 400 });
    }

    const totalAmountPaid = Number(currentSale.totalAmountPaid) + paymentAmount;
    const newOutstandingBalance = Number(currentSale.totalAmount) - totalAmountPaid;

    // --- Regenerate Payment Summary ---
    const allPayments: { method: string; amount: number; }[] = [];
    if (currentSale.paidAmountCash) allPayments.push({ method: 'Cash', amount: Number(currentSale.paidAmountCash) });
    if (currentSale.paidAmountCheque) allPayments.push({ method: 'Cheque', amount: Number(currentSale.paidAmountCheque) });
    if (currentSale.paidAmountBankTransfer) allPayments.push({ method: 'BankTransfer', amount: Number(currentSale.paidAmountBankTransfer) });
    // Include existing payments from Payment table
    currentSale.payments.forEach(p => {
      allPayments.push({ method: p.method, amount: Number(p.amount) });
    });
    allPayments.push({ method: paymentMethod, amount: paymentAmount });

    const paymentByType = allPayments.reduce((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

    const methodsUsed: string[] = [];
    if (paymentByType['Cash']) methodsUsed.push(`Cash (${paymentByType['Cash'].toFixed(2)})`);
    if (paymentByType['Cheque']) methodsUsed.push(`Cheque (${paymentByType['Cheque'].toFixed(2)})`);
    if (paymentByType['BankTransfer']) methodsUsed.push(`Bank Transfer (${paymentByType['BankTransfer'].toFixed(2)})`);
    
    let newPaymentSummary = "";
    if (methodsUsed.length > 1) {
      newPaymentSummary = `Split (${methodsUsed.join(' + ')})`;
    } else if (methodsUsed.length === 1) {
      newPaymentSummary = methodsUsed[0];
    } else {
      newPaymentSummary = "N/A";
    }

    if (newOutstandingBalance > 0) {
      newPaymentSummary = `Partial (${newPaymentSummary}) - Outstanding: ${newOutstandingBalance.toFixed(2)}`;
    }
    // --- End of Payment Summary Logic ---

    // Create new payment record
    await prisma.payment.create({
      data: {
        saleId: saleId,
        amount: paymentAmount,
        method: paymentMethod as any,
        date: paymentDate ? new Date(paymentDate) : new Date(),
        notes: notes ?? null,
        staffId: staffIdFinal,
        chequeNumber: (details as any)?.number ?? null,
        chequeBank: (details as any)?.bank ?? null,
        chequeDate: (details as any)?.date ? new Date((details as any).date) : null,
        chequeAmount: (details as any)?.amount ?? null,
        bankName: (details as any)?.bankName ?? null,
        referenceNumber: (details as any)?.referenceNumber ?? null,
        bankAmount: (details as any)?.amount ?? null,
      },
    });

    // Update sale with new totals
    const updatedSale = await prisma.sale.update({
      where: { id: saleId },
      data: {
        totalAmountPaid,
        outstandingBalance: newOutstandingBalance < 0 ? 0 : newOutstandingBalance,
        paymentSummary: newPaymentSummary,
      },
      include: { payments: true, items: true },
    });

    // Build response for client
    const finalSaleState: Sale = {
      id: updatedSale.id,
      customerId: updatedSale.customerId || undefined,
      customerName: updatedSale.customerName || undefined,
      customerShopName: updatedSale.customerShopName || undefined,
      items: updatedSale.items.map(item => ({
        id: item.productId,
        quantity: item.quantity,
        appliedPrice: Number(item.appliedPrice),
        saleType: item.saleType as any,
        name: item.name,
        category: item.category as any,
        price: Number(item.price),
        sku: item.sku || undefined,
        imageUrl: item.imageUrl || undefined,
        isOfferItem: item.isOfferItem,
        returnedQuantity: item.returnedQuantity || undefined,
      })),
      subTotal: Number(updatedSale.subTotal),
      discountPercentage: Number(updatedSale.discountPercentage),
      discountAmount: Number(updatedSale.discountAmount),
      totalAmount: Number(updatedSale.totalAmount),
      paidAmountCash: updatedSale.paidAmountCash ? Number(updatedSale.paidAmountCash) : undefined,
      paidAmountCheque: updatedSale.paidAmountCheque ? Number(updatedSale.paidAmountCheque) : undefined,
      paidAmountBankTransfer: updatedSale.paidAmountBankTransfer ? Number(updatedSale.paidAmountBankTransfer) : undefined,
      creditUsed: updatedSale.creditUsed ? Number(updatedSale.creditUsed) : undefined,
      totalAmountPaid: Number(updatedSale.totalAmountPaid),
      outstandingBalance: Number(updatedSale.outstandingBalance),
      initialOutstandingBalance: updatedSale.initialOutstandingBalance ? Number(updatedSale.initialOutstandingBalance) : undefined,
      changeGiven: updatedSale.changeGiven ? Number(updatedSale.changeGiven) : undefined,
      paymentSummary: updatedSale.paymentSummary,
      saleDate: updatedSale.saleDate,
      staffId: updatedSale.staffId,
      staffName: updatedSale.staffName || undefined,
      vehicleId: updatedSale.vehicleId || undefined,
      offerApplied: updatedSale.offerApplied,
      status: updatedSale.status as any,
      cancellationReason: updatedSale.cancellationReason || undefined,
      createdAt: updatedSale.createdAt || undefined,
      updatedAt: updatedSale.updatedAt || undefined,
      additionalPayments: updatedSale.payments.map(p => ({
        amount: Number(p.amount),
        method: p.method as any,
        date: p.date,
        staffId: p.staffId,
        notes: p.notes || undefined,
        details: p.chequeNumber ? {
          number: p.chequeNumber,
          bank: p.chequeBank || undefined,
          date: p.chequeDate || undefined,
          amount: p.chequeAmount ? Number(p.chequeAmount) : undefined,
        } : p.bankName ? {
          bankName: p.bankName,
          referenceNumber: p.referenceNumber || undefined,
          amount: p.bankAmount ? Number(p.bankAmount) : undefined,
        } : undefined,
      })),
    };

    return NextResponse.json(finalSaleState);

  } catch (error) {
    console.error(`Error adding payment to sale ${saleId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to add payment', details: errorMessage }, { status: 500 });
  }
}

// DELETE /api/sales/{id} - Cancel an invoice
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: saleId } = await context.params;
  if (!saleId) {
    return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
  }

  // TODO: Add authorization check here to ensure only admins can cancel

  try {
    const { cancellationReason } = await request.json();
    if (!cancellationReason || typeof cancellationReason !== 'string' || cancellationReason.trim() === '') {
      return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 });
    }

    const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { items: true } });
    if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    if (sale.status === 'cancelled') return NextResponse.json({ error: 'This invoice has already been cancelled.' }, { status: 400 });

    await prisma.$transaction(async (tx) => {
      // Resolve a valid user id for audit on stock transactions; default to admin when needed
      let userIdFinal: string | null = sale.staffId || null;
      if (userIdFinal) {
        const exists = await tx.user.findUnique({ where: { id: userIdFinal }, select: { id: true } });
        if (!exists) userIdFinal = null;
      }
      if (!userIdFinal) {
        const admin = await tx.user.findFirst({ where: { username: { equals: 'admin', mode: 'insensitive' } }, select: { id: true } });
        userIdFinal = admin ? admin.id : null;
      }

      if (sale.vehicleId) {
        // Vehicle sale: log stock transaction entries only (main inventory unchanged)
        for (const item of sale.items) {
          const p = await tx.product.findUnique({ where: { id: item.productId } });
          if (!p) throw new Error(`Product with ID ${item.productId} not found.`);
          await tx.stockTransaction.create({
            data: {
              productId: item.productId,
              productName: p.name,
              productSku: p.sku,
              type: 'LOAD_TO_VEHICLE' as any,
              quantity: item.quantity,
              previousStock: p.stock,
              newStock: p.stock,
              transactionDate: new Date(),
              notes: `Cancellation of Sale ID: ${saleId}`,
              vehicleId: sale.vehicleId,
              userId: userIdFinal,
            },
          });
        }
      } else {
        // Main inventory sale: return stock to products
        for (const item of sale.items) {
          const p = await tx.product.findUnique({ where: { id: item.productId } });
          if (!p) throw new Error(`Product with ID ${item.productId} not found for stock reversal.`);
          await tx.product.update({ where: { id: item.productId }, data: { stock: p.stock + item.quantity } });
        }
      }

      // Remove financial impact of this sale
      await tx.payment.deleteMany({ where: { saleId } });

      await tx.sale.update({
        where: { id: saleId },
        data: {
          status: 'cancelled',
          outstandingBalance: 0,
          totalAmountPaid: 0,
          creditUsed: 0,
          paymentSummary: 'Cancelled',
          cancellationReason: cancellationReason,
        },
      });
    });

    return NextResponse.json({ message: 'Invoice cancelled successfully and stock restored.' });

  } catch (error) {
    console.error(`Error cancelling sale ${saleId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to cancel invoice', details: errorMessage }, { status: 500 });
  }
}
