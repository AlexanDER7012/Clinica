import prisma from '../config/prisma.js';

const emitirFactura = async (req, res) => {
    const { citaId, nit_receptor } = req.body;

    try {

        const cita = await prisma.cita.findUnique({
            where: { id_cita: parseInt(citaId) },
            include: { factura: true, paciente: true }
        });

        if (!cita) {
            return res.status(404).json({ error: "La cita médica no existe en el sistema." });
        }

        if (cita.factura) {
            return res.status(400).json({ error: `La cita ya cuenta con la factura Serie ${cita.factura.serie} Número ${cita.factura.numero}` });
        }


        const serieAleatoria = "FEL";
        const numeroAleatorio = Math.floor(10000000 + Math.random() * 90000000).toString(); 
        const uuidSat = `E4B3D2A1-C5B6-7D8E-9F0A-${Math.floor(100000000000 + Math.random() * 900000000000)}`;


        const xmlSimulado = `
        <dte:GTDocumento xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0">
            <dte:Sat DTEID="DTE">
                <dte:DatosEmision ID="DatosEmision">
                    <dte:Emisor NITEmisor="1234567-8" NombreEmisor="CLINICA MEDICA INTEGRAL S.A."/>
                    <dte:Receptor NITReceptor="${nit_receptor || 'CF'}" NombreReceptor="${cita.paciente.nombres} ${cita.paciente.apellidos}"/>
                    <dte:Frases><dte:Frase CodigoEscenario="1" TipoFrase="1"/></dte:Frases>
                    <dte:Items>
                        <dte:Item BienOServicio="S" NumeroLinea="1">
                            <dte:Cantidad>1.00</dte:Cantidad>
                            <dte:Descripcion>SERVICIOS MEDICOS PROFESIONALES (CONSULTA)</dte:Descripcion>
                            <dte:PrecioUnitario>${cita.precio_consulta}</dte:PrecioUnitario>
                            <dte:Precio>${cita.precio_consulta}</dte:Precio>
                        </dte:Item>
                    </dte:Items>
                    <dte:Totales><dte:GranTotal>${cita.precio_consulta}</dte:GranTotal></dte:Totales>
                </dte:DatosEmision>
            </dte:Sat>
        </dte:GTDocumento>`.trim();

        const nuevaFactura = await prisma.$transaction(async (tx) => {
            const facturaCreada = await tx.factura.create({
                data: {
                    serie: serieAleatoria,
                    numero: numeroAleatorio,
                    autorizacion: uuidSat,
                    monto: cita.precio_consulta,
                    nit_receptor: nit_receptor || "CF",
                    xml_firmado: xmlSimulado,
                    citaId: parseInt(citaId)
                }
            });

            await tx.cita.update({
                where: { id_cita: parseInt(citaId) },
                data: { estado: 'CONFIRMADA' }
            });

            return facturaCreada;
        });

        res.status(201).json({
            mensaje: "Factura FEL certificada y emitida con éxito.",
            factura: nuevaFactura
        });

    } catch (error) {
        console.error("Error en emitirFactura:", error);
        res.status(500).json({ error: "Error en el servidor al procesar el cobro FEL: " + error.message });
    }
};

const getFacturaById = async (req, res) => {
    try {
        const { id } = req.params;
        const factura = await prisma.factura.findUnique({
            where: { id_factura: parseInt(id) },
            include: {
                cita: {
                    include: { paciente: true, doctor: true, sede: true }
                }
            }
        });

        if (!factura) return res.status(404).json({ error: "Factura no encontrada." });
        res.json(factura);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export {
    emitirFactura,
    getFacturaById
};