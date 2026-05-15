import { v4 as uuid } from 'uuid'
import pool from '../db/pool'
import { AppError } from '../utils/AppError'

export async function listarExames(usuarioId: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT
       e.id, e.tipo, e.data_agendada, e.data_resultado, e.status, e.resultado,
       u.nome AS unidade_nome, u.cidade
     FROM exames e
     JOIN unidades_saude u ON u.id = e.unidade_id
     WHERE e.usuario_id = ?
     ORDER BY e.data_agendada DESC`,
    [usuarioId]
  )
  return rows
}

export async function buscarExame(id: string, usuarioId: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT
       e.id, e.tipo, e.data_agendada, e.data_resultado, e.status, e.resultado, e.laudo,
       u.nome AS unidade_nome, u.endereco, u.cidade, u.telefone,
       m.nome AS medico_nome, m.especialidade
     FROM exames e
     JOIN unidades_saude u ON u.id = e.unidade_id
     LEFT JOIN consultas c ON c.id = e.consulta_id
     LEFT JOIN medicos m ON m.id = c.medico_id
     WHERE e.id = ? AND e.usuario_id = ?
     LIMIT 1`,
    [id, usuarioId]
  )

  if ((rows as any[]).length === 0) throw new AppError('Exame não encontrado', 404)
  return rows[0]
}

export async function agendarExame(data: {
  usuarioId: string
  unidadeId: string
  consultaId?: string
  tipo: string
  dataAgendada: Date
}) {
  const id = uuid()

  await pool.query(
    `INSERT INTO exames (id, usuario_id, unidade_id, consulta_id, tipo, data_agendada)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.usuarioId, data.unidadeId, data.consultaId ?? null, data.tipo, data.dataAgendada]
  )

  const [rows] = await pool.query<any[]>(
    `SELECT e.id, e.tipo, e.data_agendada, e.status,
            u.nome AS unidade_nome, u.cidade
     FROM exames e
     JOIN unidades_saude u ON u.id = e.unidade_id
     WHERE e.id = ?`,
    [id]
  )

  return rows[0]
}
