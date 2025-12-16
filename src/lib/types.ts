
// location src/lib/types.ts
import { Timestamp, DocumentReference, doc } from 'firebase/firestore';
import { db } from './firebase';

const safeTimestampToDate = (field: any): Date | undefined => {
  if (!field) {
    return undefined;
  }
  if (field instanceof Date) {
    return field;
  }
  if (typeof field.toDate === 'function') {
    return field.toDate();
  }
  // Attempt to parse string dates, but be cautious
  if (typeof field === 'string') {
    const d = new Date(field);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }
  // Handle Firestore-like objects that aren't Timestamps
  if (typeof field === 'object' && field.seconds !== undefined && field.nanoseconds !== undefined) {
    try {
      const ts = new Timestamp(field.seconds, field.nanoseconds);
      return ts.toDate();
    } catch(e) {
      console.warn("Could not convert object to Date:", field, e);
      return undefined;
    }
  }

  console.warn("Unsupported date format:", field);
  return undefined;
};

export interface Product {
  id: string;
  name: string;
  category: "Yogurt" | "Drink" | "Ice Cream" | "Dessert" | "Curd" | "Other";
  price: number;
  wholesalePrice?: number;
  stock: number;
  imageUrl?: string;
  description?: string;
  sku?: string;
  reorderLevel?: number;
  aiHint?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Customer {
  id: string;
  avatar?: string;
  name: string;
  phone: string;
  address?: string;
  shopName?: string;
  status?: 'active' | 'pending';
  createdAt?: Date;
  updatedAt?: Date;
  name_lowercase?: string;
  shopName_lowercase?: string;
}

export interface CartItem {
  id: string; // Product ID
  quantity: number;
  appliedPrice: number; // Price after any sale-specific adjustments (usually same as original or wholesale)
  saleType: 'retail' | 'wholesale';
  
  // Denormalized product details at the time of sale
  name: string; 
  category: Product["category"];
  price: number; // Original retail price of the product at time of sale
  sku?: string; // Original SKU
  imageUrl?: string; // Original Image URL
  
  isOfferItem?: boolean; // Added for "Buy 12 Get 1 Free"
  returnedQuantity?: number;
}

export interface ChequeInfo {
  number?: string;
  bank?: string;
  date?: Date; 
  amount?: number; 
}

export interface FirestoreChequeInfo extends Omit<ChequeInfo, 'date' | 'amount'> {
  date?: Timestamp; 
  amount?: number;
}

export interface BankTransferInfo {
  bankName?: string;
  referenceNumber?: string;
  amount?: number;
}

export interface FirestoreBankTransferInfo extends Omit<BankTransferInfo, 'amount'> {
   amount?: number;
}

export interface Payment {
  amount: number;
  method: 'Cash' | 'Cheque' | 'BankTransfer' | 'ReturnCredit';
  date: Date;
  notes?: string;
  details?: ChequeInfo | BankTransferInfo;
  staffId: string;
}

export interface FirestorePayment extends Omit<Payment, 'date' | 'details'> {
  date: Timestamp;
  details?: FirestoreChequeInfo | FirestoreBankTransferInfo;
}

export interface Sale {
  id: string;
  customerId?: string;
  customerName?: string;
  customerShopName?: string;
  items: CartItem[];
  subTotal: number;
  discountPercentage: number;
  discountAmount: number;
  totalAmount: number; // Total amount due for the sale
  
  paidAmountCash?: number;
  paidAmountCheque?: number;
  chequeDetails?: ChequeInfo; 
  paidAmountBankTransfer?: number;
  bankTransferDetails?: BankTransferInfo;
  creditUsed?: number;

  additionalPayments?: Payment[];

  totalAmountPaid: number; // Sum of all payments made
  outstandingBalance: number; // totalAmount - totalAmountPaid (if positive, amount due)
  initialOutstandingBalance?: number;
  changeGiven?: number; // If cash_tendered > totalAmount and paid fully by cash (considering cash was the only or last part of payment)

  paymentSummary: string; // e.g., "Cash", "Cheque (123)", "Partial (Cash + Cheque)", "Full Credit"
  
