import { Router } from 'express'
import { autenticar } from '../middlewares/autenticar'
import { autenticarProfissional } from '../middlewares/autenticarProfissional'
import {
  listar,
  buscar,
  agendar,
  cancelar,
  listarProfissional,
  atualizarStatus,
} from '../controllers/consulta.controller'

export const consultaRoutes = Router()

/* Rotas profissional — definidas antes de /:id para evitar conflito */
consultaRoutes.get('/profissional',        autenticarProfissional, listarProfissional)
consultaRoutes.patch('/:id/status',        autenticarProfissional, atualizarStatus)

/* Rotas paciente */
consultaRoutes.get('/',                    autenticar, listar)
consultaRoutes.get('/:id',                 autenticar, buscar)
consultaRoutes.post('/',                   autenticar, agendar)
consultaRoutes.patch('/:id/cancelar',      autenticar, cancelar)
