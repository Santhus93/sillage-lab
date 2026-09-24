// ============================================================
// SILLAGE LAB - MODELO DE DADOS
// Arquivo: src/models/index.ts
// Stack: React + TypeScript + Vite + LocalStorage
// v2: inclui rotina de manutencao (agitar / arejar)
// ============================================================


// ------------------------------------------------------------
// 1. ENUMS E TIPOS BASE
// ------------------------------------------------------------

// Concentracao / tipo do perfume (define a maceracao padrao)
export type Concentracao =
  | 'Colonia'      // ~15 dias
  | 'EDT'          // ~30 dias
  | 'EDP'          // ~45 dias
  | 'Parfum'       // ~60 dias
  | 'Extrait';     // ~90 dias

export type Categoria =
  | 'Masculino'
  | 'Feminino'
  | 'Unissex';

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

// Status "vivo" do perfume (nao muda com o tempo)
export type StatusPerfume =
  | 'Ativo'
  | 'Em Desenvolvimento'
  | 'Arquivado';

// Status calculado do lote (muda com o tempo / maceracao)
export type StatusLote =
  | 'Macerando'         // ainda dentro do periodo
  | 'Pronto para Teste' // atingiu marco intermediario
  | 'Pronto para Venda' // concluiu maceracao total
  | 'Descartado';       // reprovado

// Unidade da materia-prima
export type UnidadeMedida = 'g' | 'ml' | 'un';

// Papel do ingrediente na piramide olfativa
export type NotaPiramide = 'Saida' | 'Corpo' | 'Fundo' | 'Fixador' | 'Solvente';

// Dia da semana (0 = domingo ... 6 = sabado) - padrao do JavaScript
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Acoes da rotina de manutencao durante a maceracao
//  - Agitar : homogeneizar / reincorporar o que decantou
//  - Arejar : abrir o frasco para liberar volateis ("respiro")
export type AcaoManutencao = 'Agitar' | 'Arejar';


// ------------------------------------------------------------
// 2. MATERIA-PRIMA (Ingredientes / insumos)
// ------------------------------------------------------------
// Biblioteca central de insumos. Perfumes referenciam por ID.

export interface IMateriaPrima {
  id: string;                 // uuid
  nome: string;               // "Ambroxan"
  tipo: NotaPiramide;         // "Fundo"
  unidade: UnidadeMedida;     // "g" ou "ml"

  // Estoque
  estoqueAtual: number;       // 180
  estoqueMinimo: number;      // 50

  // Comercial (opcional - preparado para o futuro)
  fornecedor?: string;        // "ABC Aromas"
  custoPorUnidade?: number;   // custo por g/ml (R$)
  loteFornecedor?: string;
  validade?: string;          // ISO date
  ultimaCompra?: string;      // ISO date

  observacoes?: string;
  ativo: boolean;             // permite "desativar" sem apagar
  criadoEm: string;           // ISO date
  atualizadoEm: string;       // ISO date
}


// ------------------------------------------------------------
// 3. PERFUME (a criacao / receita mae)
// ------------------------------------------------------------

export interface IPerfume {
  id: string;                 // uuid
  codigo: string;             // "AG001"
  nome: string;               // "Arabian Gold"

  categoria: Categoria;
  familia: FamiliaOlfativa;
  concentracao: Concentracao;

  // Maceracao especifica deste perfume (dias).
  // Se vazio, o sistema usa o padrao da concentracao.
  maceracaoDias?: number;     // 45

  status: StatusPerfume;
  descricao?: string;
  observacoes?: string;
  fotoUrl?: string;           // base64 (LocalStorage) ou URL

  criadoEm: string;
  atualizadoEm: string;
}


// ------------------------------------------------------------
// 4. FORMULA (composicao do perfume)
// ------------------------------------------------------------
// Uma formula pertence a UM perfume e tem VARIOS itens.
// Trabalhamos com versao para guardar o historico de ajustes.

export interface IFormulaItem {
  materiaPrimaId: string;     // referencia a IMateriaPrima
  percentual: number;         // % dentro do concentrado (ex: 15)
  nota?: NotaPiramide;        // opcional, herda da materia-prima
  ordem?: number;             // ordem de exibicao/mistura
}

export interface IFormula {
  id: string;                 // uuid
  perfumeId: string;          // referencia a IPerfume
  versao: number;             // 1, 2, 3... (historico de ajustes)

  itens: IFormulaItem[];

  // Diluicao final
  percentualConcentrado: number; // ex: 25 (%)
  percentualAlcool: number;      // ex: 73 (%)
  percentualAgua?: number;       // ex: 2  (%)

  ativa: boolean;             // apenas 1 versao ativa por perfume
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}


// ------------------------------------------------------------
// 5. LOTE (producao real)
// ------------------------------------------------------------
// Cada vez que voce PRODUZ, nasce um lote.
// O status e a timeline sao CALCULADOS a partir das datas.

export interface IMarcoMaceracao {
  dias: number;               // 7, 15, 30, 45, 60, 90
  data: string;               // ISO date (calculada)
  atingido: boolean;          // calculado (data <= hoje)
}

