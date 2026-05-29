import { Request, Response, NextFunction } from 'express'
import pool from '../db/pool'
import { AppError } from '../utils/AppError'

export async function autenticarProfissional(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Token não fornecido', 401))
  }

  const id = authHeader.split(' ')[1]
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(id)) return next(new AppError('Token inválido', 401))

  try {
    const { rows } = await pool.query<{ id: string; email: string }>(
      'SELECT id, email FROM profissionais WHERE id = $1 AND ativo = TRUE LIMIT 1',
      [id]
    )
    if (rows.length === 0) return next(new AppError('Profissional não autenticado', 401))

    req.profissionalId = rows[0].id
    req.usuarioEmail = rows[0].email
    next()
  } catch {
    next(new AppError('Erro ao verificar autenticação', 500))
  }
}
