import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import pool from '../db/pool'
import { AppError } from '../utils/AppError'

interface ProfissionalRow {
  id: string
  nome: string
  crm: string | null
  matricula: string | null
  email: string
  senha_hash: string
  especialidade: string | null
  cargo: string
  ativo: number
}

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
  const [existing] = await pool.query<any[]>(
    'SELECT id FROM profissionais WHERE email = ? LIMIT 1',
    [data.email.toLowerCase()]
  )
  if ((existing as any[]).length > 0) throw new AppError('E-mail já cadastrado', 409)

  if (data.crm) {
    const [crmExists] = await pool.query<any[]>(
      'SELECT id FROM profissionais WHERE crm = ? LIMIT 1',
      [data.crm]
    )
    if ((crmExists as any[]).length > 0) throw new AppError('CRM já cadastrado', 409)
  }

  const id = uuid()
  const senhaHash = await bcrypt.hash(data.senha, 12)

  await pool.query(
    `INSERT INTO profissionais (id, nome, email, senha_hash, crm, matricula, especialidade, cargo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.nome,
      data.email.toLowerCase(),
      senhaHash,
      data.crm ?? null,
      data.matricula ?? null,
      data.especialidade ?? null,
      data.cargo ?? 'Médico',
    ]
  )

  const token = gerarTokenProfissional(id, data.email.toLowerCase())

  return {
    profissional: {
      id,
      nome: data.nome,
      email: data.email.toLowerCase(),
      crm: data.crm ?? null,
      cargo: data.cargo ?? 'Médico',
    },
    token,
  }
}

export async function loginProfissional(data: LoginProfissionalInput) {
  let rows: any[]

  if (data.tipo === 'crm') {
    const normalized = data.identificador.replace(/\s/g, '').toUpperCase()
    const [r] = await pool.query<any[]>(
      'SELECT * FROM profissionais WHERE (crm = ? OR matricula = ?) AND ativo = 1 LIMIT 1',
      [normalized, normalized]
    )
    rows = r as any[]
  } else {
    const [r] = await pool.query<any[]>(
      'SELECT * FROM profissionais WHERE email = ? AND ativo = 1 LIMIT 1',
      [data.identificador.toLowerCase()]
    )
    rows = r as any[]
  }

  const prof = rows[0] as ProfissionalRow | undefined
  if (!prof) throw new AppError('Credenciais inválidas ou não autorizadas', 401)

  const senhaValida = await bcrypt.compare(data.senha, prof.senha_hash)
  if (!senhaValida) throw new AppError('Credenciais inválidas ou não autorizadas', 401)

  const token = gerarTokenProfissional(prof.id, prof.email)

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
    token,
  }
}

function gerarTokenProfissional(profId: string, email: string): string {
  return jwt.sign(
    { sub: profId, email, role: 'profissional' },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' } as jwt.SignOptions
  )
}
