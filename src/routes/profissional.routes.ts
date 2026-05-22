import { Router } from 'express'
import { loginProfissional, registerProfissional } from '../controllers/profissional.controller'

export const profissionalRoutes = Router()

profissionalRoutes.post('/login', loginProfissional)
profissionalRoutes.post('/register', registerProfissional)
