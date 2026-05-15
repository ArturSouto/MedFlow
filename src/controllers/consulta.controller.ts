import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as consultaService from '../services/consulta.service'

const agendarSchema = z.object({
  medicoId:    z.string().uuid(),
  unidadeId:   z.string().uuid(),
  dataHora:    z.string().datetime(),
  observacoes: z.string().optional(),
})

export async function listar(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await consultaService.listarConsultas(req.usuarioId))
  } catch (err) { next(err) }
}

export async function buscar(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await consultaService.buscarConsulta(req.params.id, req.usuarioId))
  } catch (err) { next(err) }
}

export async function agendar(req: Request, res: Response, next: NextFunction) {
  try {
    const data = agendarSchema.parse(req.body)
    const consulta = await consultaService.agendarConsulta({
      usuarioId:   req.usuarioId,
      medicoId:    data.medicoId,
      unidadeId:   data.unidadeId,
      dataHora:    new Date(data.dataHora),
      observacoes: data.observacoes,
    })
    res.status(201).json(consulta)
  } catch (err) { next(err) }
}

export async function cancelar(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await consultaService.cancelarConsulta(req.params.id, req.usuarioId))
  } catch (err) { next(err) }
}
