// ============================================================
// SILLAGE LAB - CALCULO DE PRODUCAO
// Arquivo: src/data/producao.ts
//
// Converte a formula (percentuais) + volume desejado em
// quantidades reais para pesar na bancada, ja com custo,
// densidade e verificacao de estoque. Tambem calcula o
// consumo de embalagem (vidros, tampas, valvulas...).
//
// Regra: os percentuais dos itens sao sobre o CONCENTRADO,
// que e definido por VOLUME (ml). A densidade converte esse
// volume para massa (g) quando o insumo e pesado na balanca -
// sem ela, o sistema assumiria 1g = 1ml (padrao da agua),
// o que gera erro em oleos mais leves ou mais pesados.
// ============================================================

import type {
  IFormula,
  IMateriaPrima,
  IEmbalagem,
  ICalculoProducao,
  IItemCalculado,
  IConsumoLote,
  ICalculoEmbalagem,
  IItemEmbalagemCalculado,
  IConsumoEmbalagem,
} from '../models';
import { DENSIDADE_PADRAO } from '../models';

// Arredonda para 2 casas sem sujeira de ponto flutuante
function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ------------------------------------------------------------
// CALCULO DO CONCENTRADO / INSUMOS
// ------------------------------------------------------------
export function calcularProducao(
  formula: IFormula,
  volumeMl: number,
  materias: IMateriaPrima[]
): ICalculoProducao {
  const pctConc = formula.percentualConcentrado || 0;
  const pctAlc = formula.percentualAlcool || 0;
  const pctAgua = formula.percentualAgua ?? 0;

  const volumeConcentradoMl = r2((volumeMl * pctConc) / 100);
  const volumeAlcoolMl = r2((volumeMl * pctAlc) / 100);
  const volumeAguaMl = r2((volumeMl * pctAgua) / 100);

  const somaPct = formula.itens.reduce((s, i) => s + (i.percentual || 0), 0);

  const itens: IItemCalculado[] = formula.itens.map((item) => {
    const mp = materias.find((m) => m.id === item.materiaPrimaId);
    const densidade = mp?.densidade ?? DENSIDADE_PADRAO;

    // Normaliza proporcionalmente caso a formula nao feche 100%
    const fracao = somaPct > 0 ? item.percentual / somaPct : 0;

    // Fatia deste ingrediente dentro do concentrado, EM VOLUME (ml)
    const volumeItemMl = volumeConcentradoMl * fracao;

    // Converte para a unidade real do insumo:
    //  - 'ml' -> usa o volume direto
    //  - 'g'  -> massa = volume * densidade
    //  - 'un' -> tratado como volume (caso raro no concentrado)
    const quantidade = r2(
      mp?.unidade === 'g' ? volumeItemMl * densidade : volumeItemMl
    );

    const custo = mp?.custoPorUnidade
      ? r2(quantidade * mp.custoPorUnidade)
      : undefined;

    const estoqueAtual = mp?.estoqueAtual ?? 0;

    return {
      materiaPrimaId: item.materiaPrimaId,
      nome: mp?.nome ?? '(materia removida)',
      tipo: mp?.tipo ?? item.nota,
      unidade: mp?.unidade ?? 'g',
      densidade,
      percentual: item.percentual,
      quantidade,
      custo,
      estoqueAtual,
      suficiente: estoqueAtual >= quantidade,
    };
  });

  let custoTotal = itens.reduce((s, i) => s + (i.custo ?? 0), 0);

  // Custo do alcool, se cadastrado como solvente com custo
  const alcoolMp = materias.find(
    (m) =>
      m.tipo === 'Solvente' &&
      (m.nome.toLowerCase().includes('alcool') ||
        m.nome.toLowerCase().includes('álcool'))
  );
  if (alcoolMp?.custoPorUnidade) {
    custoTotal += volumeAlcoolMl * alcoolMp.custoPorUnidade;
  }

  custoTotal = r2(custoTotal);
  const faltantes = itens.filter((i) => !i.suficiente).map((i) => i.nome);

  return {
    volumeTotalMl: volumeMl,
    volumeConcentradoMl,
    volumeAlcoolMl,
    volumeAguaMl,
    itens,
    custoTotal,
    custoPorMl: volumeMl > 0 ? r2(custoTotal / volumeMl) : 0,
    temEstoqueCompleto: faltantes.length === 0,
    faltantes,
  };
}

export function montarConsumo(calc: ICalculoProducao): IConsumoLote[] {
  return calc.itens.map((i) => ({
    materiaPrimaId: i.materiaPrimaId,
    nome: i.nome,
    quantidade: i.quantidade,
    unidade: i.unidade,
    custo: i.custo,
  }));
}

// ------------------------------------------------------------
// CALCULO DE EMBALAGEM
// ------------------------------------------------------------

// Quantos frascos saem de um volume total, dado o tamanho de cada um
export function calcularFrascos(volumeMl: number, tamanhoFrascoMl: number): number {
  if (!tamanhoFrascoMl || tamanhoFrascoMl <= 0) return 0;
  return Math.ceil(volumeMl / tamanhoFrascoMl);
}

// selecao: quais itens de embalagem entram, e quantos por frasco
// (normalmente 1 - mas ex: "Adesivo" pode levar 2 por caixa etc.)
export function calcularEmbalagem(
  selecao: { embalagem: IEmbalagem; quantidadePorFrasco: number }[],
  quantidadeFrascos: number
): ICalculoEmbalagem {
  const itens: IItemEmbalagemCalculado[] = selecao.map(
    ({ embalagem, quantidadePorFrasco }) => {
      const quantidadeTotal = quantidadePorFrasco * quantidadeFrascos;
      const custoTotal = r2(quantidadeTotal * embalagem.custoUnitario);
      return {
        embalagemId: embalagem.id,
        nome: embalagem.nome,
        tipo: embalagem.tipo,
        custoUnitario: embalagem.custoUnitario,
        quantidadePorFrasco,
        quantidadeTotal,
        custoTotal,
        estoqueAtual: embalagem.estoqueAtual,
        suficiente: embalagem.estoqueAtual >= quantidadeTotal,
      };
    }
  );

  const custoTotal = r2(itens.reduce((s, i) => s + i.custoTotal, 0));
  const faltantes = itens.filter((i) => !i.suficiente).map((i) => i.nome);

  return {
    quantidadeFrascos,
    itens,
    custoTotal,
    temEstoqueCompleto: faltantes.length === 0,
    faltantes,
  };
}

export function montarConsumoEmbalagem(
  calc: ICalculoEmbalagem
): IConsumoEmbalagem[] {
  return calc.itens.map((i) => ({
    embalagemId: i.embalagemId,
    nome: i.nome,
    quantidadePorFrasco: i.quantidadePorFrasco,
    quantidadeTotal: i.quantidadeTotal,
    custoUnitario: i.custoUnitario,
    custoTotal: i.custoTotal,
  }));
}

// ------------------------------------------------------------
// FORMATACAO
// ------------------------------------------------------------
export function moeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Mostra quantidades com uma casa decimal (evita erro de leitura
// na balanca por arredondamento agressivo)
export function qtd(valor: number, unidade: string): string {
  if (valor < 1) return `${valor.toFixed(2)} ${unidade}`;
  return `${valor.toFixed(1)} ${unidade}`;
}
