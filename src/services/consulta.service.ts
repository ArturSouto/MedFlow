import { v4 as uuid } from 'uuid'
import pool from '../db/pool'
import { AppError } from '../utils/AppError'

export async function listarConsultas(usuarioId: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT
       c.id, c.data_hora, c.status, c.observacoes, c.criado_em,
       m.nome AS medico_nome, m.especialidade,
       u.nome AS unidade_nome, u.cidade, u.tipo
     FROM consultas c
     JOIN medicos m ON m.id = c.medico_id
     JOIN unidades_saude u ON u.id = c.unidade_id
     WHERE c.usuario_id = ?
     ORDER BY c.data_hora DESC`,
    [usuarioId]
  )
  return rows
}

export async function buscarConsulta(id: string, usuarioId: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT
       c.id, c.data_hora, c.status, c.observacoes, c.criado_em,
       m.nome AS medico_nome, m.especialidade, m.crm,
       u.nome AS unidade_nome, u.endereco, u.cidade, u.estado, u.tipo, u.telefone
     FROM consultas c
     JOIN medicos m ON m.id = c.medico_id
     JOIN unidades_saude u ON u.id = c.unidade_id
     WHERE c.id = ? AND c.usuario_id = ?
     LIMIT 1`,
    [id, usuarioId]
  )

  if (rows.length === 0) throw new AppError('Consulta não encontrada', 404)

  const [exames] = await pool.query<any[]>(
    'SELECT id, tipo, data_agendada, status FROM exames WHERE consulta_id = ?',
    [id]
  )

  return { ...rows[0], exames }
}

export async function agendarConsulta(data: {
  usuarioId: string
  medicoId: string
  unidadeId: string
  dataHora: Date
  observacoes?: string
}) {
  const [conflito] = await pool.query<any[]>(
    `SELECT id FROM consultas
     WHERE usuario_id = ? AND data_hora = ?
       AND status NOT IN ('CANCELADA','FALTA')
     LIMIT 1`,
    [data.usuarioId, data.dataHora]
  )

  if ((conflito as any[]).length > 0) {
    throw new AppError('Você já tem uma consulta neste horário', 409)
  }

  const id = uuid()

  await pool.query(
    `INSERT INTO consultas (id, usuario_id, medico_id, unidade_id, data_hora, observacoes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.usuarioId, data.medicoId, data.unidadeId, data.dataHora, data.observacoes ?? null]
  )

  const [rows] = await pool.query<any[]>(
    `SELECT
       c.id, c.data_hora, c.status, c.observacoes,
       m.nome AS medico_nome, m.especialidade,
       u.nome AS unidade_nome, u.cidade
     FROM consultas c
     JOIN medicos m ON m.id = c.medico_id
     JOIN unidades_saude u ON u.id = c.unidade_id
     WHERE c.id = ?`,
    [id]
  )

  return rows[0]
}

export async function cancelarConsulta(id: string, usuarioId: string) {
  const [rows] = await pool.query<any[]>(
    'SELECT id, status FROM consultas WHERE id = ? AND usuario_id = ? LIMIT 1',
    [id, usuarioId]
  )

  if ((rows as any[]).length === 0) throw new AppError('Consulta não encontrada', 404)

  const consulta = (rows as any[])[0]
  if (['CONCLUIDA', 'CANCELADA'].includes(consulta.status)) {
    throw new AppError('Esta consulta não pode ser cancelada', 400)
  }

  await pool.query(
    "UPDATE consultas SET status = 'CANCELADA' WHERE id = ?",
    [id]
  )

  return { id, status: 'CANCELADA' }
}
