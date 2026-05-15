import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from '../utils/AppError'

interface TokenPayload {
  sub: string
  email: string
  iat: number
  exp: number
}

declare global {
  namespace Express {
    interface Request {
      usuarioId: string
      usuarioEmail: string
    }
  }
}

export function autenticar(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Token não fornecido', 401))
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
    req.usuarioId = payload.sub
    req.usuarioEmail = payload.email
    next()
  } catch {
    next(new AppError('Token inválido ou expirado', 401))
  }
}
