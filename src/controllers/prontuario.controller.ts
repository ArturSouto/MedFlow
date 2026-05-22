import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as prontuarioService from '../services/prontuario.service'

const criarSchema = z.object({
  usuarioId:     z.string().uuid(),
  consultaId:    z.string().uuid().optional(),
  descricao:     z.string().min(5),
  diagnostico:   z.string().optional(),
  cid10:         z.string().optional(),
  encaminhamento: z.string().optional(),
})

export async function listarDoUsuario(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prontuarioService.buscarProntuariosDoUsuario(req.params.usuarioId)
    res.json(rows)
  } catch (err) { next(err) }
}

export async function historicoCompleto(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await prontuarioService.buscarHistoricoCompleto(
      req.params.usuarioId,
      req.usuarioId
    )
    res.json(result)
  } catch (err) { next(err) }
}

export async function criar(req: Request, res: Response, next: NextFunction) {
  try {
    const data = criarSchema.parse(req.body)
    const result = await prontuarioService.criarProntuario({
      ...data,
      profissionalId: req.usuarioId,
    })
    res.status(201).json(result)
  } catch (err) { next(err) }
}
