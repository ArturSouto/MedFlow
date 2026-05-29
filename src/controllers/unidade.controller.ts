import { Request, Response, NextFunction } from 'express'
import * as unidadeService from '../services/unidade.service'

export async function listar(req: Request, res: Response, next: NextFunction) {
  try {
    const tipo = req.query.tipo as string | undefined
    res.json(await unidadeService.listarUnidades(tipo))
  } catch (err) { next(err) }
}

export async function buscar(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await unidadeService.buscarUnidade(req.params.id))
  } catch (err) { next(err) }
}
