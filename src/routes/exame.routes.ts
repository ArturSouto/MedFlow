import { Router } from 'express'
import { autenticar } from '../middlewares/autenticar'
import { listar, buscar, agendar } from '../controllers/exame.controller'

export const exameRoutes = Router()
exameRoutes.use(autenticar)
exameRoutes.get('/',    listar)
exameRoutes.get('/:id', buscar)
exameRoutes.post('/',   agendar)
