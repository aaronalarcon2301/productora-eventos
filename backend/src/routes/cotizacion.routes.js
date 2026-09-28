import { Router } from 'express';
import { calcularCotizacion } from '../controllers/cotizacion.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { calcularCotizacionSchema } from '../schemas/cotizacion.schema.js';

const router = Router();

// Solo calcula y devuelve el presupuesto, no crea nada en la bd.
// El presupuesto resultante se usa después como valor del campo "presupuesto" al crear el Evento.
router.post('/', validate(calcularCotizacionSchema, 'body'), calcularCotizacion);

export default router;