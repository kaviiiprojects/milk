import 'server-only';

import prisma from "./prisma";
import { format } from 'date-fns';
import {
  type Product,
  type Customer,
  type Sale,
  type CartItem,
  type ReturnTransaction,
  type Payment,
  type Expense,
} from "./types";
import type { DateRange } from "react-day-picker";

const PAGE_SIZE = 50;

// Product Services (Prisma)
export const getProducts = async (): Promise<Product[]> => {
  const rows = await prisma.product.findMany();
  return rows.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category as Product["category"],
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
};

export const getProduct = async (id: string): Promise<Product | null> => {
  const p = await prisma.product.findUnique({ where: { id } });
  return p ? {
    id: p.id,
    name: p.name,
    category: p.category as Product["category"],
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
  } : null;
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
  const created = await prisma.product.create({
    data: {
      name: productData.name,
      category: productData.category as any,
      price: productData.price,
      wholesalePrice: productData.wholesalePrice ?? null,
      stock: productData.stock,
      imageUrl: productData.imageUrl ?? null,
      description: productData.description ?? null,
      sku: productData.sku ?? null,
      reorderLevel: productData.reorderLevel ?? null,
      aiHint: productData.aiHint ?? null,
    },
    select: { id: true },
  });
  return created.id;
};

export const updateProduct = async (id: string, productData: Partial<Omit<Product, 'id'>>): Promise<void> => {
  await prisma.product.update({
    where: { id },
    data: {
      name: productData.name,
      category: productData.category as any,
      price: productData.price as any,
      wholesalePrice: productData.wholesalePrice as any,
      stock: productData.stock as any,
      imageUrl: productData.imageUrl,
      description: productData.description,
      sku: productData.sku,
      reorderLevel: productData.reorderLevel as any,
      aiHint: productData.aiHint,
    },
  });
};

export const deleteProduct = async (id: string): Promise<void> => {
  await prisma.product.delete({ where: { id } });
};

