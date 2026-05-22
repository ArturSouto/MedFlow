import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as profissionalService from '../services/profissional.service'

const loginSchema = z.object({
  tipo: z.enum(['crm', 'email']),
  identificador: z.string().min(1, 'Identificador obrigatório'),
  senha: z.string().min(1, 'Senha obrigatória'),
})

const registerSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(8),
  crm: z.string().optional(),
  matricula: z.string().optional(),
  especialidade: z.string().optional(),
  cargo: z.string().optional(),
})

export async function loginProfissional(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body)
    const result = await profissionalService.loginProfissional(data)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function registerProfissional(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body)
    const result = await profissionalService.registrarProfissional(data)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}
