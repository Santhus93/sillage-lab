// ============================================================
// SILLAGE LAB - CAMADA DE DADOS (LocalStorage)
// Arquivo: src/data/db.ts
// Le e grava TODO o banco numa unica chave do LocalStorage.
// v2: rotina de manutencao (agitar / arejar) + migracao automatica
// ============================================================

import { v4 as uuid } from 'uuid';

import type {
  ISillageDB,
  IConfig,
  IPerfume,
  IFormula,
  ILote,
  IAvaliacao,
  IMateriaPrima,
  IManutencao,
  IMarcoMaceracao,
  StatusLote,
  AcaoManutencao,
  DiaSemana,
} from '../models';

import {
  MACERACAO_PADRAO,
  MARCOS_PADRAO,
  ROTINA_PADRAO,
  STORAGE_KEY,
  SCHEMA_VERSION,
} from '../models';

// ------------------------------------------------------------
// BANCO INICIAL (quando abre pela primeira vez)
// ------------------------------------------------------------
function bancoVazio(): ISillageDB {
  const agora = new Date().toISOString();
  const config: IConfig = {
    usuario: 'Rodrigo',
    senhaHash: '',            // definida no primeiro acesso
    nomeLab: 'Sillage Lab',
    subtitulo: 'Gestao de Formulas e Maceracao',
    maceracaoPadrao: { ...MACERACAO_PADRAO },
    marcosPadrao: [...MARCOS_PADRAO],
    rotina: { ...ROTINA_PADRAO, diasSemana: [...ROTINA_PADRAO.diasSemana] },
    tema: 'dark',
    moeda: 'BRL',
    versaoApp: '1.1.0',
    atualizadoEm: agora,
  };

  return {
    schemaVersion: SCHEMA_VERSION,
    config,
    materiasPrimas: [],
    perfumes: [],
    formulas: [],
    lotes: [],
    avaliacoes: [],
    manutencoes: [],
  };
}

// Garante que bancos antigos (v1) ganhem os campos novos
function migrar(db: ISillageDB): ISillageDB {
  if (!Array.isArray(db.manutencoes)) db.manutencoes = [];
  if (!db.config.rotina) {
    db.config.rotina = {
      ...ROTINA_PADRAO,
      diasSemana: [...ROTINA_PADRAO.diasSemana],
    };
  }
  db.schemaVersion = SCHEMA_VERSION;
  return db;
}

// ------------------------------------------------------------
// LEITURA / GRAVACAO BRUTA
// ------------------------------------------------------------
export function carregarDB(): ISillageDB {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const novo = bancoVazio();
    salvarDB(novo);
    return novo;
  }
  try {
    const db = migrar(JSON.parse(raw) as ISillageDB);
    return db;
  } catch {
    // se corromper, nao perde tudo: guarda copia e recomeca
    localStorage.setItem(STORAGE_KEY + '_corrompido', raw);
    const novo = bancoVazio();
    salvarDB(novo);
    return novo;
  }
}