  saleDate: Date;
  staffId: string;
  staffName?: string;
  offerApplied?: boolean;
  vehicleId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: 'completed' | 'pending' | 'cancelled';
  cancellationReason?: string;
}

export type StockTransactionType =
  | "ADD_STOCK_INVENTORY"
  | "LOAD_TO_VEHICLE"
  | "UNLOAD_FROM_VEHICLE"
  | "REMOVE_STOCK_WASTAGE"
  | "STOCK_ADJUSTMENT_MANUAL"
  | "ISSUE_SAMPLE";

export interface StockTransaction {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  type: StockTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  transactionDate: Date;
  notes?: string;
  vehicleId?: string;
  userId?: string;
  startMeter?: number;
  endMeter?: number;
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  driverName?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReturnTransaction {
  id: string;
  originalSaleId: string;
  returnDate: Date;
  staffId: string;
  customerId?: string;
  customerName?: string;
  customerShopName?: string;
  returnedItems: CartItem[];
  exchangedItems: CartItem[];
  notes?: string;
  amountPaid?: number;
  paymentSummary?: string;
  chequeDetails?: ChequeInfo;
  bankTransferDetails?: BankTransferInfo;
  changeGiven?: number;
  settleOutstandingAmount?: number;
  refundAmount?: number; // Credit added to customer account
  cashPaidOut?: number; // Cash given back to customer
  createdAt?: Date;
}

export interface Expense {
    id: string;
    category: string;
    description?: string;
    amount: number;
    expenseDate: Date;
    staffId?: string;
    staffName?: string;
    vehicleId?: string;
    createdAt?: Date;
}

export interface FirestoreProduct extends Omit<Product, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreCustomer extends Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'status'> {
  status?: 'active' | 'pending';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  name_lowercase?: string;
  shopName_lowercase?: string;
}

export interface FirestoreVehicle extends Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'> {
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface FirestoreCartItem {
  productRef: string | DocumentReference;
  quantity: number;
  appliedPrice: number;
  saleType: 'retail' | 'wholesale';
  
  productName: string; 
  productCategory: Product["category"];
  productPrice: number;
  productSku?: string;
  
  isOfferItem?: boolean;
  returnedQuantity?: number;
}

export interface FirestoreSale extends Omit<Sale, 'id' | 'saleDate' | 'createdAt' | 'updatedAt' | 'items' | 'chequeDetails' | 'bankTransferDetails' | 'additionalPayments' | 'customerShopName'> {
  items: FirestoreCartItem[];
  saleDate: Timestamp;
  chequeDetails?: FirestoreChequeInfo;
  bankTransferDetails?: FirestoreBankTransferInfo;
  additionalPayments?: FirestorePayment[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  customerShopName?: string;
  status?: 'completed' | 'pending' | 'cancelled';
  cancellationReason?: string;
}

export interface FirestoreStockTransaction extends Omit<StockTransaction, 'id' | 'transactionDate'> {
  transactionDate: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreUser extends Omit<User, 'id'> {
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface FirestoreReturnTransaction extends Omit<ReturnTransaction, 'id' | 'returnDate' | 'createdAt' | 'returnedItems' | 'exchangedItems' | 'chequeDetails' | 'bankTransferDetails' | 'customerShopName'> {
  returnDate: Timestamp;
  createdAt: Timestamp;
  returnedItems: FirestoreCartItem[];
  exchangedItems: FirestoreCartItem[];
  chequeDetails?: FirestoreChequeInfo;
  bankTransferDetails?: BankTransferInfo;
  customerShopName?: string;
}

export interface FirestoreExpense extends Omit<Expense, 'id' | 'expenseDate' | 'createdAt'> {
    expenseDate: Timestamp;
    vehicleId?: string;
    createdAt?: Timestamp;
}

export const productConverter = {
  toFirestore: (product: Product): FirestoreProduct => {
    const { id, ...data } = product;
    const firestoreProduct: Partial<FirestoreProduct> = {
      name: data.name,
      category: data.category,
      price: data.price,
      stock: data.stock,
      updatedAt: Timestamp.now(),
    };
    if (data.wholesalePrice !== undefined) firestoreProduct.wholesalePrice = data.wholesalePrice;
    if (data.imageUrl) firestoreProduct.imageUrl = data.imageUrl;
    if (data.description) firestoreProduct.description = data.description;
    if (data.sku) firestoreProduct.sku = data.sku;
    if (data.reorderLevel !== undefined) firestoreProduct.reorderLevel = data.reorderLevel;
    if (data.aiHint) firestoreProduct.aiHint = data.aiHint;
    if (!data.createdAt) firestoreProduct.createdAt = Timestamp.now();
    return firestoreProduct as FirestoreProduct;
  },
  fromFirestore: (snapshot: any): Product => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name,
      category: data.category,
      price: data.price,
      wholesalePrice: data.wholesalePrice,
      stock: data.stock,
      imageUrl: data.imageUrl,
      description: data.description,
      sku: data.sku,
      reorderLevel: data.reorderLevel,
      aiHint: data.aiHint,
      createdAt: safeTimestampToDate(data.createdAt),
      updatedAt: safeTimestampToDate(data.updatedAt),
    };
  }
};

export const customerConverter = {
  toFirestore: (customer: Customer): FirestoreCustomer => {
    const { id, ...data } = customer;
    const firestoreCustomer: Partial<FirestoreCustomer> = {
      name: data.name,
      phone: data.phone,
      status: data.status || 'active',
      updatedAt: Timestamp.now(),
      name_lowercase: data.name.toLowerCase(),
    };
    if (data.avatar) firestoreCustomer.avatar = data.avatar;
    if (data.address) firestoreCustomer.address = data.address;
    if (data.shopName) {
      firestoreCustomer.shopName = data.shopName;
      firestoreCustomer.shopName_lowercase = data.shopName.toLowerCase();
    }
    if (!data.createdAt) firestoreCustomer.createdAt = Timestamp.now();
    return firestoreCustomer as FirestoreCustomer;
  },
  fromFirestore: (snapshot: any): Customer => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name,
      phone: data.phone,
      avatar: data.avatar,
      address: data.address,
      shopName: data.shopName,
      status: data.status || 'active',
      createdAt: safeTimestampToDate(data.createdAt),
      updatedAt: safeTimestampToDate(data.updatedAt),
      name_lowercase: data.name_lowercase,
      shopName_lowercase: data.shopName_lowercase,
    };
  }
};

export const vehicleConverter = {
    toFirestore: (vehicle: Vehicle): FirestoreVehicle => {
        const { id, ...data } = vehicle;
        const firestoreVehicle: Partial<FirestoreVehicle> = {
            vehicleNumber: data.vehicleNumber,
            updatedAt: Timestamp.now(),
        };
        if (data.driverName) firestoreVehicle.driverName = data.driverName;
        if (data.notes) firestoreVehicle.notes = data.notes;
        if (!data.createdAt) firestoreVehicle.createdAt = Timestamp.now();
        return firestoreVehicle as FirestoreVehicle;
    },
    fromFirestore: (snapshot: any): Vehicle => {
        const data = snapshot.data();
        return {
            id: snapshot.id,
            vehicleNumber: data.vehicleNumber,
            driverName: data.driverName,
            notes: data.notes,
            createdAt: safeTimestampToDate(data.createdAt),
            updatedAt: safeTimestampToDate(data.updatedAt),
        };
    }
};

export const expenseConverter = {
    toFirestore: (expense: Expense): FirestoreExpense => {
        const { id, ...data } = expense;
        const firestoreExpense: Partial<FirestoreExpense> = {
            category: data.category,
            amount: data.amount,
            expenseDate: Timestamp.fromDate(data.expenseDate),
            createdAt: data.createdAt ? Timestamp.fromDate(data.createdAt) : Timestamp.now(),
        };
        if (data.description) firestoreExpense.description = data.description;
        if (data.staffId) firestoreExpense.staffId = data.staffId;
        if (data.vehicleId) firestoreExpense.vehicleId = data.vehicleId;
        return firestoreExpense as FirestoreExpense;
    },
    fromFirestore: (snapshot: any): Expense => {
        const data = snapshot.data();
        return {
            id: snapshot.id,
            category: data.category,
            description: data.description,
            amount: data.amount,
            expenseDate: safeTimestampToDate(data.expenseDate) || new Date(),
            staffId: data.staffId,
            vehicleId: data.vehicleId,
            createdAt: safeTimestampToDate(data.createdAt),
        };
    }
};

export const saleConverter = {
  toFirestore: (sale: Sale): FirestoreSale => {
    const firestoreSaleItems: FirestoreCartItem[] = sale.items.map(item => {
        const firestoreItem: FirestoreCartItem = {
          productRef: doc(db, "products", item.id).path,
          quantity: item.quantity,
          appliedPrice: item.appliedPrice,
          saleType: item.saleType,
          productName: item.name,
          productCategory: item.category,
          productPrice: item.price,
          isOfferItem: item.isOfferItem || false,
        };
        if (item.returnedQuantity !== undefined) {
          firestoreItem.returnedQuantity = item.returnedQuantity;
        }
        if (item.sku !== undefined) {
          firestoreItem.productSku = item.sku;
        }
        return firestoreItem;
    });
    
    let firestoreChequeDetails: FirestoreChequeInfo | undefined;
    if (sale.chequeDetails) {
        const { number, bank, date, amount } = sale.chequeDetails;
        const details: FirestoreChequeInfo = {};
        if (number) details.number = number;
        if (bank) details.bank = bank;
        if (date) details.date = Timestamp.fromDate(date);
        if (amount) details.amount = amount;
        
        if (Object.keys(details).length > 0) {
            firestoreChequeDetails = details;
        }
    }

    let firestoreBankTransferDetails: BankTransferInfo | undefined;
    if (sale.bankTransferDetails) {
        const { bankName, referenceNumber, amount } = sale.bankTransferDetails;
        const details: BankTransferInfo = {};
        if (bankName) details.bankName = bankName;
        if (referenceNumber) details.referenceNumber = referenceNumber;
        if (amount) details.amount = amount;

        if (Object.keys(details).length > 0) {
            firestoreBankTransferDetails = details;
        }
    }
    
    const { id, ...data } = sale;
    const firestoreSale: Partial<FirestoreSale> = {
      items: firestoreSaleItems,
      subTotal: data.subTotal,
      discountPercentage: data.discountPercentage,
      discountAmount: data.discountAmount,
      totalAmount: data.totalAmount,
      paidAmountCash: data.paidAmountCash,
      paidAmountCheque: data.paidAmountCheque,
      chequeDetails: firestoreChequeDetails,
      paidAmountBankTransfer: data.paidAmountBankTransfer,
      bankTransferDetails: firestoreBankTransferDetails,
      creditUsed: data.creditUsed,
      totalAmountPaid: data.totalAmountPaid,
      outstandingBalance: data.outstandingBalance,
      initialOutstandingBalance: data.initialOutstandingBalance,
      changeGiven: data.changeGiven,
      paymentSummary: data.paymentSummary,
      saleDate: Timestamp.fromDate(data.saleDate),
      staffId: data.staffId,
      staffName: data.staffName,
      offerApplied: data.offerApplied,
      vehicleId: data.vehicleId,
      customerId: data.customerId,
      customerName: data.customerName,
      customerShopName: data.customerShopName,
      updatedAt: Timestamp.now(),
      status: data.status,
      cancellationReason: data.cancellationReason,
      additionalPayments: data.additionalPayments?.map(p => {
          const firestorePayment: FirestorePayment = { ...p, date: Timestamp.fromDate(p.date) };
          if (firestorePayment.details && 'date' in firestorePayment.details && firestorePayment.details.date && p.details?.date) {
              (firestorePayment.details as FirestoreChequeInfo).date = Timestamp.fromDate(p.details.date);
          }
          return firestorePayment;
      }),
    };

    if (!data.createdAt) {
      firestoreSale.createdAt = Timestamp.now();
    }

    Object.keys(firestoreSale).forEach(keyStr => {
        const key = keyStr as keyof typeof firestoreSale;
        if ((firestoreSale as any)[key] === undefined) {
            delete (firestoreSale as any)[key];
        }
    });

    return firestoreSale as FirestoreSale;
  },
  fromFirestore: (snapshot: any): Sale => {
    const data = snapshot.data();
    let chequeDetails;
    if (data.chequeDetails) {
      chequeDetails = {
        ...data.chequeDetails,
        date: safeTimestampToDate(data.chequeDetails.date),
      };
    }

    return {
      id: snapshot.id,
      items: Array.isArray(data.items) ? data.items.map((item: FirestoreCartItem): CartItem => {
        let id = 'unknown_id';
        if (typeof item.productRef === 'string') {
          id = item.productRef.split('/')[1];
        } else if (item.productRef instanceof DocumentReference) {
          id = item.productRef.id;
        }
        return {
          id,
          quantity: item.quantity,
          appliedPrice: item.appliedPrice,
          saleType: item.saleType,
          name: item.productName || "N/A",
          category: item.productCategory || "Other",
          price: typeof item.productPrice === 'number' ? item.productPrice : 0,
          sku: item.productSku,
          isOfferItem: item.isOfferItem || false,
          returnedQuantity: item.returnedQuantity,
          imageUrl: undefined,
        };
      }) : [],
      subTotal: data.subTotal,
      discountPercentage: data.discountPercentage,
      discountAmount: data.discountAmount,
      totalAmount: data.totalAmount,
      paidAmountCash: data.paidAmountCash,
      paidAmountCheque: data.paidAmountCheque,
      chequeDetails: chequeDetails,
      paidAmountBankTransfer: data.paidAmountBankTransfer,
      bankTransferDetails: data.bankTransferDetails,
      creditUsed: data.creditUsed,
      additionalPayments: Array.isArray(data.additionalPayments) ? data.additionalPayments.map((p: FirestorePayment): Payment => {
        let paymentDetails: ChequeInfo | BankTransferInfo | undefined;
        if (p.details) {
            if (p.method === 'Cheque' && 'date' in p.details && p.details.date) {
                paymentDetails = {
                    ...(p.details as ChequeInfo),
                    date: safeTimestampToDate((p.details as FirestoreChequeInfo).date),
                };
            } else {
                paymentDetails = p.details as BankTransferInfo;
            }
        }
        return {
            amount: p.amount,
            method: p.method,
            date: safeTimestampToDate(p.date) || new Date(),
            staffId: p.staffId,
            notes: p.notes,
            details: paymentDetails,
        };
      }) : undefined,
      totalAmountPaid: data.totalAmountPaid,
      outstandingBalance: data.outstandingBalance,
      initialOutstandingBalance: data.initialOutstandingBalance,
      changeGiven: data.changeGiven,
      paymentSummary: data.paymentSummary || "N/A",
      saleDate: safeTimestampToDate(data.saleDate) || new Date(),
      staffId: data.staffId,
      staffName: data.staffName,
      customerId: data.customerId,
      customerName: data.customerName,
      customerShopName: data.customerShopName,
      offerApplied: data.offerApplied || false,
      vehicleId: data.vehicleId,
      status: data.status || 'completed',
      cancellationReason: data.cancellationReason,
      createdAt: safeTimestampToDate(data.createdAt),
      updatedAt: safeTimestampToDate(data.updatedAt),
    };
  }
};

export const stockTransactionConverter = {
  toFirestore: (transaction: StockTransaction): FirestoreStockTransaction => {
    const { id, ...data } = transaction;
    const firestoreTransaction: Partial<FirestoreStockTransaction> = {
      productId: data.productId,
      productName: data.productName,
      type: data.type,
      quantity: data.quantity,
      previousStock: data.previousStock,
      newStock: data.newStock,
      transactionDate: Timestamp.fromDate(data.transactionDate),
      userId: data.userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    if (data.productSku) firestoreTransaction.productSku = data.productSku;
    if (data.notes) firestoreTransaction.notes = data.notes;
    if (data.vehicleId) firestoreTransaction.vehicleId = data.vehicleId;
    if (data.startMeter) firestoreTransaction.startMeter = data.startMeter;
    if (data.endMeter) firestoreTransaction.endMeter = data.endMeter;

    return firestoreTransaction as FirestoreStockTransaction;
  },
  fromFirestore: (snapshot: any): StockTransaction => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      productId: data.productId,
      productName: data.productName,
      productSku: data.productSku,
      type: data.type,
      quantity: data.quantity,
      previousStock: data.previousStock,
      newStock: data.newStock,
      transactionDate: safeTimestampToDate(data.transactionDate) || new Date(),
      notes: data.notes,
      vehicleId: data.vehicleId,
      userId: data.userId,
      startMeter: data.startMeter,
      endMeter: data.endMeter,
    };
  }
};

