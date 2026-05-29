import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as prontuarioService from '../services/prontuario.service'

const criarSchema = z.object({
  usuarioId:      z.string().uuid(),
  consultaId:     z.string().uuid().optional(),
  descricao:      z.string().min(5),
  diagnostico:    z.string().optional(),
  cid10:          z.string().optional(),
  encaminhamento: z.string().optional(),
})

/* Paciente: ver seus prontuários */
export async function listarDoUsuario(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await prontuarioService.buscarProntuariosDoUsuario(req.params.usuarioId))
  } catch (err) { next(err) }
}

/* Profissional: ver histórico completo de um paciente por ID */
export async function historicoCompleto(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await prontuarioService.buscarHistoricoCompleto(req.params.usuarioId))
  } catch (err) { next(err) }
}

/* Profissional: buscar paciente por CPF */
export async function buscarPacientePorCPF(req: Request, res: Response, next: NextFunction) {
  try {
    const cpf = (req.query.cpf as string ?? '').replace(/\D/g, '')
    if (cpf.length !== 11) {
      res.status(400).json({ message: 'CPF inválido' })
      return
    }
    res.json(await prontuarioService.buscarPacientePorCPF(cpf))
  } catch (err) { next(err) }
}

/* Profissional: listar seus próprios prontuários */
export async function listarMeus(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await prontuarioService.listarMeusProntuarios(req.profissionalId))
  } catch (err) { next(err) }
}

/* Profissional: criar prontuário */
export async function criar(req: Request, res: Response, next: NextFunction) {
  try {
    const data = criarSchema.parse(req.body)
    const result = await prontuarioService.criarProntuario({
      ...data,
      profissionalId: req.profissionalId,
    })
    res.status(201).json(result)
  } catch (err) { next(err) }
}
