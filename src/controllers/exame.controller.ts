import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as exameService from '../services/exame.service'

const agendarSchema = z.object({
  unidadeId:    z.string().uuid(),
  consultaId:   z.string().uuid().optional(),
  tipo:         z.string().min(2),
  dataAgendada: z.string().datetime(),
})

export async function listar(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await exameService.listarExames(req.usuarioId))
  } catch (err) { next(err) }
}

export async function buscar(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await exameService.buscarExame(req.params.id, req.usuarioId))
  } catch (err) { next(err) }
}

export async function agendar(req: Request, res: Response, next: NextFunction) {
  try {
    const data = agendarSchema.parse(req.body)
    const exame = await exameService.agendarExame({
      usuarioId:    req.usuarioId,
      unidadeId:    data.unidadeId,
      consultaId:   data.consultaId,
      tipo:         data.tipo,
      dataAgendada: new Date(data.dataAgendada),
    })
    res.status(201).json(exame)
  } catch (err) { next(err) }
}
