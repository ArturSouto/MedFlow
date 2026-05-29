import { Router } from 'express'
import { register, loginHandler } from '../controllers/auth.controller'

export const authRoutes = Router()
authRoutes.post('/register', register)
authRoutes.post('/login',    loginHandler)
