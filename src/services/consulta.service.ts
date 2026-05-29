import pool from '../db/pool'
import { AppError } from '../utils/AppError'

/* ── Paciente ── */

export async function listarConsultas(usuarioId: string) {
  const { rows } = await pool.query(
    `SELECT
       c.id, c.data_hora, c.status, c.observacoes, c.criado_em,
       p.nome AS profissional_nome, p.especialidade,
       u.nome AS unidade_nome, u.cidade, u.tipo
     FROM consultas c
     LEFT JOIN profissionais p ON p.id = c.profissional_id
     LEFT JOIN unidades_saude u ON u.id = c.unidade_id
     WHERE c.usuario_id = $1
     ORDER BY c.data_hora DESC`,
    [usuarioId]
  )
  return rows
}

export async function buscarConsulta(id: string, usuarioId: string) {
  const { rows } = await pool.query(
    `SELECT
       c.id, c.data_hora, c.status, c.observacoes, c.anotacoes_medico, c.criado_em,
       p.nome AS profissional_nome, p.especialidade, p.crm,
       u.nome AS unidade_nome, u.endereco, u.cidade, u.estado, u.tipo, u.telefone
     FROM consultas c
     LEFT JOIN profissionais p ON p.id = c.profissional_id
     LEFT JOIN unidades_saude u ON u.id = c.unidade_id
     WHERE c.id = $1 AND c.usuario_id = $2
     LIMIT 1`,
    [id, usuarioId]
  )
  if (rows.length === 0) throw new AppError('Consulta não encontrada', 404)

  const { rows: exames } = await pool.query(
    'SELECT id, tipo, data_agendada, status FROM exames WHERE consulta_id = $1',
    [id]
  )

  return { ...rows[0], exames }
}

export async function agendarConsulta(data: {
  usuarioId: string
  profissionalId: string
  unidadeId: string
  dataHora: Date
  observacoes?: string
}) {
  const { rows: conflito } = await pool.query(
    `SELECT id FROM consultas
     WHERE usuario_id = $1 AND data_hora = $2
       AND status NOT IN ('CANCELADA','FALTA')
     LIMIT 1`,
    [data.usuarioId, data.dataHora]
  )
  if (conflito.length > 0) throw new AppError('Você já tem uma consulta neste horário', 409)

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO consultas (usuario_id, profissional_id, unidade_id, data_hora, observacoes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [data.usuarioId, data.profissionalId, data.unidadeId, data.dataHora, data.observacoes ?? null]
  )

  const id = rows[0].id

  const { rows: resultado } = await pool.query(
    `SELECT
       c.id, c.data_hora, c.status, c.observacoes,
       p.nome AS profissional_nome, p.especialidade,
       u.nome AS unidade_nome, u.cidade
     FROM consultas c
     LEFT JOIN profissionais p ON p.id = c.profissional_id
     LEFT JOIN unidades_saude u ON u.id = c.unidade_id
     WHERE c.id = $1`,
    [id]
  )
  return resultado[0]
}

export async function cancelarConsulta(id: string, usuarioId: string) {
  const { rows } = await pool.query(
    'SELECT id, status FROM consultas WHERE id = $1 AND usuario_id = $2 LIMIT 1',
    [id, usuarioId]
  )
  if (rows.length === 0) throw new AppError('Consulta não encontrada', 404)

  if (['CONCLUIDA', 'CANCELADA'].includes(rows[0].status)) {
    throw new AppError('Esta consulta não pode ser cancelada', 400)
  }

  await pool.query(
    "UPDATE consultas SET status = 'CANCELADA' WHERE id = $1",
    [id]
  )

  return { id, status: 'CANCELADA' }
}

/* ── Profissional ── */

export async function listarConsultasProfissional(profissionalId: string) {
  const { rows } = await pool.query(
    `SELECT
       c.id, c.data_hora, c.status, c.observacoes, c.anotacoes_medico, c.criado_em,
       CONCAT(us.nome, ' ', us.sobrenome) AS paciente_nome,
       us.cpf AS paciente_cpf,
       us.id  AS usuario_id,
       un.nome AS unidade_nome, un.cidade, un.tipo
     FROM consultas c
     JOIN usuarios us ON us.id = c.usuario_id
     LEFT JOIN unidades_saude un ON un.id = c.unidade_id
     WHERE c.profissional_id = $1
     ORDER BY c.data_hora DESC`,
    [profissionalId]
  )
  return rows
}

export async function atualizarStatusConsulta(
  id: string,
  profissionalId: string,
  status: string
) {
  const VALIDOS = ['AGENDADA', 'CONFIRMADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'FALTA']
  if (!VALIDOS.includes(status)) throw new AppError('Status inválido', 400)

  const { rows } = await pool.query(
    'SELECT id FROM consultas WHERE id = $1 AND profissional_id = $2 LIMIT 1',
    [id, profissionalId]
  )
  if (rows.length === 0) throw new AppError('Consulta não encontrada', 404)

  const { rows: updated } = await pool.query(
    `UPDATE consultas SET status = $1 WHERE id = $2
     RETURNING id, status`,
    [status, id]
  )
  return updated[0]
}

export async function atualizarAnotacoes(
  id: string,
  profissionalId: string,
  anotacoes: string
) {
  const { rows } = await pool.query(
    'SELECT id FROM consultas WHERE id = $1 AND profissional_id = $2 LIMIT 1',
    [id, profissionalId]
  )
  if (rows.length === 0) throw new AppError('Consulta não encontrada', 404)

  const { rows: updated } = await pool.query(
    'UPDATE consultas SET anotacoes_medico = $1 WHERE id = $2 RETURNING id',
    [anotacoes, id]
  )
  return updated[0]
}
