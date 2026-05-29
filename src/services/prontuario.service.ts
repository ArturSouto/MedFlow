import pool from '../db/pool'
import { AppError } from '../utils/AppError'

export async function buscarProntuariosDoUsuario(usuarioId: string) {
  const { rows } = await pool.query(
    `SELECT
       p.id, p.descricao, p.diagnostico, p.cid10, p.encaminhamento, p.criado_em,
       pr.nome AS profissional_nome, pr.especialidade, pr.cargo,
       u.nome AS unidade_nome, u.cidade
     FROM prontuarios p
     JOIN profissionais pr ON pr.id = p.profissional_id
     LEFT JOIN consultas c     ON c.id = p.consulta_id
     LEFT JOIN unidades_saude u ON u.id = c.unidade_id
     WHERE p.usuario_id = $1
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
    const { rows } = await pool.query(
      'SELECT id FROM consultas WHERE id = $1 AND profissional_id = $2 LIMIT 1',
      [data.consultaId, data.profissionalId]
    )
    if (rows.length === 0) {
      throw new AppError('Consulta não encontrada ou não pertence a este profissional', 403)
    }
  }

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO prontuarios
       (usuario_id, profissional_id, consulta_id, descricao, diagnostico, cid10, encaminhamento)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      data.usuarioId,
      data.profissionalId,
      data.consultaId ?? null,
      data.descricao,
      data.diagnostico ?? null,
      data.cid10 ?? null,
      data.encaminhamento ?? null,
    ]
  )

  return { id: rows[0].id, ...data }
}

export async function buscarHistoricoCompleto(usuarioId: string) {
  const { rows: usuarios } = await pool.query(
    'SELECT id, nome, sobrenome, cpf, email, criado_em FROM usuarios WHERE id = $1 LIMIT 1',
    [usuarioId]
  )
  if (usuarios.length === 0) throw new AppError('Paciente não encontrado', 404)

  const { rows: consultas } = await pool.query(
    `SELECT
       c.id, c.data_hora, c.status, c.observacoes, c.anotacoes_medico,
       pr.nome AS profissional_nome, pr.especialidade,
       u.nome AS unidade_nome, u.cidade, u.tipo
     FROM consultas c
     LEFT JOIN profissionais pr ON pr.id = c.profissional_id
     LEFT JOIN unidades_saude u ON u.id = c.unidade_id
     WHERE c.usuario_id = $1
     ORDER BY c.data_hora DESC`,
    [usuarioId]
  )

  const { rows: exames } = await pool.query(
    `SELECT
       e.id, e.tipo, e.data_agendada, e.data_resultado, e.status, e.resultado, e.laudo,
       u.nome AS unidade_nome, u.cidade
     FROM exames e
     LEFT JOIN unidades_saude u ON u.id = e.unidade_id
     WHERE e.usuario_id = $1
     ORDER BY e.data_agendada DESC`,
    [usuarioId]
  )

  const { rows: prontuarios } = await pool.query(
    `SELECT
       p.id, p.descricao, p.diagnostico, p.cid10, p.encaminhamento, p.criado_em,
       pr.nome AS profissional_nome, pr.especialidade
     FROM prontuarios p
     JOIN profissionais pr ON pr.id = p.profissional_id
     WHERE p.usuario_id = $1
     ORDER BY p.criado_em DESC`,
    [usuarioId]
  )

  return { paciente: usuarios[0], consultas, exames, prontuarios }
}

/* Busca paciente pelo CPF — usado pelo médico */
export async function buscarPacientePorCPF(cpf: string) {
  const { rows: usuarios } = await pool.query(
    'SELECT id, nome, sobrenome, cpf, email, criado_em FROM usuarios WHERE cpf = $1 LIMIT 1',
    [cpf]
  )
  if (usuarios.length === 0) throw new AppError('Paciente não encontrado', 404)

  return buscarHistoricoCompleto(usuarios[0].id)
}

/* Lista prontuários registrados pelo próprio profissional */
export async function listarMeusProntuarios(profissionalId: string) {
  const { rows } = await pool.query(
    `SELECT
       p.id, p.descricao, p.diagnostico, p.cid10, p.criado_em,
       us.nome AS paciente_nome, us.sobrenome AS paciente_sobrenome,
       us.cpf  AS paciente_cpf
     FROM prontuarios p
     JOIN usuarios us ON us.id = p.usuario_id
     WHERE p.profissional_id = $1
     ORDER BY p.criado_em DESC`,
    [profissionalId]
  )
  return rows
}
