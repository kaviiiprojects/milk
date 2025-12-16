import 'server-only';

import prisma from "./prisma";
import { 
  StockTransaction,
} from "./types";

export const StockService = {
  async createTransaction(transaction: Omit<StockTransaction, 'id'>): Promise<string> {
    const created = await prisma.stockTransaction.create({
      data: {
        productId: transaction.productId,
        productName: transaction.productName,
        productSku: transaction.productSku ?? null,
        type: transaction.type as any,
        quantity: transaction.quantity,
        previousStock: transaction.previousStock,
        newStock: transaction.newStock,
        transactionDate: transaction.transactionDate,
        notes: transaction.notes ?? null,
        vehicleId: transaction.vehicleId ?? null,
        userId: transaction.userId ?? null,
        startMeter: transaction.startMeter ?? null,
        endMeter: transaction.endMeter ?? null,
      },
      select: { id: true },
    });
    return created.id;
  },

  async getAllTransactions(): Promise<StockTransaction[]> {
    const rows = await prisma.stockTransaction.findMany({ orderBy: { transactionDate: 'desc' } });
    return rows.map(t => ({
      id: t.id,
      productId: t.productId,
      productName: t.productName,
      productSku: t.productSku || undefined,
      type: t.type as StockTransaction["type"],
      quantity: t.quantity,
      previousStock: t.previousStock,
      newStock: t.newStock,
      transactionDate: t.transactionDate,
      notes: t.notes || undefined,
      vehicleId: t.vehicleId || undefined,
      userId: t.userId || undefined,
      startMeter: t.startMeter || undefined,
      endMeter: t.endMeter || undefined,
    }));
  },

  async getTransactionsByProduct(productId: string): Promise<StockTransaction[]> {
    const rows = await prisma.stockTransaction.findMany({
      where: { productId },
      orderBy: { transactionDate: 'desc' },
    });
    return rows.map(t => ({
      id: t.id,
      productId: t.productId,
      productName: t.productName,
      productSku: t.productSku || undefined,
      type: t.type as StockTransaction["type"],
      quantity: t.quantity,
      previousStock: t.previousStock,
      newStock: t.newStock,
      transactionDate: t.transactionDate,
      notes: t.notes || undefined,
      vehicleId: t.vehicleId || undefined,
      userId: t.userId || undefined,
      startMeter: t.startMeter || undefined,
      endMeter: t.endMeter || undefined,
    }));
  },

  async getTransactionsByVehicleId(vehicleId: string): Promise<StockTransaction[]> {
    const rows = await prisma.stockTransaction.findMany({
      where: { vehicleId },
      orderBy: { transactionDate: 'desc' },
    });
    return rows.map(t => ({
      id: t.id,
      productId: t.productId,
      productName: t.productName,
      productSku: t.productSku || undefined,
      type: t.type as StockTransaction["type"],
      quantity: t.quantity,
      previousStock: t.previousStock,
      newStock: t.newStock,
      transactionDate: t.transactionDate,
      notes: t.notes || undefined,
      vehicleId: t.vehicleId || undefined,
      userId: t.userId || undefined,
      startMeter: t.startMeter || undefined,
      endMeter: t.endMeter || undefined,
    }));
  },
};
