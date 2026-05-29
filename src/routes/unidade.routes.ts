import { Router } from 'express'
import { listar, buscar } from '../controllers/unidade.controller'

export const unidadeRoutes = Router()
unidadeRoutes.get('/',    listar)
unidadeRoutes.get('/:id', buscar)
