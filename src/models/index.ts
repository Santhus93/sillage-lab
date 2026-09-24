// ============================================================
// SILLAGE LAB - MODELO DE DADOS
// Arquivo: src/models/index.ts
// v3: consumo de materia-prima e custo por lote
// ============================================================


// ------------------------------------------------------------
// 1. ENUMS E TIPOS BASE
// ------------------------------------------------------------

export type Concentracao =
  | 'Colonia'      // ~15 dias
  | 'EDT'          // ~30 dias
  | 'EDP'          // ~45 dias
  | 'Parfum'       // ~60 dias
  | 'Extrait';     // ~90 dias

export type Categoria = 'Masculino' | 'Feminino' | 'Unissex';

export type FamiliaOlfativa =
  | 'Citrico'
  | 'Floral'
  | 'Amadeirado'
  | 'Oriental'
  | 'Aromatico'
  | 'Chipre'
  | 'Fougere'
  | 'Gourmand'
  | 'Aquatico'
  | 'Couro';

export type StatusPerfume = 'Ativo' | 'Em Desenvolvimento' | 'Arquivado';

export type StatusLote =
  | 'Macerando'
  | 'Pronto para Teste'
  | 'Pronto para Venda'
  | 'Descartado';

export type UnidadeMedida = 'g' | 'ml' | 'un';

export type NotaPiramide = 'Saida' | 'Corpo' | 'Fundo' | 'Fixador' | 'Solvente';

// 0 = domingo ... 6 = sabado (padrao do JavaScript)
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Rotina durante a maceracao
export type AcaoManutencao = 'Agitar' | 'Arejar';


// ------------------------------------------------------------
// 2. MATERIA-PRIMA
// ------------------------------------------------------------

export interface IMateriaPrima {
  id: string;
  nome: string;
  tipo: NotaPiramide;
  unidade: UnidadeMedida;

  estoqueAtual: number;
  estoqueMinimo: number;

  fornecedor?: string;
  custoPorUnidade?: number;   // R$ por g/ml
  loteFornecedor?: string;
  validade?: string;
  ultimaCompra?: string;

  observacoes?: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}


// ------------------------------------------------------------
// 3. PERFUME
// ------------------------------------------------------------

export interface IPerfume {
  id: string;
  codigo: string;
  nome: string;

  categoria: Categoria;
  familia: FamiliaOlfativa;
  concentracao: Concentracao;

  maceracaoDias?: number;

  status: StatusPerfume;
  descricao?: string;
  observacoes?: string;
  fotoUrl?: string;

  criadoEm: string;
  atualizadoEm: string;
}


// ------------------------------------------------------------
// 4. FORMULA
// ------------------------------------------------------------

export interface IFormulaItem {
  materiaPrimaId: string;
  percentual: number;         // % dentro do concentrado
  nota?: NotaPiramide;
  ordem?: number;
}

export interface IFormula {
  id: string;
  perfumeId: string;
  versao: number;

  itens: IFormulaItem[];

  percentualConcentrado: number;
  percentualAlcool: number;
  percentualAgua?: number;

  ativa: boolean;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}


// ------------------------------------------------------------
// 4b. CALCULO DE PRODUCAO (nao e salvo - e derivado)
// ------------------------------------------------------------
// Converte a formula (%) + volume (ml) em quantidades reais
// para pesar na bancada.

export interface IItemCalculado {
  materiaPrimaId: string;
  nome: string;
  tipo?: NotaPiramide;
  unidade: UnidadeMedida;

  percentual: number;         // % dentro do concentrado
  quantidade: number;         // quanto pesar/medir (g ou ml)
  custo?: number;             // R$ desta quantidade

  estoqueAtual: number;
  suficiente: boolean;        // tem estoque para esta producao?
}

export interface ICalculoProducao {
  volumeTotalMl: number;
  volumeConcentradoMl: number;
  volumeAlcoolMl: number;
  volumeAguaMl: number;

  itens: IItemCalculado[];

