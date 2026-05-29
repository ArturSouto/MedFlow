import { Router } from 'express'
import { autenticar } from '../middlewares/autenticar'
import { autenticarProfissional } from '../middlewares/autenticarProfissional'
import {
  listarDoUsuario,
  historicoCompleto,
  buscarPacientePorCPF,
  listarMeus,
  criar,
} from '../controllers/prontuario.controller'

export const prontuarioRoutes = Router()

/* Profissional: buscar paciente por CPF */
prontuarioRoutes.get('/buscar-paciente',              autenticarProfissional, buscarPacientePorCPF)

/* Profissional: seus próprios prontuários */
prontuarioRoutes.get('/profissional/meus',            autenticarProfissional, listarMeus)

/* Profissional: histórico completo do paciente por ID */
prontuarioRoutes.get('/paciente/:usuarioId/historico', autenticarProfissional, historicoCompleto)

/* Paciente: ver seus prontuários */
prontuarioRoutes.get('/paciente/:usuarioId',          autenticar, listarDoUsuario)

/* Profissional: criar prontuário */
prontuarioRoutes.post('/',                            autenticarProfissional, criar)