export const returnTransactionConverter = {
  toFirestore: (returnData: ReturnTransaction): FirestoreReturnTransaction => {
      const { id, ...data } = returnData;
      const mapItems = (items: CartItem[]): FirestoreCartItem[] => {
        return items.map(item => {
            const firestoreItem: FirestoreCartItem = {
              productRef: doc(db, 'products', item.id).path,
              quantity: item.quantity,
              appliedPrice: item.appliedPrice,
              saleType: item.saleType,
              productName: item.name,
              productCategory: item.category,
              productPrice: item.price,
              isOfferItem: item.isOfferItem || false,
            };
            if (item.returnedQuantity !== undefined) {
              firestoreItem.returnedQuantity = item.returnedQuantity;
            }
            if (item.sku !== undefined) {
              firestoreItem.productSku = item.sku;
            }
            return firestoreItem;
        });
      };

    let firestoreChequeDetails: FirestoreChequeInfo | undefined;
    if (data.chequeDetails) {
        const { number, bank, date, amount } = data.chequeDetails;
        const details: FirestoreChequeInfo = {};
        if (number) details.number = number;
        if (bank) details.bank = bank;
        if (date) details.date = Timestamp.fromDate(date);
        if (amount) details.amount = amount;
        if (Object.keys(details).length > 0) firestoreChequeDetails = details;
    }

    let firestoreBankTransferDetails: BankTransferInfo | undefined;
    if (data.bankTransferDetails) {
        const { bankName, referenceNumber, amount } = data.bankTransferDetails;
        const details: BankTransferInfo = {};
        if (bankName) details.bankName = bankName;
        if (referenceNumber) details.referenceNumber = referenceNumber;
        if (amount) details.amount = amount;
        if (Object.keys(details).length > 0) firestoreBankTransferDetails = details;
    }

    const dataToSave: Partial<FirestoreReturnTransaction> = {
      originalSaleId: data.originalSaleId,
      returnDate: Timestamp.fromDate(data.returnDate),
      createdAt: data.createdAt ? Timestamp.fromDate(data.createdAt) : Timestamp.now(),
      staffId: data.staffId,
      customerId: data.customerId,
      customerName: data.customerName,
      customerShopName: data.customerShopName,
      returnedItems: mapItems(data.returnedItems),
      exchangedItems: mapItems(data.exchangedItems),
      notes: data.notes,
      amountPaid: data.amountPaid,
      paymentSummary: data.paymentSummary,
      chequeDetails: firestoreChequeDetails,
      bankTransferDetails: firestoreBankTransferDetails,
      changeGiven: data.changeGiven,
      settleOutstandingAmount: data.settleOutstandingAmount,
      refundAmount: data.refundAmount,
      cashPaidOut: data.cashPaidOut,
    };
    Object.keys(dataToSave).forEach(key => ((dataToSave as any)[key] === undefined) && delete (dataToSave as any)[key]);
    return dataToSave as FirestoreReturnTransaction;
  },
  fromFirestore: (snapshot: any): ReturnTransaction => {
    const data = snapshot.data();
    let chequeDetails;
    if (data.chequeDetails) {
        chequeDetails = {
            ...data.chequeDetails,
            date: safeTimestampToDate(data.chequeDetails.date),
        }
    }
    
    const processItems = (items: FirestoreCartItem[] = []): CartItem[] => {
        return items.map((item: FirestoreCartItem): CartItem => {
            let id = 'unknown_id';
            if (typeof item.productRef === 'string') {
              id = item.productRef.split('/')[1];
            } else if (item.productRef instanceof DocumentReference) {
              id = item.productRef.id;
            }
            return {
              id,
              quantity: item.quantity,
              appliedPrice: item.appliedPrice,
              saleType: item.saleType,
              name: item.productName || "N/A", 
              category: item.productCategory || "Other",
              price: typeof item.productPrice === 'number' ? item.productPrice : 0, 
              sku: item.productSku, 
              isOfferItem: false,
            };
        });
    };

    return {
      id: snapshot.id,
      originalSaleId: data.originalSaleId,
      returnDate: safeTimestampToDate(data.returnDate) || new Date(),
      staffId: data.staffId,
      customerId: data.customerId,
      customerName: data.customerName,
      customerShopName: data.customerShopName,
      returnedItems: processItems(data.returnedItems),
      exchangedItems: processItems(data.exchangedItems),
      notes: data.notes,
      amountPaid: data.amountPaid,
      paymentSummary: data.paymentSummary,
      chequeDetails: chequeDetails,
      bankTransferDetails: data.bankTransferDetails,
      changeGiven: data.changeGiven,
      settleOutstandingAmount: data.settleOutstandingAmount,
      refundAmount: data.refundAmount,
      cashPaidOut: data.cashPaidOut,
      createdAt: safeTimestampToDate(data.createdAt),
    };
  }
};

