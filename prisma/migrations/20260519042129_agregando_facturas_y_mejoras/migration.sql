-- AlterTable
ALTER TABLE "Cita" ADD COLUMN     "precio_consulta" DECIMAL(65,30) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "bloqueado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "intentos_fallidos" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "LogAuditoria" (
    "id_log" SERIAL NOT NULL,
    "accion" TEXT NOT NULL,
    "tabla_afectada" TEXT,
    "ip_origen" TEXT,
    "detalle" TEXT,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER,

    CONSTRAINT "LogAuditoria_pkey" PRIMARY KEY ("id_log")
);

-- CreateTable
CREATE TABLE "Factura" (
    "id_factura" SERIAL NOT NULL,
    "serie" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "autorizacion" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "nit_emisor" TEXT NOT NULL DEFAULT '1234567-8',
    "nit_receptor" TEXT NOT NULL,
    "xml_firmado" TEXT,
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "citaId" INTEGER NOT NULL,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id_factura")
);

-- CreateTable
CREATE TABLE "ReporteEstadistico" (
    "id_reporte" SERIAL NOT NULL,
    "tipo_reporte" TEXT NOT NULL,
    "datos_json" JSONB NOT NULL,
    "mes_referencia" INTEGER NOT NULL,
    "anio_referencia" INTEGER NOT NULL,
    "sedeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReporteEstadistico_pkey" PRIMARY KEY ("id_reporte")
);

-- CreateIndex
CREATE UNIQUE INDEX "Factura_citaId_key" ON "Factura"("citaId");

-- AddForeignKey
ALTER TABLE "LogAuditoria" ADD CONSTRAINT "LogAuditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita"("id_cita") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteEstadistico" ADD CONSTRAINT "ReporteEstadistico_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id_sede") ON DELETE RESTRICT ON UPDATE CASCADE;
