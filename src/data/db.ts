// ============================================================
// SILLAGE LAB - CAMADA DE DADOS (Firestore / nuvem)
// Arquivo: src/data/db.ts
// v5: embalagem, densidade e baixa de estoque combinada
// ============================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { v4 as uuid } from 'uuid';

import { db as fs, LAB_PATH } from './firebase';

import type {
  IConfig,
  IPerfume,
  IFormula,
  ILote,
  IAvaliacao,
  IMateriaPrima,
  IEmbalagem,
  IManutencao,
  IMarcoMaceracao,
  IConsumoLote,
  IConsumoEmbalagem,
  ISillageDB,
  StatusLote,
  AcaoManutencao,
  DiaSemana,
} from '../models';

import {
  MACERACAO_PADRAO,
  MARCOS_PADRAO,
  ROTINA_PADRAO,
  SCHEMA_VERSION,
} from '../models';

// ------------------------------------------------------------
// ATALHOS
// ------------------------------------------------------------
const docLab = () => doc(fs, LAB_PATH);
const col = (nome: string) => collection(fs, `${LAB_PATH}/${nome}`);
const docEm = (nome: string, id: string) => doc(fs, `${LAB_PATH}/${nome}/${id}`);

async function lerTodos<T>(nome: string): Promise<T[]> {
  const snap = await getDocs(col(nome));
  return snap.docs.map((d) => d.data() as T);
}

