// ============================================================
// SILLAGE LAB - DASHBOARD
// Arquivo: src/pages/Dashboard.tsx
// Cards de resumo + rotina do dia + proximos marcos (nuvem)
// ============================================================

import type { ReactNode } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Divider,
  Button,
} from '@mui/material';
import SpaIcon from '@mui/icons-material/Spa';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AutorenewIcon from '@mui/icons-material/Autorenew';

import { cores } from '../theme/theme';
import { NOMES_DIAS } from '../models';
import type { DiaSemana } from '../models';
import {
  listarPerfumes,
  listarLotes,
  listarMateriasPrimas,
  listarManutencoes,
  calcularStatusLote,
  loteEmMaceracao,
  ehDiaDeRotina,
  mesmoDia,
} from '../data/db';
import { useDados } from '../hooks/useDados';
import { Carregando, ErroTela } from '../components/Estados';

interface DashboardProps {
  onNavegar?: (tela: string) => void;
}

interface Resumo {
  totalPerfumes: number;
  macerando: number;
  prontoTeste: number;
  prontoVenda: number;
  materiasBaixas: number;
  eventos: { codigo: string; dias: number; data: string; faltam: number }[];
  pendentesRotina: number;
  diaDeRotina: boolean;
  temDados: boolean;
}

const RESUMO_VAZIO: Resumo = {
  totalPerfumes: 0,
  macerando: 0,
  prontoTeste: 0,
  prontoVenda: 0,
  materiasBaixas: 0,
  eventos: [],
  pendentesRotina: 0,
  diaDeRotina: false,
  temDados: false,
};

async function montarResumo(): Promise<Resumo> {
  const [perfumes, lotes, materias, manutencoes, diaDeRotina] = await Promise.all([
    listarPerfumes(),
    listarLotes(),
    listarMateriasPrimas(),
    listarManutencoes(),
    ehDiaDeRotina(),
  ]);

  const macerando = lotes.filter((l) => calcularStatusLote(l) === 'Macerando').length;
  const prontoTeste = lotes.filter(
    (l) => calcularStatusLote(l) === 'Pronto para Teste'
  ).length;
  const prontoVenda = lotes.filter(
    (l) => calcularStatusLote(l) === 'Pronto para Venda'
  ).length;

  const materiasBaixas = materias.filter(
    (m) => m.estoqueAtual <= m.estoqueMinimo
  ).length;

  const hoje = new Date();
  const eventos: Resumo['eventos'] = [];

  lotes.forEach((l) => {
    if (l.statusManual === 'Descartado') return;
    l.marcos.forEach((m) => {
      if (m.dias > l.maceracaoDias) return;
      const dataMarco = new Date(m.data);
      if (dataMarco >= hoje) {
        const faltam = Math.ceil(
          (dataMarco.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );
        eventos.push({ codigo: l.codigo, dias: m.dias, data: m.data, faltam });
      }
    });
  });

  eventos.sort((a, b) => a.data.localeCompare(b.data));

  const pendentesRotina = diaDeRotina
    ? lotes.filter(
        (l) =>
          loteEmMaceracao(l) &&
          !manutencoes.some((m) => m.loteId === l.id && mesmoDia(m.data, hoje))
      ).length
    : 0;

  return {
    totalPerfumes: perfumes.length,
    macerando,
    prontoTeste,
    prontoVenda,
    materiasBaixas,
    eventos: eventos.slice(0, 6),
    pendentesRotina,
    diaDeRotina,
    temDados: perfumes.length > 0 || lotes.length > 0,
  };
}

function CardMetrica({
  titulo,
  valor,
  icone,
  cor,
  onClick,
}: {
  titulo: string;
  valor: number;
  icone: ReactNode;
  cor: string;
  onClick?: () => void;
}) {
  return (
    <Card sx={{ flex: '1 1 180px', minWidth: 160 }}>
      <CardActionArea onClick={onClick} disabled={!onClick}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${cor}22`,
                color: cor,
              }}
            >
              {icone}
            </Box>
            <Box>
               <Typography
                variant="h4"
                sx={{
                  fontFamily: '"Jost", sans-serif',
                  fontWeight: 600,
                  lineHeight: 1,
                  color: cores.branco,
                }}
              >
                {valor}
              </Typography>
              <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                {titulo}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function Dashboard({ onNavegar }: DashboardProps) {
  const { dados, carregando, erro } = useDados<Resumo>(montarResumo, RESUMO_VAZIO);
  const hojeNome = NOMES_DIAS[new Date().getDay() as DiaSemana];

  if (carregando) return <Carregando texto="Carregando seu laboratorio..." />;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>Dashboard</Typography>
      <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 3 }}>
        Visao geral do seu laboratorio
      </Typography>

      {erro && <ErroTela mensagem={erro} />}

      {/* Rotina do dia */}
      {dados.diaDeRotina && dados.pendentesRotina > 0 && (
        <Card sx={{ mb: 3, borderColor: `${cores.dourado}66` }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AutorenewIcon sx={{ color: cores.dourado }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Hoje e {hojeNome} — dia de rotina
                  </Typography>
                  <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                    {dados.pendentesRotina} lote(s) aguardando agitacao / arejamento
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                size="small"
                onClick={() => onNavegar?.('maceracao')}
              >
                Ver rotina
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Metricas */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <CardMetrica
          titulo="Perfumes cadastrados"
          valor={dados.totalPerfumes}
          icone={<SpaIcon />}
          cor={cores.dourado}
          onClick={() => onNavegar?.('perfumes')}
        />
        <CardMetrica
          titulo="Em maceracao"
          valor={dados.macerando}
          icone={<HourglassBottomIcon />}
          cor={cores.macerando}
          onClick={() => onNavegar?.('maceracao')}
        />
        <CardMetrica
          titulo="Prontos para teste"
          valor={dados.prontoTeste}
          icone={<ScienceIcon />}
          cor={cores.prontoTeste}
          onClick={() => onNavegar?.('lotes')}
        />
        <CardMetrica
          titulo="Prontos para venda"
          valor={dados.prontoVenda}
          icone={<CheckCircleIcon />}
          cor={cores.prontoVenda}
          onClick={() => onNavegar?.('lotes')}
        />
      </Box>

      {/* Estoque baixo */}
      {dados.materiasBaixas > 0 && (
        <Card sx={{ mb: 3, borderColor: `${cores.descartado}55` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <WarningAmberIcon sx={{ color: cores.descartado }} />
              <Typography variant="body2">
                <strong>{dados.materiasBaixas}</strong> materia(s)-prima(s) abaixo
                do estoque minimo.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Proximos marcos */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            📅 Proximos marcos de maceracao
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {dados.eventos.length === 0 ? (
            <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
              {dados.temDados
                ? 'Nenhum marco futuro no momento.'
                : 'Cadastre seu primeiro perfume e produza um lote para ver os marcos aqui. 🌹'}
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {dados.eventos.map((ev, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                      label={`${ev.dias} dias`}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(176,141,87,0.15)',
                        color: cores.dourado,
                        fontWeight: 600,
                      }}
                    />
                    <Typography variant="body2">{ev.codigo}</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                    {ev.faltam === 0
                      ? 'hoje'
                      : ev.faltam === 1
                      ? 'amanha'
                      : `em ${ev.faltam} dias`}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
