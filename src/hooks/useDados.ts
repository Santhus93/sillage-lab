// ============================================================
// SILLAGE LAB - HOOK DE CARREGAMENTO
// Arquivo: src/hooks/useDados.ts
// Encapsula o padrao "carregar da nuvem": estado de dados,
// carregando e erro, com funcao para recarregar.
// ============================================================

import { useState, useEffect, useCallback } from 'react';

export function useDados<T>(
  buscar: () => Promise<T>,
  inicial: T
): {
  dados: T;
  carregando: boolean;
  erro: string;
  recarregar: () => void;
} {
  const [dados, setDados] = useState<T>(inicial);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [gatilho, setGatilho] = useState(0);

  const recarregar = useCallback(() => setGatilho((g) => g + 1), []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');

    buscar()
      .then((resultado) => {
        if (ativo) setDados(resultado);
      })
      .catch(() => {
        if (ativo) setErro('Nao foi possivel carregar os dados.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatilho]);

  return { dados, carregando, erro, recarregar };
}
