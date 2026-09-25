// ============================================================
// SILLAGE LAB - MODELO DE DADOS
// Arquivo: src/models/index.ts
// v5: densidade por materia-prima, embalagem e alcool automatico
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

// Avaliacao de essencia pronta / contratipo (nosso proprio teste)
export type StatusAvaliacao = 'Testando' | 'Aprovado' | 'Reprovado' | 'Macerando';

// Tipos de componente de embalagem
export type TipoEmbalagem = 'Vidro' | 'Valvula' | 'Tampa' | 'Adesivo' | 'Caixa' | 'Outro';


// ------------------------------------------------------------
// 2. MATERIA-PRIMA
// ------------------------------------------------------------
// Cobre tanto insumos "crus" (Ambroxan, Alcool...) quanto
// essencias prontas / contratipos comprados de fornecedores.
// A "densidade" converte volume <-> massa com precisao: o
// concentrado e calculado por volume (ml), mas muitos insumos
// sao pesados em gramas na bancada. Sem densidade, o sistema
// assume 1 g = 1 ml (o padrao da agua), o que gera erro em
// oleos mais leves ou mais pesados.

export interface IMateriaPrima {
  id: string;
  nome: string;
  tipo: NotaPiramide;
  unidade: UnidadeMedida;

  densidade?: number;          // g/ml - padrao 1 se nao informado

  estoqueAtual: number;
  estoqueMinimo: number;

  fornecedor?: string;
  custoPorUnidade?: number;    // R$ por g/ml
  loteFornecedor?: string;
  validade?: string;
  ultimaCompra?: string;

  // Avaliacao (opcional - essencias prontas / contratipos)
  inspiracao?: string;
  genero?: Categoria;
  statusAvaliacao?: StatusAvaliacao;
  avaliadoPor?: string;
  dataAvaliacao?: string;
  feedbackAvaliacao?: string;

  observacoes?: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}


// ------------------------------------------------------------
// 2b. EMBALAGEM
// ------------------------------------------------------------
// Componentes do produto final (vidro, tampa, valvula, adesivo,
// caixa). Separado de materia-prima porque tem natureza
// diferente: e contado por unidade/frasco, nao por % de formula.

export interface IEmbalagem {
  id: string;
  nome: string;                // "Vidro 50ml", "Tampa dourada"
  tipo: TipoEmbalagem;
  tamanhoMl?: number;           // preenchido quando tipo = Vidro

  custoUnitario: number;       // R$ por unidade
  estoqueAtual: number;
  estoqueMinimo: number;

  fornecedor?: string;
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
  percentual: number;          // % dentro do concentrado
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

  // Se true, percentualAlcool e SEMPRE recalculado como
  // (100 - concentrado - agua) ao salvar. Reduz erro de
  // digitacao e mantem a diluicao sempre fechando em 100%.
  alcoolAutomatico?: boolean;

  ativa: boolean;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}


// ------------------------------------------------------------
// 4b. CALCULO DE PRODUCAO (derivado, nao persistido)
// ------------------------------------------------------------

export interface IItemCalculado {
  materiaPrimaId: string;
  nome: string;
  tipo?: NotaPiramide;
  unidade: UnidadeMedida;
  densidade: number;

  percentual: number;
  quantidade: number;          // ja convertida para a unidade do insumo
  custo?: number;

  estoqueAtual: number;
  suficiente: boolean;
}

export interface ICalculoProducao {
  volumeTotalMl: number;
  volumeConcentradoMl: number;
  volumeAlcoolMl: number;
  volumeAguaMl: number;

  itens: IItemCalculado[];

  custoTotal: number;          // apenas insumos (concentrado + alcool)
  custoPorMl: number;
  temEstoqueCompleto: boolean;
  faltantes: string[];
}

// Consumo de embalagem calculado para um volume de producao
export interface IItemEmbalagemCalculado {
  embalagemId: string;
  nome: string;
  tipo: TipoEmbalagem;
  custoUnitario: number;
  quantidadePorFrasco: number;
  quantidadeTotal: number;
  custoTotal: number;
  estoqueAtual: number;
  suficiente: boolean;
}

export interface ICalculoEmbalagem {
  quantidadeFrascos: number;
  itens: IItemEmbalagemCalculado[];
  custoTotal: number;
  temEstoqueCompleto: boolean;
  faltantes: string[];
}


// ------------------------------------------------------------
// 5. LOTE
// ------------------------------------------------------------

export interface IMarcoMaceracao {
  dias: number;
  data: string;
  atingido: boolean;
}

export interface IConsumoLote {
  materiaPrimaId: string;
  nome: string;
  quantidade: number;
  unidade: UnidadeMedida;
  custo?: number;
}

export interface IConsumoEmbalagem {
  embalagemId: string;
  nome: string;
  quantidadePorFrasco: number;
  quantidadeTotal: number;
  custoUnitario: number;
  custoTotal: number;
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

  // Producao / custo
  consumo?: IConsumoLote[];         // materias-primas consumidas
  custoTotal?: number;              // custo dos insumos (concentrado + alcool)
  baixouEstoque?: boolean;          // se o estoque de insumos foi descontado

  // Embalagem
  tamanhoFrascoMl?: number;
  quantidadeFrascos?: number;
  embalagemConsumo?: IConsumoEmbalagem[];
  custoEmbalagem?: number;
  custoGeral?: number;               // custoTotal + custoEmbalagem
  baixouEstoqueEmbalagem?: boolean;

  statusManual?: StatusLote;
  observacoes?: string;
  fotoUrl?: string;

  criadoEm: string;
  atualizadoEm: string;
}


// ------------------------------------------------------------
// 6. AVALIACAO OLFATIVA (do lote, ja macerando)
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
}


// ------------------------------------------------------------
// 7. CONFIGURACOES
// ------------------------------------------------------------

export interface IConfig {
  usuario: string;
  senhaHash: string;          // legado

  nomeLab: string;
  subtitulo?: string;
  logoUrl?: string;

  maceracaoPadrao: Record<Concentracao, number>;
  marcosPadrao: number[];
  rotina: IRotinaConfig;

  baixaEstoqueAutomatica: boolean;

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
  embalagens: IEmbalagem[];
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

// Tamanhos de vidro mais comuns (sugestao rapida no formulario)
export const TAMANHOS_VIDRO_COMUNS = [15, 25, 30, 50, 75, 100, 125, 200];

export const DENSIDADE_PADRAO = 1; // g/ml (agua) - usado quando nao informado

export const STORAGE_KEY = 'sillage_lab_db';
export const SCHEMA_VERSION = 5;