export const userConverter = {
    toFirestore: (user: User): FirestoreUser => {
        const { id, ...data } = user;
        const firestoreUser: Partial<FirestoreUser> = {
            username: data.username,
            name: data.name,
            role: data.role,
            password_hashed_or_plain: data.password_hashed_or_plain,
            updatedAt: Timestamp.now(),
        };
        return firestoreUser as FirestoreUser;
    },
    fromFirestore: (snapshot: any): User => {
      const data = snapshot.data();
      return {
        id: snapshot.id,
        username: data.username,
        name: data.name,
        role: data.role,
        password_hashed_or_plain: data.password_hashed_or_plain,
      };
    }
};

export interface StatsData {
  totalSales: number;
  totalCustomers: number;
  lowStockItems: number;
  revenueToday: number;
}

export interface SalesChartData {
  name: string;
  sales: number;
}

export type UserRole = "admin" | "cashier";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  password_hashed_or_plain?: string;
}

export interface NavItemConfig {
  href?: string;
  label: string;
  icon: React.ElementType;
  allowedRoles: UserRole[];
  children?: NavItemConfig[];
  id: string;
}

export interface FullReportEntry {
  transactionId: string;
  transactionType: 'Sale' | 'Return' | 'Sample';
  transactionDate: string; 
  transactionTime: string; 
  relatedId?: string; 
  invoiceCloseDate?: string;
  customerName: string;
  productName: string;
  productCategory: Product["category"];
  quantity: number;
  appliedPrice: number;
  discountOnItem?: number;
  lineTotal: number;
  saleType?: 'retail' | 'wholesale';
  paymentSummary?: Sale["paymentSummary"];
  paymentDetails?: {
    date: Date;
    summary: string;
  }[];
  staffId: string;
}


