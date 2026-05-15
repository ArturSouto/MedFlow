import { Router } from 'express'
import { autenticar } from '../middlewares/autenticar'
import { listar, buscar, agendar, cancelar } from '../controllers/consulta.controller'

export const consultaRoutes = Router()
consultaRoutes.use(autenticar)
consultaRoutes.get('/', listar)
consultaRoutes.get('/:id', buscar)
consultaRoutes.post('/', agendar)
consultaRoutes.patch('/:id/cancelar', cancelar)
