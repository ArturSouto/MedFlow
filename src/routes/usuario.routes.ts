import { Router, Request, Response, NextFunction } from 'express'
import { autenticar } from '../middlewares/autenticar'
import pool from '../db/pool'

export const usuarioRoutes = Router()
usuarioRoutes.use(autenticar)

usuarioRoutes.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT
         u.id, u.nome, u.sobrenome, u.email, u.cpf, u.criado_em,
         (SELECT COUNT(*) FROM consultas WHERE usuario_id = u.id) AS total_consultas,
         (SELECT COUNT(*) FROM exames    WHERE usuario_id = u.id) AS total_exames
       FROM usuarios u
       WHERE u.id = ? LIMIT 1`,
      [req.usuarioId]
    )
    if ((rows as any[]).length === 0) {
      res.status(404).json({ message: 'Usuário não encontrado' })
      return
    }
    res.json(rows[0])
  } catch (err) {
    next(err)
  }
})
