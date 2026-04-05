import { Router } from 'express';
import * as seguridad from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', seguridad.register);
router.post('/login', seguridad.login);
export default router;