export interface ActivityItem {
  id: string;
  type: "sale" | "new_product" | "new_customer";
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ElementType;
  avatarUrl?: string;
  avatarFallback?: string;
  aiHint?: string;
}

export interface DayEndReportSummary {
  reportDate: Date;
  totalTransactions: number;
  grossSalesValue: number;
  totalDiscountsToday: number;
  valueOfReturnsToday: number;
  netSalesValue: number;
  
  cashFromSales: number;
  cashFromCreditPayments: number;
  chequeFromCreditPayments: number;
  bankFromCreditPayments: number;
  
  totalCashIn: number;
  totalChequeIn: number;
  totalBankTransferIn: number;
  
  totalRefundsPaidToday: number;
  totalExpensesToday: number;
  netCashInHand: number;

  newCreditIssued: number;
  creditSettledByReturns: number; 
  paidAgainstNewCredit: number;
  netOutstandingFromToday: number;

  chequeNumbers: string[];
  bankTransferRefs: string[];
  creditSalesCount: number;
  samplesIssuedCount: number;
  sampleTransactionsCount: number;
  totalFreeItemsCount?: number;
  totalFreeItemsValue?: number;
  
  // Returns breakdown
  totalReturnsCount: number;
  returnsByExchange: number;
  returnsByRefund: number;
  returnsByCashPaidOut: number;
  returnsByCreditSettled: number;
  totalReturnValue: number;
}


export interface ManagedUser extends Omit<User, 'id'> {
  id: string;
  password?: string;
}

export interface VehicleReportItem {
  productId: string;
  productName: string;
  productSku?: string;
  totalLoaded: number;
  totalUnloaded: number;
  netChange: number;
}

    