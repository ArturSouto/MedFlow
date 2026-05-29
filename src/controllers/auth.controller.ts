import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as authService from '../services/auth.service'

const registerSchema = z.object({
  nome:      z.string().min(2),
  sobrenome: z.string().min(2),
  cpf:       z.string().length(11).regex(/^\d+$/),
  email:     z.string().email(),
  senha:     z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
})

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body)
    const result = await authService.registrar(data)
    res.status(201).json(result)
  } catch (err) { next(err) }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body)
    const result = await authService.login(data)
    res.json(result)
  } catch (err) { next(err) }
}