  custoTotal: number;
  custoPorMl: number;
  temEstoqueCompleto: boolean;
  faltantes: string[];        // nomes das materias sem estoque
}


// ------------------------------------------------------------
// 5. LOTE
// ------------------------------------------------------------

export interface IMarcoMaceracao {
  dias: number;
  data: string;
  atingido: boolean;
}

// O que foi realmente consumido nesta producao.
// Gravado no lote para rastreabilidade (mesmo que a
// formula ou os precos mudem depois).
export interface IConsumoLote {
  materiaPrimaId: string;
  nome: string;
  quantidade: number;
  unidade: UnidadeMedida;
  custo?: number;
}

export interface ILote {
  id: string;
  codigo: string;

  perfumeId: string;
  formulaId: string;

  volumeMl: number;
  dataProducao: string;

  maceracaoDias: number;
  dataPrevista: string;
  marcos: IMarcoMaceracao[];

  // Producao (v3)
  consumo?: IConsumoLote[];   // materias consumidas
  custoTotal?: number;        // R$ do lote
  baixouEstoque?: boolean;    // se o estoque ja foi descontado

  statusManual?: StatusLote;
  observacoes?: string;
  fotoUrl?: string;

  criadoEm: string;
  atualizadoEm: string;
}


// ------------------------------------------------------------
// 6. AVALIACAO OLFATIVA
// ------------------------------------------------------------

export interface IAvaliacao {
  id: string;
  loteId: string;
  data: string;
  diaMaceracao: number;

  nota: number;
  fixacao?: number;
  projecao?: number;
  observacao?: string;

  criadoEm: string;
}


// ------------------------------------------------------------
// 6b. MANUTENCAO (rotina de agitar / arejar)
// ------------------------------------------------------------

export interface IManutencao {
  id: string;
  loteId: string;
  data: string;
  diaMaceracao: number;
  acoes: AcaoManutencao[];
  observacao?: string;
  criadoEm: string;
}

export interface IRotinaConfig {
  ativa: boolean;
  diasSemana: DiaSemana[];
  acoes: AcaoManutencao[];
  // A rotina sempre para quando o lote conclui a maceracao.
}


// ------------------------------------------------------------
// 7. CONFIGURACOES
// ------------------------------------------------------------

export interface IConfig {
  usuario: string;
  senhaHash: string;          // legado (login agora e do Firebase)

  nomeLab: string;
  subtitulo?: string;
  logoUrl?: string;

  maceracaoPadrao: Record<Concentracao, number>;
  marcosPadrao: number[];
  rotina: IRotinaConfig;

  // Producao (v3)
  baixaEstoqueAutomatica: boolean; // descontar ao produzir?

  tema: 'dark' | 'light';
  moeda: string;

  versaoApp: string;
  atualizadoEm: string;
}


// ------------------------------------------------------------
// 8. ESTRUTURA RAIZ (backup / exportacao)
// ------------------------------------------------------------

export interface ISillageDB {
  schemaVersion: number;
  config: IConfig;
  materiasPrimas: IMateriaPrima[];
  perfumes: IPerfume[];
  formulas: IFormula[];
  lotes: ILote[];
  avaliacoes: IAvaliacao[];
  manutencoes: IManutencao[];
  exportadoEm?: string;
}


// ------------------------------------------------------------
// 9. CONSTANTES
// ------------------------------------------------------------

export const MACERACAO_PADRAO: Record<Concentracao, number> = {
  Colonia: 15,
  EDT: 30,
  EDP: 45,
  Parfum: 60,
  Extrait: 90,
};

export const MARCOS_PADRAO: number[] = [7, 15, 30, 45, 60, 90];

export const ROTINA_PADRAO: IRotinaConfig = {
  ativa: true,
  diasSemana: [2, 6],          // terca e sabado
  acoes: ['Agitar', 'Arejar'],
};

export const NOMES_DIAS: Record<DiaSemana, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terca',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sabado',
};

export const DIAS_CURTOS: Record<DiaSemana, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sab',
};

export const STORAGE_KEY = 'sillage_lab_db';
export const SCHEMA_VERSION = 3;
