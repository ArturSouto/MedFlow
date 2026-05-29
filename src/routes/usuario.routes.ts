import { Router, Request, Response, NextFunction } from 'express'
import { autenticar } from '../middlewares/autenticar'
import pool from '../db/pool'

export const usuarioRoutes = Router()
usuarioRoutes.use(autenticar)

usuarioRoutes.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         u.id, u.nome, u.sobrenome, u.email, u.cpf, u.criado_em,
         (SELECT COUNT(*) FROM consultas   WHERE usuario_id = u.id)::int AS total_consultas,
         (SELECT COUNT(*) FROM exames      WHERE usuario_id = u.id)::int AS total_exames,
         (SELECT COUNT(*) FROM prontuarios WHERE usuario_id = u.id)::int AS total_prontuarios
       FROM usuarios u
       WHERE u.id = $1
       LIMIT 1`,
      [req.usuarioId]
    )
    if (rows.length === 0) {
      res.status(404).json({ message: 'Usuário não encontrado' })
      return
    }
    res.json(rows[0])
  } catch (err) {
    next(err)
  }
})
