-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'cashier');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('Yogurt', 'Drink', 'Ice_Cream', 'Dessert', 'Curd', 'Other');

-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('retail', 'wholesale');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('Cash', 'Cheque', 'BankTransfer', 'ReturnCredit');

-- CreateEnum
CREATE TYPE "StockTransactionType" AS ENUM ('ADD_STOCK_INVENTORY', 'LOAD_TO_VEHICLE', 'UNLOAD_FROM_VEHICLE', 'REMOVE_STOCK_WASTAGE', 'STOCK_ADJUSTMENT_MANUAL', 'ISSUE_SAMPLE');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('completed', 'pending', 'cancelled');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('active', 'pending');

-- CreateEnum
CREATE TYPE "ReturnLineType" AS ENUM ('returned', 'exchanged');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "password_hashed_or_plain" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "wholesalePrice" DECIMAL(12,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "description" TEXT,
    "sku" TEXT,
    "reorderLevel" INTEGER,
    "aiHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "avatar" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "shopName" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name_lowercase" TEXT,
    "shopName_lowercase" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "driverName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "customerShopName" TEXT,
    "staffId" TEXT NOT NULL,
    "staffName" TEXT,
    "vehicleId" TEXT,
    "saleDate" TIMESTAMP(3) NOT NULL,
    "subTotal" DECIMAL(12,2) NOT NULL,
    "discountPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paidAmountCash" DECIMAL(12,2),
    "paidAmountCheque" DECIMAL(12,2),
    "paidAmountBankTransfer" DECIMAL(12,2),
    "creditUsed" DECIMAL(12,2),
    "totalAmountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "outstandingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "initialOutstandingBalance" DECIMAL(12,2),
    "changeGiven" DECIMAL(12,2),
    "paymentSummary" TEXT NOT NULL,
    "offerApplied" BOOLEAN NOT NULL DEFAULT false,
    "status" "SaleStatus" NOT NULL DEFAULT 'completed',
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "appliedPrice" DECIMAL(12,2) NOT NULL,
    "saleType" "SaleType" NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "sku" TEXT,
    "imageUrl" TEXT,
    "isOfferItem" BOOLEAN NOT NULL DEFAULT false,
    "returnedQuantity" INTEGER,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "staffId" TEXT NOT NULL,
    "chequeNumber" TEXT,
    "chequeBank" TEXT,
    "chequeDate" TIMESTAMP(3),
    "chequeAmount" DECIMAL(12,2),
    "bankName" TEXT,
    "referenceNumber" TEXT,
    "bankAmount" DECIMAL(12,2),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnTransaction" (
    "id" TEXT NOT NULL,
    "originalSaleId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "staffId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "customerShopName" TEXT,
    "notes" TEXT,
    "amountPaid" DECIMAL(12,2),
    "paymentSummary" TEXT,
    "chequeNumber" TEXT,
    "chequeBank" TEXT,
    "chequeDate" TIMESTAMP(3),
    "chequeAmount" DECIMAL(12,2),
    "bankName" TEXT,
    "referenceNumber" TEXT,
    "bankAmount" DECIMAL(12,2),
    "changeGiven" DECIMAL(12,2),
    "settleOutstandingAmount" DECIMAL(12,2),
    "refundAmount" DECIMAL(12,2),
    "cashPaidOut" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "lineType" "ReturnLineType" NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "appliedPrice" DECIMAL(12,2) NOT NULL,
    "saleType" "SaleType" NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "sku" TEXT,
    "isOfferItem" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransaction" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productSku" TEXT,
    "type" "StockTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "newStock" INTEGER NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "vehicleId" TEXT,
    "userId" TEXT,
    "startMeter" INTEGER,
    "endMeter" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "staffId" TEXT,
    "vehicleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySalesCounter" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailySalesCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vehicleNumber_key" ON "Vehicle"("vehicleNumber");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnTransaction" ADD CONSTRAINT "ReturnTransaction_originalSaleId_fkey" FOREIGN KEY ("originalSaleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnTransaction" ADD CONSTRAINT "ReturnTransaction_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnTransaction" ADD CONSTRAINT "ReturnTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "ReturnTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
