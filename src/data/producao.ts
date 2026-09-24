// ============================================================
// SILLAGE LAB - CALCULO DE PRODUCAO
// Arquivo: src/data/producao.ts
//
// Converte a formula (percentuais) + volume desejado em
// quantidades reais para pesar na bancada, ja com custo
// e verificacao de estoque.
//
// Regra: os percentuais dos itens sao sobre o CONCENTRADO.
// O alcool e a agua entram depois, na diluicao final.
// ============================================================

import type {
  IFormula,
  IMateriaPrima,
  ICalculoProducao,
  IItemCalculado,
  IConsumoLote,
} from '../models';

// Arredonda para 2 casas sem sujeira de ponto flutuante
function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ------------------------------------------------------------
// CALCULO PRINCIPAL
// ------------------------------------------------------------
export function calcularProducao(
  formula: IFormula,
  volumeMl: number,
  materias: IMateriaPrima[]
): ICalculoProducao {
  const pctConc = formula.percentualConcentrado || 0;
  const pctAlc = formula.percentualAlcool || 0;
  const pctAgua = formula.percentualAgua ?? 0;

  // Quanto de cada parte na diluicao final
  const volumeConcentradoMl = r2((volumeMl * pctConc) / 100);
  const volumeAlcoolMl = r2((volumeMl * pctAlc) / 100);
  const volumeAguaMl = r2((volumeMl * pctAgua) / 100);

  // Soma dos percentuais da formula (pode nao ser 100)
  const somaPct = formula.itens.reduce((s, i) => s + (i.percentual || 0), 0);

  const itens: IItemCalculado[] = formula.itens.map((item) => {
    const mp = materias.find((m) => m.id === item.materiaPrimaId);

    // Se a formula nao fecha 100%, normaliza proporcionalmente
    // para que a soma das quantidades bata com o concentrado.
    const fracao = somaPct > 0 ? item.percentual / somaPct : 0;
    const quantidade = r2(volumeConcentradoMl * fracao);

    const custo = mp?.custoPorUnidade
      ? r2(quantidade * mp.custoPorUnidade)
      : undefined;

    const estoqueAtual = mp?.estoqueAtual ?? 0;

    return {
      materiaPrimaId: item.materiaPrimaId,
      nome: mp?.nome ?? '(materia removida)',
      tipo: mp?.tipo ?? item.nota,
      unidade: mp?.unidade ?? 'g',
      percentual: item.percentual,
      quantidade,
      custo,
      estoqueAtual,
      suficiente: estoqueAtual >= quantidade,
    };
  });

  // Custo: soma dos itens + alcool/agua se estiverem cadastrados
  let custoTotal = itens.reduce((s, i) => s + (i.custo ?? 0), 0);

  const solventes = materias.filter((m) => m.tipo === 'Solvente');
  const alcoolMp = solventes.find((m) =>
    m.nome.toLowerCase().includes('alcool') ||
    m.nome.toLowerCase().includes('álcool')
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

// ------------------------------------------------------------
// CONSUMO (o que sera gravado no lote)
// ------------------------------------------------------------
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
// FORMATACAO
// ------------------------------------------------------------
export function moeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Mostra quantidades pequenas com mais precisao
export function qtd(valor: number, unidade: string): string {
  if (valor < 1) return `${valor.toFixed(2)} ${unidade}`;
  if (valor < 10) return `${valor.toFixed(1)} ${unidade}`;
  return `${Math.round(valor)} ${unidade}`;
}
