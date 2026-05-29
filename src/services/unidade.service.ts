import pool from '../db/pool'
import { AppError } from '../utils/AppError'

export async function listarUnidades(tipo?: string) {
  const params: string[] = []
  let sql = `SELECT id, nome, endereco, cidade, estado, telefone, tipo
             FROM unidades_saude
             WHERE ativo = TRUE`

  if (tipo) {
    params.push(tipo.toUpperCase())
    sql += ` AND tipo = $1`
  }

  sql += ' ORDER BY nome'

  const { rows } = await pool.query(sql, params)
  return rows
}

export async function buscarUnidade(id: string) {
  const { rows } = await pool.query(
    `SELECT id, nome, endereco, cidade, estado, telefone, tipo
     FROM unidades_saude
     WHERE id = $1 AND ativo = TRUE
     LIMIT 1`,
    [id]
  )
  if (rows.length === 0) throw new AppError('Unidade não encontrada', 404)
  return rows[0]
}
