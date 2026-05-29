import bcrypt from 'bcryptjs'
import pool from '../db/pool'
import { AppError } from '../utils/AppError'

interface LoginProfissionalInput {
  tipo: 'crm' | 'email'
  identificador: string
  senha: string
}

interface RegisterProfissionalInput {
  nome: string
  email: string
  senha: string
  crm?: string
  matricula?: string
  especialidade?: string
  cargo?: string
}

export async function registrarProfissional(data: RegisterProfissionalInput) {
  const { rows: existing } = await pool.query(
    'SELECT id FROM profissionais WHERE email = $1 LIMIT 1',
    [data.email.toLowerCase()]
  )
  if (existing.length > 0) throw new AppError('E-mail já cadastrado', 409)

  if (data.crm) {
    const { rows: crmExists } = await pool.query(
      'SELECT id FROM profissionais WHERE crm = $1 LIMIT 1',
      [data.crm]
    )
    if (crmExists.length > 0) throw new AppError('CRM já cadastrado', 409)
  }

  const senhaHash = await bcrypt.hash(data.senha, 12)

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO profissionais (nome, email, senha_hash, crm, matricula, especialidade, cargo)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      data.nome,
      data.email.toLowerCase(),
      senhaHash,
      data.crm ?? null,
      data.matricula ?? null,
      data.especialidade ?? null,
      data.cargo ?? 'Médico',
    ]
  )

  const id = rows[0].id

  return {
    profissional: {
      id,
      nome: data.nome,
      email: data.email.toLowerCase(),
      crm: data.crm ?? null,
      cargo: data.cargo ?? 'Médico',
    },
    token: id,
  }
}

export async function loginProfissional(data: LoginProfissionalInput) {
  let rows: any[]

  if (data.tipo === 'crm') {
    const normalized = data.identificador.replace(/\s/g, '').toUpperCase()
    const result = await pool.query(
      `SELECT * FROM profissionais
       WHERE (crm = $1 OR matricula = $1) AND ativo = TRUE
       LIMIT 1`,
      [normalized]
    )
    rows = result.rows
  } else {
    const result = await pool.query(
      'SELECT * FROM profissionais WHERE email = $1 AND ativo = TRUE LIMIT 1',
      [data.identificador.toLowerCase()]
    )
    rows = result.rows
  }

  const prof = rows[0]
  if (!prof) throw new AppError('Credenciais inválidas ou não autorizadas', 401)

  const senhaValida = await bcrypt.compare(data.senha, prof.senha_hash)
  if (!senhaValida) throw new AppError('Credenciais inválidas ou não autorizadas', 401)

  return {
    profissional: {
      id: prof.id,
      nome: prof.nome,
      email: prof.email,
      crm: prof.crm,
      matricula: prof.matricula,
      especialidade: prof.especialidade,
      cargo: prof.cargo,
    },
    token: prof.id,
  }
}

export async function getMeById(profissionalId: string) {
  const { rows } = await pool.query(
    `SELECT
       p.id, p.nome, p.email, p.crm, p.matricula, p.especialidade, p.cargo, p.criado_em,
       (SELECT COUNT(*) FROM prontuarios WHERE profissional_id = $1)::int AS total_prontuarios,
       (SELECT COUNT(*) FROM consultas   WHERE profissional_id = $1)::int AS total_consultas
     FROM profissionais p
     WHERE p.id = $1
     LIMIT 1`,
    [profissionalId]
  )
  if (rows.length === 0) throw new AppError('Profissional não encontrado', 404)
  return rows[0]
}

export async function listarPorEspecialidade(especialidade?: string) {
  const params: string[] = []
  let sql = `SELECT id, nome, crm, matricula, especialidade, cargo
             FROM profissionais
             WHERE ativo = TRUE`

  if (especialidade) {
    params.push(`%${especialidade}%`)
    sql += ` AND especialidade ILIKE $1`
  }

  sql += ' ORDER BY nome'

  const { rows } = await pool.query(sql, params)
  return rows
}