// ------------------------------------------------------------
// HELPERS DE DATA (puros)
// ------------------------------------------------------------
function addDias(dataISO: string, dias: number): string {
  const d = new Date(dataISO);
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

function soData(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function mesmoDia(a: string | Date, b: string | Date): boolean {
  return soData(new Date(a)).getTime() === soData(new Date(b)).getTime();
}

export function gerarMarcos(
  dataProducao: string,
  marcosDias: number[]
): IMarcoMaceracao[] {
  const hoje = new Date();
  return marcosDias.map((dias) => {
    const data = addDias(dataProducao, dias);
    return { dias, data, atingido: new Date(data) <= hoje };
  });
}

export function calcularStatusLote(lote: ILote): StatusLote {
  if (lote.statusManual) return lote.statusManual;

  const hoje = new Date();
  const fim = new Date(lote.dataPrevista);

  if (hoje >= fim) return 'Pronto para Venda';

  const primeiroMarco = lote.marcos.find((m) => m.dias >= 7);
  if (primeiroMarco && new Date(primeiroMarco.data) <= hoje) {
    return 'Pronto para Teste';
  }
  return 'Macerando';
}

export function diasDesdeProducao(dataProducao: string): number {
  const ms =
    soData(new Date()).getTime() - soData(new Date(dataProducao)).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function loteEmMaceracao(lote: ILote): boolean {
  if (lote.statusManual === 'Descartado') return false;
  const hoje = soData(new Date());
  const inicio = soData(new Date(lote.dataProducao));
  const fim = soData(new Date(lote.dataPrevista));
  return hoje >= inicio && hoje < fim;
}

// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------
function configPadrao(): IConfig {
  return {
    usuario: 'Sillage',
    senhaHash: '',
    nomeLab: 'Sillage Lab',
    subtitulo: 'Gestao de Formulas e Maceracao',
    maceracaoPadrao: { ...MACERACAO_PADRAO },
    marcosPadrao: [...MARCOS_PADRAO],
    rotina: { ...ROTINA_PADRAO, diasSemana: [...ROTINA_PADRAO.diasSemana] },
    baixaEstoqueAutomatica: true,
    tema: 'dark',
    moeda: 'BRL',
    versaoApp: '4.0.0',
    atualizadoEm: new Date().toISOString(),
  };
}

export async function carregarConfig(): Promise<IConfig> {
  const snap = await getDoc(docLab());
  if (!snap.exists()) {
    const padrao = configPadrao();
    await setDoc(docLab(), { schemaVersion: SCHEMA_VERSION, config: padrao });
    return padrao;
  }
  const dados = snap.data() as { config?: IConfig };
  return { ...configPadrao(), ...(dados.config ?? {}) };
}

export async function salvarConfig(parcial: Partial<IConfig>): Promise<IConfig> {
  const atual = await carregarConfig();
  const novo: IConfig = {
    ...atual,
    ...parcial,
    atualizadoEm: new Date().toISOString(),
  };
  await setDoc(
    docLab(),
    { schemaVersion: SCHEMA_VERSION, config: novo },
    { merge: true }
  );
  return novo;
}

// ------------------------------------------------------------
// PERFUMES
// ------------------------------------------------------------
export async function listarPerfumes(): Promise<IPerfume[]> {
  const lista = await lerTodos<IPerfume>('perfumes');
  return lista.sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function salvarPerfume(
  p: Omit<IPerfume, 'id' | 'criadoEm' | 'atualizadoEm'> & { id?: string }
): Promise<IPerfume> {
  const agora = new Date().toISOString();

  if (p.id) {
    const snap = await getDoc(docEm('perfumes', p.id));
    const antigo = snap.data() as IPerfume;
    const atualizado: IPerfume = { ...antigo, ...p, id: p.id, atualizadoEm: agora };
    await setDoc(docEm('perfumes', p.id), atualizado);
    return atualizado;
  }

  const novo = {
    ...p,
    id: uuid(),
    criadoEm: agora,
    atualizadoEm: agora,
  } as IPerfume;
  await setDoc(docEm('perfumes', novo.id), novo);
  return novo;
}

export async function excluirPerfume(id: string): Promise<void> {
  const batch = writeBatch(fs);
  batch.delete(docEm('perfumes', id));

  const formulas = await getDocs(query(col('formulas'), where('perfumeId', '==', id)));
  formulas.forEach((d) => batch.delete(d.ref));

  const lotes = await getDocs(query(col('lotes'), where('perfumeId', '==', id)));
  const idsLotes: string[] = [];
  lotes.forEach((d) => {
    idsLotes.push(d.id);
    batch.delete(d.ref);
  });

  for (const loteId of idsLotes) {
    const avals = await getDocs(query(col('avaliacoes'), where('loteId', '==', loteId)));
    avals.forEach((d) => batch.delete(d.ref));
    const manus = await getDocs(query(col('manutencoes'), where('loteId', '==', loteId)));
    manus.forEach((d) => batch.delete(d.ref));
  }

  await batch.commit();
}

// ------------------------------------------------------------
// MATERIAS-PRIMAS
// ------------------------------------------------------------
export async function listarMateriasPrimas(): Promise<IMateriaPrima[]> {
  const lista = await lerTodos<IMateriaPrima>('materiasPrimas');
  return lista.sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function salvarMateriaPrima(
  m: Omit<IMateriaPrima, 'id' | 'criadoEm' | 'atualizadoEm'> & { id?: string }
): Promise<IMateriaPrima> {
  const agora = new Date().toISOString();

  if (m.id) {
    const snap = await getDoc(docEm('materiasPrimas', m.id));
    const antigo = snap.data() as IMateriaPrima;
    const atualizado = { ...antigo, ...m, id: m.id, atualizadoEm: agora };
    await setDoc(docEm('materiasPrimas', m.id), atualizado);
    return atualizado;
  }

  const nova = {
    ...m,
    id: uuid(),
    criadoEm: agora,
    atualizadoEm: agora,
  } as IMateriaPrima;
  await setDoc(docEm('materiasPrimas', nova.id), nova);
  return nova;
}

export async function excluirMateriaPrima(id: string): Promise<void> {
  await deleteDoc(docEm('materiasPrimas', id));
}

// ------------------------------------------------------------
// EMBALAGENS
// ------------------------------------------------------------
export async function listarEmbalagens(): Promise<IEmbalagem[]> {
  const lista = await lerTodos<IEmbalagem>('embalagens');
  return lista.sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function salvarEmbalagem(
  e: Omit<IEmbalagem, 'id' | 'criadoEm' | 'atualizadoEm'> & { id?: string }
): Promise<IEmbalagem> {
  const agora = new Date().toISOString();

  if (e.id) {
    const snap = await getDoc(docEm('embalagens', e.id));
    const antiga = snap.data() as IEmbalagem;
    const atualizada = { ...antiga, ...e, id: e.id, atualizadoEm: agora };
    await setDoc(docEm('embalagens', e.id), atualizada);
    return atualizada;
  }

  const nova = {
    ...e,
    id: uuid(),
    criadoEm: agora,
    atualizadoEm: agora,
  } as IEmbalagem;
  await setDoc(docEm('embalagens', nova.id), nova);
  return nova;
}

export async function excluirEmbalagem(id: string): Promise<void> {
  await deleteDoc(docEm('embalagens', id));
}

// ------------------------------------------------------------
// FORMULAS
// ------------------------------------------------------------
export async function listarFormulasDoPerfume(
  perfumeId: string
): Promise<IFormula[]> {
  const snap = await getDocs(query(col('formulas'), where('perfumeId', '==', perfumeId)));
  return snap.docs.map((d) => d.data() as IFormula);
}

export async function formulaAtiva(
  perfumeId: string
): Promise<IFormula | undefined> {
  const lista = await listarFormulasDoPerfume(perfumeId);
  return lista.find((f) => f.ativa);
}

export async function salvarFormula(
  f: Omit<IFormula, 'id' | 'versao' | 'criadoEm' | 'atualizadoEm'> & { id?: string }
): Promise<IFormula> {
  const agora = new Date().toISOString();
  const existentes = await listarFormulasDoPerfume(f.perfumeId);
  const batch = writeBatch(fs);

  if (f.ativa) {
    existentes
      .filter((x) => x.ativa)
      .forEach((x) => batch.update(docEm('formulas', x.id), { ativa: false }));
  }

  if (f.id) {
    const antiga = existentes.find((x) => x.id === f.id);
    const atualizada = { ...antiga, ...f, id: f.id, atualizadoEm: agora } as IFormula;
    batch.set(docEm('formulas', f.id), atualizada);
    await batch.commit();
    return atualizada;
  }

  const versao = existentes.reduce((max, x) => Math.max(max, x.versao), 0) + 1;
  const nova = {
    ...f,
    id: uuid(),
    versao,
    criadoEm: agora,
    atualizadoEm: agora,
  } as IFormula;

  batch.set(docEm('formulas', nova.id), nova);
  await batch.commit();
  return nova;
}

// ------------------------------------------------------------
// LOTES
// ------------------------------------------------------------
export async function listarLotes(): Promise<ILote[]> {
  const lista = await lerTodos<ILote>('lotes');
  return lista.sort((a, b) => b.dataProducao.localeCompare(a.dataProducao));
}

// Cria o lote e, se pedido, ja desconta o estoque (insumos e embalagem)
export async function criarLote(dados: {
  perfumeId: string;
  formulaId: string;
  volumeMl: number;
  dataProducao: string;
  maceracaoDias: number;
  observacoes?: string;
  consumo?: IConsumoLote[];
  custoTotal?: number;
  baixarEstoque?: boolean;
  tamanhoFrascoMl?: number;
  quantidadeFrascos?: number;
  embalagemConsumo?: IConsumoEmbalagem[];
  custoEmbalagem?: number;
}): Promise<ILote> {
  const agora = new Date().toISOString();
  const [config, lotes, perfumes] = await Promise.all([
    carregarConfig(),
    listarLotes(),
    listarPerfumes(),
  ]);

  const perfume = perfumes.find((p) => p.id === dados.perfumeId);
  const prefixo = perfume?.codigo ?? 'LOT';

  const dia = dados.dataProducao.slice(0, 10).replace(/-/g, '');
  const seq = lotes.filter((l) => l.codigo.includes(dia)).length + 1;
  const codigo = `${prefixo}-${dia}-${String(seq).padStart(3, '0')}`;

  const baixar = dados.baixarEstoque ?? false;
  const custoEmbalagem = dados.custoEmbalagem ?? 0;
  const custoTotal = dados.custoTotal ?? 0;

  const novo: ILote = {
    id: uuid(),
    codigo,
    perfumeId: dados.perfumeId,
    formulaId: dados.formulaId,
    volumeMl: dados.volumeMl,
    dataProducao: dados.dataProducao,
    maceracaoDias: dados.maceracaoDias,
    dataPrevista: addDias(dados.dataProducao, dados.maceracaoDias),
    marcos: gerarMarcos(dados.dataProducao, config.marcosPadrao),
    consumo: dados.consumo ?? [],
    custoTotal,
    baixouEstoque: baixar,
    tamanhoFrascoMl: dados.tamanhoFrascoMl,
    quantidadeFrascos: dados.quantidadeFrascos,
    embalagemConsumo: dados.embalagemConsumo ?? [],
    custoEmbalagem,
    custoGeral: r2(custoTotal + custoEmbalagem),
    baixouEstoqueEmbalagem: baixar && Boolean(dados.embalagemConsumo?.length),
    observacoes: dados.observacoes ?? '',
    criadoEm: agora,
    atualizadoEm: agora,
  };

  const batch = writeBatch(fs);
  batch.set(docEm('lotes', novo.id), novo);

  if (baixar) {
    dados.consumo?.forEach((c) => {
      batch.set(
        docEm('materiasPrimas', c.materiaPrimaId),
        { estoqueAtual: increment(-c.quantidade), atualizadoEm: agora },
        { merge: true }
      );
    });
    dados.embalagemConsumo?.forEach((e) => {
      batch.set(
        docEm('embalagens', e.embalagemId),
        { estoqueAtual: increment(-e.quantidadeTotal), atualizadoEm: agora },
        { merge: true }
      );
    });
  }

  await batch.commit();
  return novo;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function atualizarLote(
  id: string,
  campos: Partial<ILote>
): Promise<void> {
  await setDoc(
    docEm('lotes', id),
    { ...campos, atualizadoEm: new Date().toISOString() },
    { merge: true }
  );
}

// Exclui o lote e devolve o estoque (insumos e embalagem) se baixado
export async function excluirLote(id: string): Promise<void> {
  const snap = await getDoc(docEm('lotes', id));
  const lote = snap.data() as ILote | undefined;

  const batch = writeBatch(fs);
  batch.delete(docEm('lotes', id));

  if (lote?.baixouEstoque && lote.consumo?.length) {
    lote.consumo.forEach((c) => {
      batch.set(
        docEm('materiasPrimas', c.materiaPrimaId),
        { estoqueAtual: increment(c.quantidade) },
        { merge: true }
      );
    });
  }

  if (lote?.baixouEstoqueEmbalagem && lote.embalagemConsumo?.length) {
    lote.embalagemConsumo.forEach((e) => {
      batch.set(
        docEm('embalagens', e.embalagemId),
        { estoqueAtual: increment(e.quantidadeTotal) },
        { merge: true }
      );
    });
  }

  const avals = await getDocs(query(col('avaliacoes'), where('loteId', '==', id)));
  avals.forEach((d) => batch.delete(d.ref));

  const manus = await getDocs(query(col('manutencoes'), where('loteId', '==', id)));
  manus.forEach((d) => batch.delete(d.ref));

  await batch.commit();
}

// ------------------------------------------------------------
// AVALIACOES
// ------------------------------------------------------------
export async function listarAvaliacoes(): Promise<IAvaliacao[]> {
  return lerTodos<IAvaliacao>('avaliacoes');
}

export async function listarAvaliacoesDoLote(
  loteId: string
): Promise<IAvaliacao[]> {
  const snap = await getDocs(query(col('avaliacoes'), where('loteId', '==', loteId)));
  return snap.docs
    .map((d) => d.data() as IAvaliacao)
    .sort((a, b) => a.data.localeCompare(b.data));
}

export async function salvarAvaliacao(
  a: Omit<IAvaliacao, 'id' | 'criadoEm'> & { id?: string }
): Promise<IAvaliacao> {
  const agora = new Date().toISOString();
  const id = a.id ?? uuid();
  const nova = { ...a, id, criadoEm: agora } as IAvaliacao;
  await setDoc(docEm('avaliacoes', id), nova);
  return nova;
}

// ------------------------------------------------------------
// ROTINA DE MANUTENCAO
// ------------------------------------------------------------
export async function ehDiaDeRotina(data: Date = new Date()): Promise<boolean> {
  const { rotina } = await carregarConfig();
  if (!rotina.ativa) return false;
  return rotina.diasSemana.includes(data.getDay() as DiaSemana);
}

export async function listarManutencoes(): Promise<IManutencao[]> {
  return lerTodos<IManutencao>('manutencoes');
}

export async function listarManutencoesDoLote(
  loteId: string
): Promise<IManutencao[]> {
  const snap = await getDocs(query(col('manutencoes'), where('loteId', '==', loteId)));
  return snap.docs
    .map((d) => d.data() as IManutencao)
    .sort((a, b) => a.data.localeCompare(b.data));
}

export async function registrarManutencao(dados: {
  loteId: string;
  acoes?: AcaoManutencao[];
  observacao?: string;
  data?: string;
}): Promise<IManutencao> {
  const agora = new Date().toISOString();
  const [config, lotes] = await Promise.all([carregarConfig(), listarLotes()]);
  const lote = lotes.find((l) => l.id === dados.loteId);

  const nova: IManutencao = {
    id: uuid(),
    loteId: dados.loteId,
    data: dados.data ?? agora,
    diaMaceracao: lote ? diasDesdeProducao(lote.dataProducao) : 0,
    acoes: dados.acoes ?? [...config.rotina.acoes],
    observacao: dados.observacao ?? '',
    criadoEm: agora,
  };

  await setDoc(docEm('manutencoes', nova.id), nova);
  return nova;
}

export async function desfazerManutencaoHoje(loteId: string): Promise<void> {
  const snap = await getDocs(query(col('manutencoes'), where('loteId', '==', loteId)));
  const batch = writeBatch(fs);
  snap.docs
    .filter((d) => mesmoDia((d.data() as IManutencao).data, new Date()))
    .forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

// ------------------------------------------------------------
// BACKUP
// ------------------------------------------------------------
export async function exportarBackup(): Promise<string> {
  const [config, materiasPrimas, embalagens, perfumes, lotes, avaliacoes, manutencoes] =
    await Promise.all([
      carregarConfig(),
      listarMateriasPrimas(),
      listarEmbalagens(),
      listarPerfumes(),
      listarLotes(),
      listarAvaliacoes(),
      listarManutencoes(),
    ]);

  const formulas = await lerTodos<IFormula>('formulas');

  const backup: ISillageDB = {
    schemaVersion: SCHEMA_VERSION,
    config,
    materiasPrimas,
    embalagens,
    perfumes,
    formulas,
    lotes,
    avaliacoes,
    manutencoes,
    exportadoEm: new Date().toISOString(),
  };

  return JSON.stringify(backup, null, 2);
}

export async function baixarBackup(): Promise<void> {
  const conteudo = await exportarBackup();
  const blob = new Blob([conteudo], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sillage_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importarBackup(jsonTexto: string): Promise<boolean> {
  try {
    const dados = JSON.parse(jsonTexto) as ISillageDB;
    if (!Array.isArray(dados.perfumes)) throw new Error('invalido');

    const batch = writeBatch(fs);

    if (dados.config) {
      batch.set(
        docLab(),
        { schemaVersion: SCHEMA_VERSION, config: dados.config },
        { merge: true }
      );
    }

    (dados.materiasPrimas ?? []).forEach((m) =>
      batch.set(docEm('materiasPrimas', m.id), m)
    );
    (dados.embalagens ?? []).forEach((e) =>
      batch.set(docEm('embalagens', e.id), e)
    );
    (dados.perfumes ?? []).forEach((p) => batch.set(docEm('perfumes', p.id), p));
    (dados.formulas ?? []).forEach((f) => batch.set(docEm('formulas', f.id), f));
    (dados.lotes ?? []).forEach((l) => batch.set(docEm('lotes', l.id), l));
    (dados.avaliacoes ?? []).forEach((a) =>
      batch.set(docEm('avaliacoes', a.id), a)
    );
    (dados.manutencoes ?? []).forEach((m) =>
      batch.set(docEm('manutencoes', m.id), m)
    );

    await batch.commit();
    return true;
  } catch {
    return false;
  }
}

export async function migrarDoLocalStorage(): Promise<boolean> {
  const raw = localStorage.getItem('sillage_lab_db');
  if (!raw) return false;
  const ok = await importarBackup(raw);
  if (ok) localStorage.setItem('sillage_lab_db_migrado', raw);
  return ok;
}

export async function resetarTudo(): Promise<void> {
  const colecoes = [
    'perfumes',
    'formulas',
    'lotes',
    'avaliacoes',
    'manutencoes',
    'materiasPrimas',
    'embalagens',
  ];
  for (const nome of colecoes) {
    const snap = await getDocs(col(nome));
    const batch = writeBatch(fs);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await setDoc(docLab(), { schemaVersion: SCHEMA_VERSION, config: configPadrao() });
}