export function salvarDB(db: ISillageDB): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// ------------------------------------------------------------
// HELPERS DE DATA / MACERACAO
// ------------------------------------------------------------
function addDias(dataISO: string, dias: number): string {
  const d = new Date(dataISO);
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

// Zera a hora para comparar apenas o DIA
function soData(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function mesmoDia(a: string | Date, b: string | Date): boolean {
  return soData(new Date(a)).getTime() === soData(new Date(b)).getTime();
}

// Gera os marcos (7, 15, 30...) a partir da data de producao
export function gerarMarcos(
  dataProducao: string,
  marcosDias: number[]
): IMarcoMaceracao[] {
  const hoje = new Date();
  return marcosDias.map((dias) => {
    const data = addDias(dataProducao, dias);
    return {
      dias,
      data,
      atingido: new Date(data) <= hoje,
    };
  });
}

// Calcula o status do lote a partir das datas (semaforo)
export function calcularStatusLote(lote: ILote): StatusLote {
  if (lote.statusManual) return lote.statusManual; // ex: "Descartado"

  const hoje = new Date();
  const fim = new Date(lote.dataPrevista);

  if (hoje >= fim) return 'Pronto para Venda';

  // atingiu ao menos o primeiro marco intermediario?
  const primeiroMarco = lote.marcos.find((m) => m.dias >= 7);
  if (primeiroMarco && new Date(primeiroMarco.data) <= hoje) {
    return 'Pronto para Teste';
  }
  return 'Macerando';
}

// Dias corridos desde a producao
export function diasDesdeProducao(dataProducao: string): number {
  const ms = soData(new Date()).getTime() - soData(new Date(dataProducao)).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// ------------------------------------------------------------
// CRUD - PERFUMES
// ------------------------------------------------------------
export function listarPerfumes(): IPerfume[] {
  return carregarDB().perfumes;
}

export function salvarPerfume(
  p: Omit<IPerfume, 'id' | 'criadoEm' | 'atualizadoEm'> & { id?: string }
): IPerfume {
  const db = carregarDB();
  const agora = new Date().toISOString();

  if (p.id) {
    const idx = db.perfumes.findIndex((x) => x.id === p.id);
    const atualizado: IPerfume = {
      ...(db.perfumes[idx]),
      ...p,
      id: p.id,
      atualizadoEm: agora,
    };
    db.perfumes[idx] = atualizado;
    salvarDB(db);
    return atualizado;
  }

  const novo: IPerfume = {
    ...p,
    id: uuid(),
    criadoEm: agora,
    atualizadoEm: agora,
  } as IPerfume;
  db.perfumes.push(novo);
  salvarDB(db);
  return novo;
}

export function excluirPerfume(id: string): void {
  const db = carregarDB();
  const lotesDoPerfume = db.lotes.filter((l) => l.perfumeId === id).map((l) => l.id);

  db.perfumes = db.perfumes.filter((p) => p.id !== id);
  db.formulas = db.formulas.filter((f) => f.perfumeId !== id);
  db.lotes = db.lotes.filter((l) => l.perfumeId !== id);
  db.avaliacoes = db.avaliacoes.filter((a) => !lotesDoPerfume.includes(a.loteId));
  db.manutencoes = db.manutencoes.filter((m) => !lotesDoPerfume.includes(m.loteId));
  salvarDB(db);
}

// ------------------------------------------------------------
// CRUD - MATERIAS-PRIMAS
// ------------------------------------------------------------
export function listarMateriasPrimas(): IMateriaPrima[] {
  return carregarDB().materiasPrimas;
}

export function salvarMateriaPrima(
  m: Omit<IMateriaPrima, 'id' | 'criadoEm' | 'atualizadoEm'> & { id?: string }
): IMateriaPrima {
  const db = carregarDB();
  const agora = new Date().toISOString();

  if (m.id) {
    const idx = db.materiasPrimas.findIndex((x) => x.id === m.id);
    const atualizado = { ...db.materiasPrimas[idx], ...m, id: m.id, atualizadoEm: agora };
    db.materiasPrimas[idx] = atualizado;
    salvarDB(db);
    return atualizado;
  }

  const novo: IMateriaPrima = {
    ...m,
    id: uuid(),
    criadoEm: agora,
    atualizadoEm: agora,
  } as IMateriaPrima;
  db.materiasPrimas.push(novo);
  salvarDB(db);
  return novo;
}

// ------------------------------------------------------------
// CRUD - FORMULAS
// ------------------------------------------------------------
export function listarFormulasDoPerfume(perfumeId: string): IFormula[] {
  return carregarDB().formulas.filter((f) => f.perfumeId === perfumeId);
}

export function formulaAtiva(perfumeId: string): IFormula | undefined {
  return carregarDB().formulas.find((f) => f.perfumeId === perfumeId && f.ativa);
}

export function salvarFormula(
  f: Omit<IFormula, 'id' | 'versao' | 'criadoEm' | 'atualizadoEm'> & { id?: string }
): IFormula {
  const db = carregarDB();
  const agora = new Date().toISOString();

  // se marcar como ativa, desativa as outras do mesmo perfume
  if (f.ativa) {
    db.formulas
      .filter((x) => x.perfumeId === f.perfumeId)
      .forEach((x) => (x.ativa = false));
  }

  if (f.id) {
    const idx = db.formulas.findIndex((x) => x.id === f.id);
    const atualizado = { ...db.formulas[idx], ...f, id: f.id, atualizadoEm: agora };
    db.formulas[idx] = atualizado;
    salvarDB(db);
    return atualizado;
  }

  // nova versao = maior versao existente + 1
  const versaoAtual = db.formulas
    .filter((x) => x.perfumeId === f.perfumeId)
    .reduce((max, x) => Math.max(max, x.versao), 0);

  const nova: IFormula = {
    ...f,
    id: uuid(),
    versao: versaoAtual + 1,
    criadoEm: agora,
    atualizadoEm: agora,
  } as IFormula;
  db.formulas.push(nova);
  salvarDB(db);
  return nova;
}

// ------------------------------------------------------------
// CRUD - LOTES
// ------------------------------------------------------------
export function listarLotes(): ILote[] {
  return carregarDB().lotes;
}

// Cria um lote ja calculando datas, marcos e codigo
export function criarLote(dados: {
  perfumeId: string;
  formulaId: string;
  volumeMl: number;
  dataProducao: string;   // ISO
  maceracaoDias: number;
  observacoes?: string;
}): ILote {
  const db = carregarDB();
  const agora = new Date().toISOString();

  const perfume = db.perfumes.find((p) => p.id === dados.perfumeId);
  const prefixo = perfume?.codigo ?? 'LOT';

  // conta quantos lotes ja existem no dia (para o sequencial)
  const dia = dados.dataProducao.slice(0, 10).replace(/-/g, '');
  const seq = db.lotes.filter((l) => l.codigo.includes(dia)).length + 1;
  const codigo = `${prefixo}-${dia}-${String(seq).padStart(3, '0')}`;

  const novo: ILote = {
    id: uuid(),
    codigo,
    perfumeId: dados.perfumeId,
    formulaId: dados.formulaId,
    volumeMl: dados.volumeMl,
    dataProducao: dados.dataProducao,
    maceracaoDias: dados.maceracaoDias,
    dataPrevista: addDias(dados.dataProducao, dados.maceracaoDias),
    marcos: gerarMarcos(dados.dataProducao, db.config.marcosPadrao),
    observacoes: dados.observacoes,
    criadoEm: agora,
    atualizadoEm: agora,
  };

  db.lotes.push(novo);
  salvarDB(db);
  return novo;
}

// ------------------------------------------------------------
// CRUD - AVALIACOES
// ------------------------------------------------------------
export function listarAvaliacoesDoLote(loteId: string): IAvaliacao[] {
  return carregarDB()
    .avaliacoes.filter((a) => a.loteId === loteId)
    .sort((a, b) => a.data.localeCompare(b.data));
}

export function salvarAvaliacao(
  a: Omit<IAvaliacao, 'id' | 'criadoEm'> & { id?: string }
): IAvaliacao {
  const db = carregarDB();
  const agora = new Date().toISOString();

  if (a.id) {
    const idx = db.avaliacoes.findIndex((x) => x.id === a.id);
    const atualizado = { ...db.avaliacoes[idx], ...a, id: a.id };
    db.avaliacoes[idx] = atualizado;
    salvarDB(db);
    return atualizado;
  }

  const nova: IAvaliacao = { ...a, id: uuid(), criadoEm: agora } as IAvaliacao;
  db.avaliacoes.push(nova);
  salvarDB(db);
  return nova;
}

// ============================================================
// ROTINA DE MANUTENCAO (agitar / arejar)
// ============================================================

// Hoje e dia de rotina? (conforme configuracao)
export function ehDiaDeRotina(data: Date = new Date()): boolean {
  const { rotina } = carregarDB().config;
  if (!rotina.ativa) return false;
  return rotina.diasSemana.includes(data.getDay() as DiaSemana);
}

// O lote ainda esta no periodo de maceracao?
// REGRA: a rotina PARA quando a maceracao termina.
export function loteEmMaceracao(lote: ILote): boolean {
  if (lote.statusManual === 'Descartado') return false;
  const hoje = soData(new Date());
  const inicio = soData(new Date(lote.dataProducao));
  const fim = soData(new Date(lote.dataPrevista));
  return hoje >= inicio && hoje < fim;
}

// Manutencoes de um lote (mais recente por ultimo)
export function listarManutencoesDoLote(loteId: string): IManutencao[] {
  return carregarDB()
    .manutencoes.filter((m) => m.loteId === loteId)
    .sort((a, b) => a.data.localeCompare(b.data));
}

// Ja registrou a manutencao de hoje neste lote?
export function manutencaoFeitaHoje(loteId: string): boolean {
  return carregarDB().manutencoes.some(
    (m) => m.loteId === loteId && mesmoDia(m.data, new Date())
  );
}

// Lotes que precisam de manutencao hoje (ainda macerando e nao feitos)
export function lotesPendentesRotina(): ILote[] {
  if (!ehDiaDeRotina()) return [];
  const db = carregarDB();
  return db.lotes.filter(
    (l) =>
      loteEmMaceracao(l) &&
      !db.manutencoes.some((m) => m.loteId === l.id && mesmoDia(m.data, new Date()))
  );
}

// Registra a execucao da rotina num lote
export function registrarManutencao(dados: {
  loteId: string;
  acoes?: AcaoManutencao[];
  observacao?: string;
  data?: string;
}): IManutencao {
  const db = carregarDB();
  const agora = new Date().toISOString();
  const data = dados.data ?? agora;
  const lote = db.lotes.find((l) => l.id === dados.loteId);

  const nova: IManutencao = {
    id: uuid(),
    loteId: dados.loteId,
    data,
    diaMaceracao: lote ? diasDesdeProducao(lote.dataProducao) : 0,
    acoes: dados.acoes ?? [...db.config.rotina.acoes],
    observacao: dados.observacao,
    criadoEm: agora,
  };

  db.manutencoes.push(nova);
  salvarDB(db);
  return nova;
}

// Desfaz a manutencao de hoje (caso tenha marcado sem querer)
export function desfazerManutencaoHoje(loteId: string): void {
  const db = carregarDB();
  db.manutencoes = db.manutencoes.filter(
    (m) => !(m.loteId === loteId && mesmoDia(m.data, new Date()))
  );
  salvarDB(db);
}

// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------
export function carregarConfig(): IConfig {
  return carregarDB().config;
}

export function salvarConfig(config: Partial<IConfig>): IConfig {
  const db = carregarDB();
  db.config = { ...db.config, ...config, atualizadoEm: new Date().toISOString() };
  salvarDB(db);
  return db.config;
}

// ------------------------------------------------------------
// BACKUP - EXPORTAR / IMPORTAR
// ------------------------------------------------------------
export function exportarBackup(): string {
  const db = carregarDB();
  db.exportadoEm = new Date().toISOString();
  return JSON.stringify(db, null, 2); // JSON legivel
}

export function baixarBackup(): void {
  const conteudo = exportarBackup();
  const blob = new Blob([conteudo], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const data = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `sillage_backup_${data}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importarBackup(jsonTexto: string): boolean {
  try {
    const dados = JSON.parse(jsonTexto) as ISillageDB;
    if (!dados.schemaVersion || !Array.isArray(dados.perfumes)) {
      throw new Error('Arquivo invalido');
    }
    salvarDB(migrar(dados));
    return true;
  } catch {
    return false;
  }
}

// Apaga TUDO (usado na tela de Configuracoes)
export function resetarTudo(): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem('sillage_logado');
}
