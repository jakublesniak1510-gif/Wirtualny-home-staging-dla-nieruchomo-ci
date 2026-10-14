-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
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
    "packageCreditsUsed" INTEGER NOT NULL DEFAULT 0,
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
    "cancelledAt" DATETIME,
    "filesDeletedAt" DATETIME,
    CONSTRAINT "Order_packageCodeId_fkey" FOREIGN KEY ("packageCodeId") REFERENCES "PackageCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("addons", "company", "consentDigital", "consentHonesty", "consentRights", "consentTerms", "createdAt", "currency", "deliveredAt", "email", "express", "id", "isSample", "name", "nip", "notes", "packageCodeId", "paidAt", "paymentStatus", "phone", "photoCount", "priceBreakdown", "publicToken", "referralCode", "status", "stripePaymentIntentId", "stripeSessionId", "style", "totalAmount", "updatedAt") SELECT "addons", "company", "consentDigital", "consentHonesty", "consentRights", "consentTerms", "createdAt", "currency", "deliveredAt", "email", "express", "id", "isSample", "name", "nip", "notes", "packageCodeId", "paidAt", "paymentStatus", "phone", "photoCount", "priceBreakdown", "publicToken", "referralCode", "status", "stripePaymentIntentId", "stripeSessionId", "style", "totalAmount", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_publicToken_key" ON "Order"("publicToken");
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_email_idx" ON "Order"("email");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_isSample_email_idx" ON "Order"("isSample", "email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
