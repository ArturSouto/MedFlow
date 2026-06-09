import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import pool from '../db/pool'
import { AppError } from '../utils/AppError'

export const labRoutes = Router()

labRoutes.get('/exames', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, unidade_id } = req.query
    const params: any[] = []
    let sql = `
      SELECT
        e.id, e.tipo, e.status, e.data_agendada, e.data_resultado, e.resultado, e.laudo,
        CONCAT(u2.nome, ' ', u2.sobrenome) AS paciente_nome,
        u2.cpf AS paciente_cpf,
        un.nome AS unidade_nome, un.tipo AS unidade_tipo
      FROM exames e
      JOIN usuarios u2 ON u2.id = e.usuario_id
      LEFT JOIN unidades_saude un ON un.id = e.unidade_id
      WHERE 1=1`

    if (status) {
      params.push((status as string).toUpperCase())
      sql += ` AND e.status = $${params.length}`
    }
    if (unidade_id) {
      params.push(unidade_id)
      sql += ` AND e.unidade_id = $${params.length}`
    }

    sql += ' ORDER BY e.data_agendada ASC'

    const { rows } = await pool.query(sql, params)
    res.json(rows)
  } catch (err) { next(err) }
})

const atualizarSchema = z.object({
  status:         z.enum(['AGENDADO', 'COLETADO', 'EM_ANALISE', 'PRONTO', 'CANCELADO']),
  resultado:      z.string().optional(),
  laudo:          z.string().optional(),
  data_resultado: z.string().datetime({ offset: true }).optional(),
})

labRoutes.patch('/exames/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const data = atualizarSchema.parse(req.body)

    const { rows: existing } = await pool.query(
      'SELECT id, status FROM exames WHERE id = $1 LIMIT 1',
      [id]
    )
    if (existing.length === 0) throw new AppError('Exame não encontrado', 404)

    const sets: string[] = ['status = $1']
    const params: any[] = [data.status]

    if (data.resultado !== undefined) { params.push(data.resultado); sets.push(`resultado = $${params.length}`) }
    if (data.laudo !== undefined)     { params.push(data.laudo);     sets.push(`laudo = $${params.length}`) }

    if (data.status === 'PRONTO' && !data.data_resultado) {
      sets.push(`data_resultado = NOW()`)
    } else if (data.data_resultado) {
      params.push(data.data_resultado)
      sets.push(`data_resultado = $${params.length}`)
    }

    params.push(id)
    const { rows } = await pool.query(
      `UPDATE exames SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    )
    res.json(rows[0])
  } catch (err) { next(err) }
})
