import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as consultaService from '../services/consulta.service'

const agendarSchema = z.object({
  profissionalId: z.string().uuid(),
  unidadeId:      z.string().uuid(),
  dataHora:       z.string().datetime(),
  observacoes:    z.string().optional(),
})

const statusSchema = z.object({
  status: z.enum(['AGENDADA','CONFIRMADA','EM_ANDAMENTO','CONCLUIDA','CANCELADA','FALTA']),
})

/* ── Paciente ── */

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
      usuarioId:      req.usuarioId,
      profissionalId: data.profissionalId,
      unidadeId:      data.unidadeId,
      dataHora:       new Date(data.dataHora),
      observacoes:    data.observacoes,
    })
    res.status(201).json(consulta)
  } catch (err) { next(err) }
}

export async function cancelar(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await consultaService.cancelarConsulta(req.params.id, req.usuarioId))
  } catch (err) { next(err) }
}

/* ── Profissional ── */

export async function listarProfissional(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await consultaService.listarConsultasProfissional(req.profissionalId))
  } catch (err) { next(err) }
}

export async function atualizarStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = statusSchema.parse(req.body)
    res.json(await consultaService.atualizarStatusConsulta(req.params.id, req.profissionalId, status))
  } catch (err) { next(err) }
}
