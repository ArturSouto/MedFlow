import bcrypt from 'bcryptjs'
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

export async function registrar(data: RegisterInput) {
  const { rows: cpfRows } = await pool.query(
    'SELECT id FROM usuarios WHERE cpf = $1 LIMIT 1',
    [data.cpf]
  )
  if (cpfRows.length > 0) throw new AppError('CPF já cadastrado', 409)

  const { rows: emailRows } = await pool.query(
    'SELECT id FROM usuarios WHERE email = $1 LIMIT 1',
    [data.email.toLowerCase()]
  )
  if (emailRows.length > 0) throw new AppError('E-mail já cadastrado', 409)

  const senhaHash = await bcrypt.hash(data.senha, 12)

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO usuarios (nome, sobrenome, cpf, email, senha_hash)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [data.nome, data.sobrenome, data.cpf, data.email.toLowerCase(), senhaHash]
  )

  const id = rows[0].id

  return {
    usuario: {
      id,
      nome: data.nome,
      sobrenome: data.sobrenome,
      cpf: data.cpf,
      email: data.email.toLowerCase(),
    },
    token: id,
  }
}

export async function login(data: LoginInput) {
  const { rows } = await pool.query(
    `SELECT id, nome, sobrenome, cpf, email, senha_hash, criado_em
     FROM usuarios
     WHERE email = $1 AND ativo = TRUE
     LIMIT 1`,
    [data.email.toLowerCase()]
  )

  const usuario = rows[0]
  if (!usuario) throw new AppError('E-mail ou senha inválidos', 401)

  const senhaValida = await bcrypt.compare(data.senha, usuario.senha_hash)
  if (!senhaValida) throw new AppError('E-mail ou senha inválidos', 401)

  return {
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      sobrenome: usuario.sobrenome,
      cpf: usuario.cpf,
      email: usuario.email,
      criado_em: usuario.criado_em,
    },
    token: usuario.id,
  }
}