// Customer Services (Prisma)
export const getCustomers = async (limit?: number, cursor?: string | null): Promise<{ customers: Customer[], hasMore: boolean, nextCursor: string | null }> => {
  const pageSize = limit || 50;

  const rows = await prisma.customer.findMany({
    take: pageSize + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = rows.length > pageSize;
  const customerRows = hasMore ? rows.slice(0, pageSize) : rows;
  const nextCursor = hasMore && customerRows.length > 0 ? customerRows[customerRows.length - 1].id : null;

  const customers = customerRows.map(c => ({
    id: c.id,
    avatar: c.avatar || undefined,
    name: c.name,
    phone: c.phone,
    address: c.address || undefined,
    shopName: c.shopName || undefined,
    status: c.status as Customer["status"],
    createdAt: c.createdAt || undefined,
    updatedAt: c.updatedAt || undefined,
    name_lowercase: c.name_lowercase || undefined,
    shopName_lowercase: c.shopName_lowercase || undefined,
  }));

  return { customers, hasMore, nextCursor };
};

export const getPaginatedCustomers = async (_lastVisible?: any): Promise<{ customers: Customer[], lastVisible: any | null }> => {
  const rows = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' }, take: PAGE_SIZE });
  return {
    customers: rows.map(c => ({
      id: c.id,
      avatar: c.avatar || undefined,
      name: c.name,
      phone: c.phone,
      address: c.address || undefined,
      shopName: c.shopName || undefined,
      status: c.status as Customer["status"],
      createdAt: c.createdAt || undefined,
      updatedAt: c.updatedAt || undefined,
      name_lowercase: c.name_lowercase || undefined,
      shopName_lowercase: c.shopName_lowercase || undefined,
    })), lastVisible: null
  };
};

export const getCustomer = async (id: string): Promise<Customer | null> => {
  const c = await prisma.customer.findUnique({ where: { id } });
  return c ? ({
    id: c.id,
    avatar: c.avatar || undefined,
    name: c.name,
    phone: c.phone,
    address: c.address || undefined,
    shopName: c.shopName || undefined,
    status: c.status as Customer["status"],
    createdAt: c.createdAt || undefined,
    updatedAt: c.updatedAt || undefined,
    name_lowercase: c.name_lowercase || undefined,
    shopName_lowercase: c.shopName_lowercase || undefined,
  }) : null;
};

export const addCustomer = async (customerData: Omit<Customer, 'id'>): Promise<string> => {
  const created = await prisma.customer.create({
    data: {
      name: customerData.name,
      phone: customerData.phone,
      status: (customerData.status || 'active') as any,
      address: customerData.address ?? null,
      shopName: customerData.shopName ?? null,
      avatar: customerData.avatar ?? null,
      name_lowercase: customerData.name.toLowerCase(),
      shopName_lowercase: customerData.shopName ? customerData.shopName.toLowerCase() : null,
    },
    select: { id: true },
  });
  return created.id;
};

export const updateCustomer = async (id: string, customerData: Partial<Omit<Customer, 'id'>>): Promise<void> => {
  await prisma.customer.update({
    where: { id },
    data: {
      avatar: customerData.avatar,
      name: customerData.name,
      phone: customerData.phone,
      address: customerData.address,
      shopName: customerData.shopName,
      status: customerData.status as any,
      name_lowercase: customerData.name ? customerData.name.toLowerCase() : undefined,
      shopName_lowercase: customerData.shopName ? customerData.shopName.toLowerCase() : undefined,
    },
  });
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await prisma.customer.delete({ where: { id } });
};

// Sale Services (Prisma)
async function generateCustomSaleId(): Promise<string> {
  const today = new Date();
  const datePart = format(today, "MMdd");
  const counterId = format(today, "yyyy-MM-dd");
  const up = await prisma.dailySalesCounter.upsert({
    where: { id: counterId },
    update: { count: { increment: 1 } },
    create: { id: counterId, count: 1 },
    select: { count: true },
  });
  return `sale-${datePart}-${up.count}`;
}

export const addSale = async (saleData: Omit<Sale, 'id'>): Promise<string> => {
  const newCustomId = await generateCustomSaleId();
  // Resolve a valid staff user ID (accept id or username); fallback to admin (create if missing)
  const resolveStaffId = async (input?: string): Promise<string> => {
    // Try exact id
    if (input) {
      const byId = await prisma.user.findUnique({ where: { id: String(input) }, select: { id: true } });
      if (byId) return byId.id;
      // Try by username (case-insensitive)
      const byUsername = await prisma.user.findFirst({ where: { username: { equals: String(input), mode: 'insensitive' } }, select: { id: true } });
      if (byUsername) return byUsername.id;
    }
    // Fallback to admin
    const existingAdmin = await prisma.user.findFirst({ where: { username: { equals: 'admin', mode: 'insensitive' } }, select: { id: true } });
    if (existingAdmin) return existingAdmin.id;
    // Create admin if not exists
    const createdAdmin = await prisma.user.create({ data: { username: 'admin', name: 'Administrator', role: 'admin', password_hashed_or_plain: null }, select: { id: true } });
    return createdAdmin.id;
  };
  const staffIdFinal = await resolveStaffId(saleData.staffId);
  await prisma.$transaction(async (tx) => {
    // stock adjustments
    const productQuantities = new Map<string, number>();
    for (const item of saleData.items) {
      if (!item.isOfferItem) {
        productQuantities.set(item.id, (productQuantities.get(item.id) || 0) + item.quantity);
      }
    }
    for (const [productId, qty] of productQuantities.entries()) {
      const p = await tx.product.findUnique({ where: { id: productId } });
      if (!p) throw new Error(`Product with ID ${productId} not found.`);
      if (saleData.vehicleId) {
        await tx.stockTransaction.create({
          data: {
            productId,
            productName: p.name,
            productSku: p.sku,
            type: 'UNLOAD_FROM_VEHICLE' as any,
            quantity: qty,
            previousStock: p.stock,
            newStock: p.stock,
            transactionDate: saleData.saleDate,
            notes: `Sale: ${newCustomId}`,
            vehicleId: saleData.vehicleId,
            userId: staffIdFinal,
          },
        });
      } else {
        const newStock = p.stock - qty;
        if (newStock < 0) throw new Error(`Insufficient stock for ${p.name}. Available: ${p.stock}, Tried to sell: ${qty}`);
        await tx.product.update({ where: { id: productId }, data: { stock: newStock } });
      }
    }

    // create sale
    await tx.sale.create({
      data: {
        id: newCustomId,
        customerId: saleData.customerId ?? null,
        customerName: saleData.customerName ?? null,
        customerShopName: saleData.customerShopName ?? null,
        staffId: staffIdFinal,
        staffName: saleData.staffName ?? null,
        vehicleId: saleData.vehicleId ?? null,
        saleDate: saleData.saleDate,
        subTotal: saleData.subTotal,
        discountPercentage: saleData.discountPercentage ?? 0,
        discountAmount: saleData.discountAmount,
        totalAmount: saleData.totalAmount,
        paidAmountCash: saleData.paidAmountCash ?? null,
        paidAmountCheque: saleData.paidAmountCheque ?? null,
        paidAmountBankTransfer: saleData.paidAmountBankTransfer ?? null,
        creditUsed: saleData.creditUsed ?? null,
        totalAmountPaid: saleData.totalAmountPaid,
        outstandingBalance: saleData.outstandingBalance,
        initialOutstandingBalance: saleData.initialOutstandingBalance ?? null,
        changeGiven: saleData.changeGiven ?? null,
        paymentSummary: saleData.paymentSummary,
        offerApplied: saleData.offerApplied ?? false,
        status: (saleData.status || 'completed') as any,
        cancellationReason: saleData.cancellationReason ?? null,
        items: {
          create: saleData.items.map((it: CartItem) => ({
            productId: it.id,
            quantity: it.quantity,
            appliedPrice: it.appliedPrice,
            saleType: it.saleType as any,
            name: it.name,
            category: it.category as any,
            price: it.price,
            sku: it.sku ?? null,
            imageUrl: it.imageUrl ?? null,
            isOfferItem: it.isOfferItem ?? false,
            returnedQuantity: it.returnedQuantity ?? null,
          })),
        },
      },
    });

    // additional payments
    if (saleData.additionalPayments && saleData.additionalPayments.length > 0) {
      for (const p of saleData.additionalPayments) {
        const paymentStaffId = await resolveStaffId(p.staffId || staffIdFinal);
        await tx.payment.create({
          data: {
            saleId: newCustomId,
            amount: p.amount,
            method: p.method as any,
            date: p.date,
            notes: p.notes ?? null,
            staffId: paymentStaffId,
            chequeNumber: (p.details as any)?.number ?? null,
            chequeBank: (p.details as any)?.bank ?? null,
            chequeDate: (p.details as any)?.date ?? null,
            chequeAmount: (p.details as any)?.amount ?? null,
            bankName: (p.details as any)?.bankName ?? null,
            referenceNumber: (p.details as any)?.referenceNumber ?? null,
            bankAmount: (p.details as any)?.amount ?? null,
          },
        });
      }
    }
  });
  return newCustomId;
};

export const getSales = async (limit?: number, cursor?: string | null): Promise<{ sales: Sale[], hasMore: boolean, nextCursor: string | null }> => {
  const pageSize = limit || 50; // Default to 50 if no limit specified

  const rows = await prisma.sale.findMany({
    take: pageSize + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    include: {
      items: true,
      returns: {
        include: {
          items: true
        }
      },
      payments: true
    },
    orderBy: { saleDate: 'desc' },

  });

  const hasMore = rows.length > pageSize;
  const salesRows = hasMore ? rows.slice(0, pageSize) : rows;
  const nextCursor = hasMore && salesRows.length > 0 ? salesRows[salesRows.length - 1].id : null;

  // Calculate returnedQuantity for each sale item by aggregating return items
  const sales: Sale[] = salesRows.map(s => {
    // Create a map of (productId, saleType) -> total returned quantity
    const returnedQuantities = new Map<string, number>();

    s.returns.forEach(returnTx => {
      returnTx.items.forEach(returnItem => {
        // Only count items with lineType 'returned' (not 'exchanged')
        if (returnItem.lineType === 'returned') {
          const key = `${returnItem.productId}-${returnItem.saleType}`;
          returnedQuantities.set(key, (returnedQuantities.get(key) || 0) + returnItem.quantity);
        }
      });
    });

    // Map sale items with calculated returnedQuantity
    const items: CartItem[] = s.items.map(item => {
      const key = `${item.productId}-${item.saleType}`;
      const returnedQty = returnedQuantities.get(key) || 0;

      return {
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
        returnedQuantity: returnedQty > 0 ? returnedQty : undefined,
      };
    });

    return {
      id: s.id,
      items,
      subTotal: Number(s.subTotal),
      discountPercentage: Number(s.discountPercentage),
      discountAmount: Number(s.discountAmount),
      totalAmount: Number(s.totalAmount),
      paidAmountCash: s.paidAmountCash ? Number(s.paidAmountCash) : undefined,
      paidAmountCheque: s.paidAmountCheque ? Number(s.paidAmountCheque) : undefined,
      chequeDetails: undefined,
      paidAmountBankTransfer: s.paidAmountBankTransfer ? Number(s.paidAmountBankTransfer) : undefined,
      bankTransferDetails: undefined,
      creditUsed: s.creditUsed ? Number(s.creditUsed) : undefined,
      additionalPayments: s.payments.map(p => ({
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
      totalAmountPaid: Number(s.totalAmountPaid),
      outstandingBalance: Number(s.outstandingBalance),
      initialOutstandingBalance: s.initialOutstandingBalance ? Number(s.initialOutstandingBalance) : undefined,
      changeGiven: s.changeGiven ? Number(s.changeGiven) : undefined,
      paymentSummary: s.paymentSummary,
      saleDate: s.saleDate,
      staffId: s.staffId,
      staffName: s.staffName || undefined,
      customerId: s.customerId || undefined,
      customerName: s.customerName || undefined,
      customerShopName: s.customerShopName || undefined,
      offerApplied: s.offerApplied,
      vehicleId: s.vehicleId || undefined,
      createdAt: s.createdAt || undefined,
      updatedAt: s.updatedAt || undefined,
      status: s.status as any,
      cancellationReason: s.cancellationReason || undefined,
    };
  });
  return { sales, hasMore, nextCursor };
};

export const getReturns = async (_lastVisible?: any, dateRange?: DateRange, staffId?: string): Promise<{ returns: ReturnTransaction[], lastVisible: any | null }> => {
  const where: any = {};
  if (dateRange?.from) where.returnDate = { gte: dateRange.from, ...(dateRange?.to ? { lte: dateRange.to } : {}) };
  if (staffId) where.staffId = staffId;
  const rows = await prisma.returnTransaction.findMany({
    where,
    include: { items: true },
    orderBy: { returnDate: 'desc' },
    take: PAGE_SIZE
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
  return { returns, lastVisible: null };
};

export const getExpenses = async (dateRange?: DateRange, staffId?: string): Promise<Expense[]> => {
  const where: any = {};
  if (dateRange?.from) where.expenseDate = { gte: dateRange.from, ...(dateRange?.to ? { lte: dateRange.to } : {}) };
  if (staffId) where.staffId = staffId;
  const rows = await prisma.expense.findMany({ where, orderBy: { expenseDate: 'desc' } });
  return rows.map(e => ({
    id: e.id,
    category: e.category,
    description: e.description || undefined,
    amount: Number(e.amount),
    expenseDate: e.expenseDate,
    staffId: e.staffId || undefined,
    vehicleId: e.vehicleId || undefined,
    createdAt: e.createdAt || undefined,
  }));
};

export const updateProductStock = async (productId: string, newStockLevel: number): Promise<void> => {
  await prisma.product.update({ where: { id: productId }, data: { stock: newStockLevel } });
};

export const updateProductStockTransactional = async (productId: string, quantityChange: number): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    const p = await tx.product.findUnique({ where: { id: productId } });
    if (!p) throw new Error(`Product with ID ${productId} does not exist!`);
    const newStock = p.stock + quantityChange;
    if (newStock < 0) throw new Error(`Insufficient stock for product ${productId}. Current: ${p.stock}, Tried to change by: ${quantityChange}`);
    await tx.product.update({ where: { id: productId }, data: { stock: newStock } });
  });
};
