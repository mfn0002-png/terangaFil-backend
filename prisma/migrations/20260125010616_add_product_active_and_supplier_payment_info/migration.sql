-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "hookSize" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentPhoneNumber" TEXT;
