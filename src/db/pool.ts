import 'dotenv/config'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://medflow:medflow123@localhost:5432/medflow',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on('error', (err) => {
  console.error('Erro inesperado no pool PostgreSQL:', err)
})

export default pool
