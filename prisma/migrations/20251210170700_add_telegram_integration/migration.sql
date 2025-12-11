/*
  Warnings:

  - A unique constraint covering the columns `[telegramChatId]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN "telegramChatId" TEXT;
ALTER TABLE "Client" ADD COLUMN "telegramUsername" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Delivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "pickupAddress" TEXT,
    "deliveryAddress" TEXT NOT NULL,
    "instructions" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "maxDeliveryTime" DATETIME NOT NULL,
    "estimatedDeliveryTime" DATETIME,
    "telegramNotificationSent" BOOLEAN NOT NULL DEFAULT false,
    "driverId" TEXT,
    "clientId" TEXT,
    CONSTRAINT "Delivery_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Delivery" ("clientId", "clientName", "clientPhone", "createdAt", "deliveryAddress", "driverId", "id", "instructions", "maxDeliveryTime", "pickupAddress", "priority", "status", "updatedAt") SELECT "clientId", "clientName", "clientPhone", "createdAt", "deliveryAddress", "driverId", "id", "instructions", "maxDeliveryTime", "pickupAddress", "priority", "status", "updatedAt" FROM "Delivery";
DROP TABLE "Delivery";
ALTER TABLE "new_Delivery" RENAME TO "Delivery";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Client_telegramChatId_key" ON "Client"("telegramChatId");
