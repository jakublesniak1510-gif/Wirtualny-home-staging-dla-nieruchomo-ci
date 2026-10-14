-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT,
    "company" TEXT,
    "nip" TEXT,
    "style" TEXT NOT NULL,
    "addons" TEXT NOT NULL DEFAULT '[]',
    "express" BOOLEAN NOT NULL DEFAULT false,
    "photoCount" INTEGER NOT NULL,
    "priceBreakdown" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'pln',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "packageCodeId" TEXT,
    "referralCode" TEXT,
    "notes" TEXT,
    "consentTerms" BOOLEAN NOT NULL DEFAULT false,
    "consentDigital" BOOLEAN NOT NULL DEFAULT false,
    "consentHonesty" BOOLEAN NOT NULL DEFAULT false,
    "consentRights" BOOLEAN NOT NULL DEFAULT false,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "deliveredAt" DATETIME,
    CONSTRAINT "Order_packageCodeId_fkey" FOREIGN KEY ("packageCodeId") REFERENCES "PackageCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "originalKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "resultKey" TEXT,
    "resultUploadedAt" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PackageCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "creditsTotal" INTEGER NOT NULL,
    "creditsLeft" INTEGER NOT NULL,
    "email" TEXT,
    "note" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "message" TEXT,
    "payload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_publicToken_key" ON "Order"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_email_idx" ON "Order"("email");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Photo_orderId_idx" ON "Photo"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PackageCode_code_key" ON "PackageCode"("code");

-- CreateIndex
CREATE INDEX "ContactRequest_type_idx" ON "ContactRequest"("type");

-- CreateIndex
CREATE INDEX "ContactRequest_createdAt_idx" ON "ContactRequest"("createdAt");
