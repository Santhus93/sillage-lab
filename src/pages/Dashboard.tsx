// ============================================================
// SILLAGE LAB - DASHBOARD
// Arquivo: src/pages/Dashboard.tsx
// Cards de resumo + rotina do dia + proximos marcos
// ============================================================

import { useMemo } from 'react';
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
  calcularStatusLote,
  ehDiaDeRotina,
  lotesPendentesRotina,
} from '../data/db';

interface DashboardProps {
  onNavegar?: (tela: string) => void;
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
    <Card sx={{ flex: '1 1 180px', minWidth: 180 }}>
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
              <Typography variant="h4" sx={{ fontWeight: 500, lineHeight: 1 }}>
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
  const diaDeRotina = ehDiaDeRotina();
  const pendentesRotina = lotesPendentesRotina();
  const hojeNome = NOMES_DIAS[new Date().getDay() as DiaSemana];

  const dados = useMemo(() => {
    const perfumes = listarPerfumes();
    const lotes = listarLotes();
    const materias = listarMateriasPrimas();

    const macerando = lotes.filter(
      (l) => calcularStatusLote(l) === 'Macerando'
    ).length;
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
    const eventos: {
      codigo: string;
      dias: number;
      data: string;
      faltam: number;
    }[] = [];

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

    return {
      totalPerfumes: perfumes.length,
      macerando,
      prontoTeste,
      prontoVenda,
      materiasBaixas,
      eventos: eventos.slice(0, 6),
      temDados: perfumes.length > 0 || lotes.length > 0,
    };
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>Dashboard</Typography>
      <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 3 }}>
        Visao geral do seu laboratorio
      </Typography>

      {/* Rotina do dia */}
      {diaDeRotina && pendentesRotina.length > 0 && (
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
                    {pendentesRotina.length} lote(s) aguardando agitacao / arejamento
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

      {/* Cards de metrica */}
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

      {/* Alerta de estoque baixo */}
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
          <Divider sx={{ mb: 2, borderColor: 'rgba(176,141,87,0.15)' }} />

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
