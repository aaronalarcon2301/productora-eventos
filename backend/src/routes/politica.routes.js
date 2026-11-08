import {Router} from 'express';
import { getPoliticas, updatePolitica } from '../controllers/politica.controller.js';

const router = Router();

router.get('/', getPoliticas);
router.put('/:id', updatePolitica);

export default router;