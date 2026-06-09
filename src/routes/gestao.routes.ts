import { Router, Request, Response, NextFunction } from 'express'
import pool from '../db/pool'

export const gestaoRoutes = Router()

gestaoRoutes.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totais, porStatus, porUnidade, porEspecialidade, ultimasConsultas] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM usuarios  WHERE ativo = TRUE)::int   AS total_pacientes,
          (SELECT COUNT(*) FROM profissionais WHERE ativo = TRUE)::int AS total_profissionais,
          (SELECT COUNT(*) FROM unidades_saude WHERE ativo = TRUE)::int AS total_unidades,
          (SELECT COUNT(*) FROM consultas)::int                        AS total_consultas,
          (SELECT COUNT(*) FROM exames)::int                           AS total_exames,
          (SELECT COUNT(*) FROM prontuarios)::int                      AS total_prontuarios
      `),
      pool.query(`
        SELECT status, COUNT(*)::int AS total
        FROM consultas
        GROUP BY status
        ORDER BY total DESC
      `),
      pool.query(`
        SELECT
          u.nome AS unidade,
          u.tipo,
          COUNT(c.id)::int AS total_consultas,
          COUNT(CASE WHEN c.status = 'CANCELADA' THEN 1 END)::int AS canceladas,
          COUNT(CASE WHEN c.status = 'CONCLUIDA' THEN 1 END)::int AS concluidas
        FROM unidades_saude u
        LEFT JOIN consultas c ON c.unidade_id = u.id
        WHERE u.ativo = TRUE
        GROUP BY u.id, u.nome, u.tipo
        ORDER BY total_consultas DESC
      `),
      pool.query(`
        SELECT
          COALESCE(p.especialidade, 'Geral') AS especialidade,
          COUNT(c.id)::int AS total_consultas
        FROM consultas c
        JOIN profissionais p ON p.id = c.profissional_id
        GROUP BY p.especialidade
        ORDER BY total_consultas DESC
        LIMIT 8
      `),
      pool.query(`
        SELECT
          c.data_hora, c.status,
          CONCAT(us.nome, ' ', us.sobrenome) AS paciente,
          p.nome AS profissional,
          u.nome AS unidade
        FROM consultas c
        JOIN usuarios us ON us.id = c.usuario_id
        LEFT JOIN profissionais p ON p.id = c.profissional_id
        LEFT JOIN unidades_saude u ON u.id = c.unidade_id
        ORDER BY c.criado_em DESC
        LIMIT 10
      `)
    ])

    res.json({
      totais: totais.rows[0],
      por_status: porStatus.rows,
      por_unidade: porUnidade.rows,
      por_especialidade: porEspecialidade.rows,
      ultimas_consultas: ultimasConsultas.rows,
    })
  } catch (err) {
    next(err)
  }
})
