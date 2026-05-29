import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { authRoutes }            from './routes/auth.routes'
import { consultaRoutes }        from './routes/consulta.routes'
import { exameRoutes }           from './routes/exame.routes'
import { usuarioRoutes }         from './routes/usuario.routes'
import { profissionalAuthRoutes, profissionaisRoutes } from './routes/profissional.routes'
import { prontuarioRoutes }      from './routes/prontuario.routes'
import { unidadeRoutes }         from './routes/unidade.routes'
import { errorHandler }          from './middlewares/errorHandler'

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL ?? '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'MedFlow API', timestamp: new Date().toISOString() })
})

app.use('/auth',              authRoutes)
app.use('/auth/profissional', profissionalAuthRoutes)
app.use('/usuarios',          usuarioRoutes)
app.use('/consultas',         consultaRoutes)
app.use('/exames',            exameRoutes)
app.use('/prontuarios',       prontuarioRoutes)
app.use('/unidades',          unidadeRoutes)
app.use('/profissionais',     profissionaisRoutes)

app.use(errorHandler)

export default app
