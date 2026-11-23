
import prisma from '../config/prisma.js';

export const getPoliticas = async (req, res, next) => {
  try {
    const politicas = await prisma.politicaDevolucion.findMany({
      orderBy: {
        diasDesde: 'asc'
      }
    });

    res.json(politicas);

  } catch (error) {
    next(error);
  }
};

export const updatePolitica = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        error: 'Identificador de política inválido.'
      });
    }

    const datos = req.body;

    const existentes = await prisma.politicaDevolucion.findMany({
      where: {
        id: {
          not: id
        }
      }
    });

    const nuevoFin = datos.diasHasta ?? Infinity;

    const solapa = existentes.some(otro => {
      const finOtro = otro.diasHasta ?? Infinity;

      return (
        datos.diasDesde <= finOtro &&
        otro.diasDesde <= nuevoFin
      );
    });

    if (solapa) {
      return res.status(409).json({
        error: 'Este tramo se superpone con otra política de devolución.'
      });
    }

    const actualizada = await prisma.politicaDevolucion.update({
      where: { id },
      data: datos
    });

    res.json(actualizada);

  } catch (error) {
    next(error);
  }
};