export interface ILote {
  id: string;                 // uuid
  codigo: string;             // "AG-20260916-001"

  perfumeId: string;          // referencia a IPerfume
  formulaId: string;          // versao da formula usada (rastreabilidade)

  volumeMl: number;           // 500
  dataProducao: string;       // ISO date

  // Datas de maceracao (calculadas na criacao, mas gravadas
  // para garantir rastreabilidade mesmo se a formula mudar)
  maceracaoDias: number;      // 45
  dataPrevista: string;       // ISO date (producao + maceracaoDias)
  marcos: IMarcoMaceracao[];  // [{7,...},{15,...},{30,...},{45,...}]

  statusManual?: StatusLote;  // sobrescreve o calculado (ex: "Descartado")
  observacoes?: string;
  fotoUrl?: string;

  criadoEm: string;
  atualizadoEm: string;
}


// ------------------------------------------------------------
// 6. AVALIACAO OLFATIVA (historico de testes do lote)
// ------------------------------------------------------------
// Um lote pode ter VARIAS avaliacoes ao longo do tempo.

export interface IAvaliacao {
  id: string;                 // uuid
  loteId: string;             // referencia a ILote
  data: string;               // ISO date da avaliacao
  diaMaceracao: number;       // 7, 15, 30... (calculado)

  nota: number;               // 0.0 a 10.0
  fixacao?: number;           // 0 a 10 (horas ou escala)
  projecao?: number;          // 0 a 10
  observacao?: string;        // "Alcool ainda perceptivel"

  criadoEm: string;
}


// ------------------------------------------------------------
// 6b. MANUTENCAO DO LOTE (rotina de agitar / arejar)
// ------------------------------------------------------------
// Diferente dos marcos (evento unico), a manutencao e RECORRENTE:
// acontece nos dias da semana configurados, enquanto o lote
// estiver macerando. Cada execucao vira um registro aqui.

export interface IManutencao {
  id: string;                 // uuid
  loteId: string;             // referencia a ILote
  data: string;               // ISO date da execucao
  diaMaceracao: number;       // dia da maceracao em que foi feita
  acoes: AcaoManutencao[];    // ['Agitar', 'Arejar']
  observacao?: string;        // "alcool ainda muito presente"
  criadoEm: string;
}


// ------------------------------------------------------------
// 6c. CONFIGURACAO DA ROTINA DE MANUTENCAO
// ------------------------------------------------------------

export interface IRotinaConfig {
  ativa: boolean;             // liga/desliga a rotina
  diasSemana: DiaSemana[];    // ex: [2, 6] = terca e sabado
  acoes: AcaoManutencao[];    // o que fazer nesses dias
  // Regra fixa: a rotina PARA quando o lote conclui a maceracao.
}


// ------------------------------------------------------------
// 7. USUARIO / CONFIGURACOES (login local + preferencias)
// ------------------------------------------------------------

export interface IConfig {
  // Login local (uso pessoal - apenas para "esconder" os dados)
  usuario: string;            // "Rodrigo"
  senhaHash: string;          // hash simples, NAO texto puro

  // Marca / identidade
  nomeLab: string;            // "Sillage Lab"
  subtitulo?: string;         // "Gestao de Formulas e Maceracao"
  logoUrl?: string;           // base64

  // Regras de negocio configuraveis
  maceracaoPadrao: Record<Concentracao, number>; // dias por concentracao
  marcosPadrao: number[];     // [7, 15, 30, 45, 60, 90]
  rotina: IRotinaConfig;      // agitar / arejar durante a maceracao

  // Preferencias
  tema: 'dark' | 'light';
  moeda: string;              // "BRL"

  versaoApp: string;          // "1.0.0"
  atualizadoEm: string;
}


// ------------------------------------------------------------
// 8. ESTRUTURA RAIZ (o que fica salvo no LocalStorage)
// ------------------------------------------------------------
// Uma unica chave no LocalStorage: "sillage_lab_db"
// Facilita o Exportar/Importar backup em JSON.

export interface ISillageDB {
  schemaVersion: number;      // controle de migracao futura
  config: IConfig;
  materiasPrimas: IMateriaPrima[];
  perfumes: IPerfume[];
  formulas: IFormula[];
  lotes: ILote[];
  avaliacoes: IAvaliacao[];
  manutencoes: IManutencao[];
  exportadoEm?: string;       // preenchido no backup
}


// ------------------------------------------------------------
// 9. CONSTANTES PADRAO
// ------------------------------------------------------------

export const MACERACAO_PADRAO: Record<Concentracao, number> = {
  Colonia: 15,
  EDT: 30,
  EDP: 45,
  Parfum: 60,
  Extrait: 90,
};

export const MARCOS_PADRAO: number[] = [7, 15, 30, 45, 60, 90];

// Rotina padrao: agitar e arejar as tercas e sabados
export const ROTINA_PADRAO: IRotinaConfig = {
  ativa: true,
  diasSemana: [2, 6],          // 2 = terca, 6 = sabado
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
export const SCHEMA_VERSION = 2;
