import 'dotenv/config'
import bcrypt from 'bcryptjs'
import pool from './pool'

async function seed() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    console.log('🌱 Iniciando seed...')

    /* ── Limpar dados existentes ── */
    await client.query('DELETE FROM prontuarios')
    await client.query('DELETE FROM exames')
    await client.query('DELETE FROM consultas')
    await client.query('DELETE FROM profissionais')
    await client.query('DELETE FROM usuarios')

    /* ── Buscar unidades do migrate ── */
    const { rows: unidades } = await client.query(
      `SELECT id, nome FROM unidades_saude WHERE ativo = TRUE ORDER BY nome`
    )
    if (unidades.length === 0) throw new Error('Rode npm run db:migrate primeiro.')

    const getId = (termo: string) =>
      unidades.find(u => u.nome.toLowerCase().includes(termo.toLowerCase()))?.id ?? unidades[0].id

    const ubsBoaVista  = getId('Boa Vista')
    const ubsVilaNova  = getId('Vila Nova')
    const upa24h       = getId('Afogados')
    const hospitalRest = getId('Restauração')
    const ame          = getId('AME')
    const caps         = getId('CAPS')

    /* ── Profissionais ── */
    const senhaProf = await bcrypt.hash('medflow123', 12)

    const insProf = async (nome: string, email: string, crm: string | null, especialidade: string, cargo: string) => {
      const { rows } = await client.query(
        `INSERT INTO profissionais (nome, email, senha_hash, crm, especialidade, cargo)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [nome, email, senhaProf, crm, especialidade, cargo]
      )
      return rows[0].id as string
    }

    const pCarlos  = await insProf('Dr. Carlos Eduardo Mendonça',  'carlos.mendonca@medflow.com',      'CRM/PE-12345', 'Cardiologia',   'Médico')
    const pAna     = await insProf('Dra. Ana Paula Ferreira',      'ana.ferreira@medflow.com',         'CRM/PE-23456', 'Clínica Geral', 'Médico')
    const pRicardo = await insProf('Dr. Ricardo Albuquerque',      'ricardo.albuquerque@medflow.com',  'CRM/PE-34567', 'Pediatria',     'Médico')
    const pJuliana = await insProf('Dra. Juliana Cavalcanti',      'juliana.cavalcanti@medflow.com',   'CRM/PE-45678', 'Ginecologia',   'Médico')
    const pFabio   = await insProf('Dr. Fábio Nascimento',         'fabio.nascimento@medflow.com',     'CRM/PE-56789', 'Ortopedia',     'Médico')
    const pMariana = await insProf('Enf. Mariana Costa',           'mariana.costa@medflow.com',        null,           'Enfermagem',    'Enfermeiro')

    console.log('✅ 6 profissionais criados')

    /* ── Pacientes ── */
    const senhaUser = await bcrypt.hash('senha123', 12)

    const insPac = async (nome: string, sobrenome: string, cpf: string, email: string) => {
      const { rows } = await client.query(
        `INSERT INTO usuarios (nome, sobrenome, cpf, email, senha_hash)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [nome, sobrenome, cpf, email, senhaUser]
      )
      return rows[0].id as string
    }

    const uMaria    = await insPac('Maria',    'Silva Santos',     '12345678901', 'maria.silva@email.com')
    const uJoao     = await insPac('João',     'Oliveira Lima',    '23456789012', 'joao.oliveira@email.com')
    const uAna      = await insPac('Ana',      'Costa Ferreira',   '34567890123', 'ana.costa@email.com')
    const uPedro    = await insPac('Pedro',    'Souza Almeida',    '45678901234', 'pedro.souza@email.com')
    const uFernanda = await insPac('Fernanda', 'Rodrigues Mendes', '56789012345', 'fernanda.rodrigues@email.com')
    const uLucas    = await insPac('Lucas',    'Pereira Barbosa',  '67890123456', 'lucas.pereira@email.com')
    const uBeatriz  = await insPac('Beatriz',  'Gomes Araújo',     '78901234567', 'beatriz.gomes@email.com')
    const uCarlos   = await insPac('Carlos',   'Martins Carvalho', '89012345678', 'carlos.martins@email.com')

    console.log('✅ 8 pacientes criados')

    /* ── Helper de data ── */
    const d = (offsetDays: number, hour = 9, min = 0) => {
      const dt = new Date()
      dt.setDate(dt.getDate() + offsetDays)
      dt.setHours(hour, min, 0, 0)
      return dt.toISOString()
    }

    /* ── Consultas ── */
    const insConsulta = async (
      usuarioId: string, profId: string, unidadeId: string,
      dataHora: string, status: string, obs: string | null, anotacoes: string | null
    ) => {
      const { rows } = await client.query(
        `INSERT INTO consultas (usuario_id, profissional_id, unidade_id, data_hora, status, observacoes, anotacoes_medico)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [usuarioId, profId, unidadeId, dataHora, status, obs, anotacoes]
      )
      return rows[0].id as string
    }

    const c1  = await insConsulta(uMaria,    pCarlos,  ubsBoaVista,  d(-30, 9,  0),  'CONCLUIDA',    'Dor no peito ao fazer esforço físico',    'Paciente com histórico de hipertensão. PA 140/90. Solicitado ECG e Holter.')
    const c2  = await insConsulta(uJoao,     pAna,     upa24h,       d(-25, 10, 30), 'CONCLUIDA',    'Tosse persistente há 2 semanas',           'Quadro de IVAS. Prescrito amoxicilina 500mg por 7 dias.')
    const c3  = await insConsulta(uAna,      pRicardo, ubsBoaVista,  d(-20, 8,  0),  'CONCLUIDA',    'Rotina pediátrica anual',                  'Desenvolvimento adequado. Vacinas em dia.')
    const c4  = await insConsulta(uPedro,    pFabio,   hospitalRest, d(-18, 14, 0),  'CONCLUIDA',    'Dor lombar crônica',                       'Lombalgia mecânica. Fisioterapia 2x semana.')
    const c5  = await insConsulta(uFernanda, pAna,     upa24h,       d(-15, 11, 0),  'CONCLUIDA',    'Check-up preventivo anual',                'Exames normais. Orientado sobre dieta e exercícios.')
    const c6  = await insConsulta(uLucas,    pJuliana, ubsVilaNova,  d(-10, 9,  30), 'CANCELADA',    'Consulta ginecológica de rotina',          null)
    const c7  = await insConsulta(uMaria,    pAna,     upa24h,       d(-5,  16, 0),  'CONCLUIDA',    'Retorno cardiológico',                     'Holter normal. Manter medicação. Retorno em 6 meses.')
    const c8  = await insConsulta(uJoao,     pCarlos,  ubsBoaVista,  d(1,   9,  0),  'CONFIRMADA',   'Consulta de rotina',                       null)
    const c9  = await insConsulta(uBeatriz,  pAna,     upa24h,       d(2,   10, 0),  'AGENDADA',     'Dores de cabeça frequentes',               null)
    const c10 = await insConsulta(uCarlos,   pRicardo, ubsBoaVista,  d(3,   8,  30), 'AGENDADA',     'Febre recorrente na criança',              null)
    const c11 = await insConsulta(uAna,      pFabio,   hospitalRest, d(4,   14, 0),  'AGENDADA',     'Retorno ortopédico',                       null)
    const c12 = await insConsulta(uPedro,    pJuliana, ubsVilaNova,  d(5,   9,  0),  'AGENDADA',     'Consulta ginecológica',                    null)
    const c13 = await insConsulta(uFernanda, pFabio,   ame,          d(6,   11, 0),  'AGENDADA',     'Dor nos joelhos há 3 meses',               null)
    const c14 = await insConsulta(uLucas,    pCarlos,  ubsBoaVista,  d(7,   15, 0),  'AGENDADA',     'Palpitações frequentes',                   null)
    const c15 = await insConsulta(uMaria,    pCarlos,  ubsBoaVista,  d(0,   10, 0),  'EM_ANDAMENTO', 'Reavaliação cardíaca',                     null)

    console.log('✅ 15 consultas criadas')

    /* ── Exames ── */
    const insExame = async (
      usuarioId: string, consultaId: string | null, unidadeId: string,
      tipo: string, dataAgendada: string, dataResultado: string | null,
      status: string, resultado: string | null, laudo: string | null
    ) => {
      await client.query(
        `INSERT INTO exames (usuario_id, consulta_id, unidade_id, tipo, data_agendada, data_resultado, status, resultado, laudo)
         VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7, $8, $9)`,
        [usuarioId, consultaId, unidadeId, tipo, dataAgendada, dataResultado, status, resultado, laudo]
      )
    }

    await insExame(uMaria,    c1,   ubsBoaVista,  'Hemograma Completo',          d(-30), d(-28), 'PRONTO',     'Hemoglobina 13.2 g/dL, Leucócitos 7.200/mm³. Valores normais.', 'Sem alterações significativas.')
    await insExame(uMaria,    c1,   ubsBoaVista,  'Eletrocardiograma (ECG)',     d(-30), d(-28), 'PRONTO',     'Ritmo sinusal, FC 72 bpm. Sem alterações isquêmicas.',          'ECG dentro dos parâmetros normais.')
    await insExame(uJoao,     c2,   upa24h,       'Raio-X de Tórax',            d(-25), d(-23), 'PRONTO',     'Campos pulmonares livres. Sem consolidações.',                  'Sem alterações radiológicas.')
    await insExame(uPedro,    c4,   hospitalRest, 'Ressonância Magnética Lombar',d(-18), null,   'EM_ANALISE', null,                                                            null)
    await insExame(uFernanda, c5,   upa24h,       'Colesterol Total e Frações',  d(-15), d(-13), 'PRONTO',     'Colesterol Total 198 mg/dL, LDL 120, HDL 52, TG 130.',         'Perfil lipídico dentro dos limites desejáveis.')
    await insExame(uAna,      c3,   ubsBoaVista,  'Ultrassonografia Abdominal',  d(-10), null,   'COLETADO',   null,                                                            null)
    await insExame(uLucas,    null, upa24h,       'Glicemia em Jejum',           d(2),   null,   'AGENDADO',   null,                                                            null)
    await insExame(uBeatriz,  null, ubsBoaVista,  'TSH e T4 Livre',              d(3),   null,   'AGENDADO',   null,                                                            null)
    await insExame(uCarlos,   null, ubsVilaNova,  'Urina Tipo I (EAS)',          d(3),   null,   'AGENDADO',   null,                                                            null)
    await insExame(uMaria,    null, ubsBoaVista,  'Holter 24 horas',             d(7),   null,   'AGENDADO',   null,                                                            null)

    console.log('✅ 10 exames criados')

    /* ── Prontuários ── */
    const insPront = async (
      usuarioId: string, profId: string, consultaId: string,
      descricao: string, diagnostico: string, cid10: string, encaminhamento: string | null
    ) => {
      await client.query(
        `INSERT INTO prontuarios (usuario_id, profissional_id, consulta_id, descricao, diagnostico, cid10, encaminhamento)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [usuarioId, profId, consultaId, descricao, diagnostico, cid10, encaminhamento]
      )
    }

    await insPront(uMaria,    pCarlos, c1, 'Paciente de 45 anos com dor precordial aos esforços há 3 meses. Dispneia progressiva. PA 140/90 mmHg, FC 78 bpm. Ausculta cardíaca normal.', 'Hipertensão arterial — suspeita de angina estável', 'I10', 'Solicitado ECG e Holter 24h. Retorno em 30 dias.')
    await insPront(uJoao,     pAna,    c2, 'Paciente de 32 anos com tosse seca há 15 dias, febre baixa e coriza. Ausculta pulmonar limpa. Orofaringe hiperemiada.', 'Infecção de vias aéreas superiores (IVAS)', 'J06.9', null)
    await insPront(uAna,      pRicardo,c3, 'Criança de 8 anos em consulta de rotina. Desenvolvimento neuropsicomotor adequado. Vacinas atualizadas.', 'Consulta de rotina — sem alterações', 'Z00.1', null)
    await insPront(uPedro,    pFabio,  c4, 'Paciente de 55 anos com lombalgia crônica há 2 anos, piora ao esforço. Lasègue negativo. Força e sensibilidade preservadas.', 'Lombalgia mecânica inespecífica', 'M54.5', 'Fisioterapia 2x por semana por 30 dias.')
    await insPront(uFernanda, pAna,    c5, 'Paciente de 38 anos em check-up anual. Nega comorbidades. Exames laboratoriais normais. Orientada sobre alimentação e atividade física.', 'Consulta preventiva — sem alterações', 'Z00.0', null)
    await insPront(uMaria,    pAna,    c7, 'Retorno após Holter 24h. Sem arritmias significativas. PA controlada. Paciente assintomática. Mantida medicação anti-hipertensiva.', 'Hipertensão arterial sistêmica controlada', 'I10', null)

    console.log('✅ 6 prontuários criados')

    await client.query('COMMIT')

    console.log('\n🎉 Seed concluído!\n')
    console.log('👤 Pacientes — login em login.html (senha: senha123):')
    console.log('   maria.silva@email.com')
    console.log('   joao.oliveira@email.com')
    console.log('   ana.costa@email.com')
    console.log('   pedro.souza@email.com')
    console.log('   fernanda.rodrigues@email.com')
    console.log('\n🩺 Profissionais — login em login-profissional.html (senha: medflow123):')
    console.log('   carlos.mendonca@medflow.com   (Cardiologia)')
    console.log('   ana.ferreira@medflow.com      (Clínica Geral)')
    console.log('   ricardo.albuquerque@medflow.com (Pediatria)')
    console.log('   juliana.cavalcanti@medflow.com (Ginecologia)')
    console.log('   fabio.nascimento@medflow.com  (Ortopedia)')

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Erro no seed:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
