import { v4 as uuid } from 'uuid'
import pool from '../db/pool'
import { AppError } from '../utils/AppError'

export async function buscarProntuariosDoUsuario(usuarioId: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT
       p.id, p.descricao, p.diagnostico, p.cid10, p.encaminhamento, p.criado_em,
       pr.nome AS profissional_nome, pr.especialidade, pr.cargo,
       u.nome AS unidade_nome, u.cidade
     FROM prontuarios p
     JOIN profissionais pr ON pr.id = p.profissional_id
     LEFT JOIN consultas c  ON c.id  = p.consulta_id
     LEFT JOIN unidades_saude u ON u.id = c.unidade_id
     WHERE p.usuario_id = ?
     ORDER BY p.criado_em DESC`,
    [usuarioId]
  )
  return rows
}

export async function criarProntuario(data: {
  usuarioId: string
  profissionalId: string
  consultaId?: string
  descricao: string
  diagnostico?: string
  cid10?: string
  encaminhamento?: string
}) {
  if (data.consultaId) {
    const [consulta] = await pool.query<any[]>(
      'SELECT id FROM consultas WHERE id = ? AND profissional_id = ? LIMIT 1',
      [data.consultaId, data.profissionalId]
    )
    if ((consulta as any[]).length === 0) {
      throw new AppError('Consulta não encontrada ou não pertence a este profissional', 403)
    }
  }

  const id = uuid()

  await pool.query(
    `INSERT INTO prontuarios (id, usuario_id, profissional_id, consulta_id, descricao, diagnostico, cid10, encaminhamento)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.usuarioId,
      data.profissionalId,
      data.consultaId ?? null,
      data.descricao,
      data.diagnostico ?? null,
      data.cid10 ?? null,
      data.encaminhamento ?? null,
    ]
  )

  return { id, ...data }
}

export async function buscarHistoricoCompleto(usuarioId: string, profissionalId: string) {
  const [usuario] = await pool.query<any[]>(
    'SELECT id, nome, sobrenome, cpf, email, criado_em FROM usuarios WHERE id = ? LIMIT 1',
    [usuarioId]
  )

  if ((usuario as any[]).length === 0) throw new AppError('Paciente não encontrado', 404)

  const [consultas] = await pool.query<any[]>(
    `SELECT
       c.id, c.data_hora, c.status, c.observacoes, c.anotacoes_medico,
       pr.nome AS profissional_nome, pr.especialidade,
       u.nome AS unidade_nome, u.cidade, u.tipo
     FROM consultas c
     LEFT JOIN profissionais pr ON pr.id = c.profissional_id
     LEFT JOIN unidades_saude u ON u.id  = c.unidade_id
     WHERE c.usuario_id = ?
     ORDER BY c.data_hora DESC`,
    [usuarioId]
  )

  const [exames] = await pool.query<any[]>(
    `SELECT
       e.id, e.tipo, e.data_agendada, e.data_resultado, e.status, e.resultado, e.laudo,
       u.nome AS unidade_nome, u.cidade
     FROM exames e
     LEFT JOIN unidades_saude u ON u.id = e.unidade_id
     WHERE e.usuario_id = ?
     ORDER BY e.data_agendada DESC`,
    [usuarioId]
  )

  const [prontuarios] = await pool.query<any[]>(
    `SELECT
       p.id, p.descricao, p.diagnostico, p.cid10, p.encaminhamento, p.criado_em,
       pr.nome AS profissional_nome, pr.especialidade
     FROM prontuarios p
     JOIN profissionais pr ON pr.id = p.profissional_id
     WHERE p.usuario_id = ?
     ORDER BY p.criado_em DESC`,
    [usuarioId]
  )

  return {
    paciente: (usuario as any[])[0],
    consultas,
    exames,
    prontuarios,
  }
}
