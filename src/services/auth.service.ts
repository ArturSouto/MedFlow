import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import pool from '../db/pool'
import { AppError } from '../utils/AppError'

interface RegisterInput {
  nome: string
  sobrenome: string
  cpf: string
  email: string
  senha: string
}

interface LoginInput {
  email: string
  senha: string
}

interface UsuarioRow {
  id: string
  nome: string
  sobrenome: string
  cpf: string
  email: string
  senha_hash: string
  ativo: number
  criado_em: Date
}

export async function registrar(data: RegisterInput) {
  const [cpfRows] = await pool.query<any[]>(
    'SELECT id FROM usuarios WHERE cpf = ? LIMIT 1',
    [data.cpf]
  )
  if (cpfRows.length > 0) throw new AppError('CPF já cadastrado', 409)

  const [emailRows] = await pool.query<any[]>(
    'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
    [data.email.toLowerCase()]
  )
  if (emailRows.length > 0) throw new AppError('E-mail já cadastrado', 409)

  const id = uuid()
  const senhaHash = await bcrypt.hash(data.senha, 12)

  await pool.query(
    `INSERT INTO usuarios (id, nome, sobrenome, cpf, email, senha_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.nome, data.sobrenome, data.cpf, data.email.toLowerCase(), senhaHash]
  )

  const token = gerarToken(id, data.email.toLowerCase())

  return {
    usuario: {
      id,
      nome: data.nome,
      sobrenome: data.sobrenome,
      cpf: data.cpf,
      email: data.email.toLowerCase(),
    },
    token,
  }
}

export async function login(data: LoginInput) {
  const [rows] = await pool.query<any[]>(
    'SELECT * FROM usuarios WHERE email = ? AND ativo = 1 LIMIT 1',
    [data.email.toLowerCase()]
  )

  const usuario = rows[0] as UsuarioRow | undefined
  if (!usuario) throw new AppError('E-mail ou senha inválidos', 401)

  const senhaValida = await bcrypt.compare(data.senha, usuario.senha_hash)
  if (!senhaValida) throw new AppError('E-mail ou senha inválidos', 401)

  const token = gerarToken(usuario.id, usuario.email)

  return {
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      sobrenome: usuario.sobrenome,
      cpf: usuario.cpf,
      email: usuario.email,
      criado_em: usuario.criado_em,
    },
    token,
  }
}

function gerarToken(usuarioId: string, email: string): string {
  return jwt.sign(
    { sub: usuarioId, email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' } as jwt.SignOptions
  )
}
