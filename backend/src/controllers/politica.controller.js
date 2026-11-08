import prisma from '../config/prisma.js';

export const getPoliticas = async (req, res, next) => {
  try {
    const politicas = await prisma.politicaDevolucion.findMany({
      orderBy: { diasDesde: 'asc' }
    });
    res.json(politicas);
  } catch (error) {
    next(error);
  }
};

export const updatePolitica = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { porcentaje, diasDesde, diasHasta } = req.body;
    
    const actualizada = await prisma.politicaDevolucion.update({
      where: { id: Number(id) },
      data: { 
        porcentaje: Number(porcentaje),
        diasDesde: Number(diasDesde),
        diasHasta: diasHasta ? Number(diasHasta) : null // Si diasHasta viene vacío (string vacío o nulo), se guarda como null 
    }
    });
    res.json(actualizada);
  } catch (error) {
    next(error);
  }
};