import pool from '../db/pool'
import { AppError } from '../utils/AppError'

export async function listarExames(usuarioId: string) {
  const { rows } = await pool.query(
    `SELECT
       e.id, e.tipo, e.data_agendada, e.data_resultado, e.status, e.resultado,
       u.nome AS unidade_nome, u.cidade
     FROM exames e
     LEFT JOIN unidades_saude u ON u.id = e.unidade_id
     WHERE e.usuario_id = $1
     ORDER BY e.data_agendada DESC`,
    [usuarioId]
  )
  return rows
}

export async function buscarExame(id: string, usuarioId: string) {
  const { rows } = await pool.query(
    `SELECT
       e.id, e.tipo, e.data_agendada, e.data_resultado, e.status, e.resultado, e.laudo,
       u.nome AS unidade_nome, u.endereco, u.cidade, u.telefone,
       p.nome AS profissional_nome, p.especialidade
     FROM exames e
     LEFT JOIN unidades_saude u ON u.id = e.unidade_id
     LEFT JOIN consultas c      ON c.id = e.consulta_id
     LEFT JOIN profissionais p  ON p.id = c.profissional_id
     WHERE e.id = $1 AND e.usuario_id = $2
     LIMIT 1`,
    [id, usuarioId]
  )
  if (rows.length === 0) throw new AppError('Exame não encontrado', 404)
  return rows[0]
}

export async function agendarExame(data: {
  usuarioId: string
  unidadeId: string
  consultaId?: string
  tipo: string
  dataAgendada: Date
}) {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO exames (usuario_id, unidade_id, consulta_id, tipo, data_agendada)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [data.usuarioId, data.unidadeId, data.consultaId ?? null, data.tipo, data.dataAgendada]
  )

  const id = rows[0].id

  const { rows: resultado } = await pool.query(
    `SELECT e.id, e.tipo, e.data_agendada, e.status,
            u.nome AS unidade_nome, u.cidade
     FROM exames e
     LEFT JOIN unidades_saude u ON u.id = e.unidade_id
     WHERE e.id = $1`,
    [id]
  )
  return resultado[0]
}
