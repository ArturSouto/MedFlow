import { Router } from 'express'
import { autenticar } from '../middlewares/autenticar'
import { listarDoUsuario, historicoCompleto, criar } from '../controllers/prontuario.controller'

export const prontuarioRoutes = Router()

prontuarioRoutes.use(autenticar)

prontuarioRoutes.get('/paciente/:usuarioId',          listarDoUsuario)
prontuarioRoutes.get('/paciente/:usuarioId/historico', historicoCompleto)
prontuarioRoutes.post('/',                             criar)
