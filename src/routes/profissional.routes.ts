import { Router } from 'express'
import { autenticarProfissional } from '../middlewares/autenticarProfissional'
import {
  loginProfissional,
  registerProfissional,
  getMe,
  listarProfissionais,
} from '../controllers/profissional.controller'

export const profissionalAuthRoutes = Router()
profissionalAuthRoutes.post('/login',    loginProfissional)
profissionalAuthRoutes.post('/register', registerProfissional)
profissionalAuthRoutes.get('/me',        autenticarProfissional, getMe)

/* Lista pública de profissionais — usada na página de agendamento */
export const profissionaisRoutes = Router()
profissionaisRoutes.get('/', listarProfissionais)
