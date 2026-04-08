/*
  Warnings:

  - A unique constraint covering the columns `[dpi]` on the table `Doctor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dpi` to the `Doctor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "dpi" TEXT NOT NULL,
ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Especialidad" ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Sede" ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_dpi_key" ON "Doctor"("dpi");
