-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_sedeId_fkey";

-- AlterTable
ALTER TABLE "Usuario" ALTER COLUMN "sedeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id_sede") ON DELETE SET NULL ON UPDATE CASCADE;
