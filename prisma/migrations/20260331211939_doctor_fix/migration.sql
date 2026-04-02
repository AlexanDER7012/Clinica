-- CreateTable
CREATE TABLE "Especialidad" (
    "id_especialidad" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "Especialidad_pkey" PRIMARY KEY ("id_especialidad")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id_doctor" SERIAL NOT NULL,
    "nombres" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "especialidadId" INTEGER NOT NULL,
    "sedeId" INTEGER NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id_doctor")
);

-- CreateIndex
CREATE UNIQUE INDEX "Especialidad_nombre_key" ON "Especialidad"("nombre");

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_especialidadId_fkey" FOREIGN KEY ("especialidadId") REFERENCES "Especialidad"("id_especialidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id_sede") ON DELETE RESTRICT ON UPDATE CASCADE;
