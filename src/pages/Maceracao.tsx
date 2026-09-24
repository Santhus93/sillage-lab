// ============================================================
// SILLAGE LAB - MACERACAO
// Arquivo: src/pages/Maceracao.tsx
// Agenda + rotina de manutencao (agitar / arejar) do dia
// ============================================================

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Button,
  Checkbox,
  TextField,
  Tooltip,
  IconButton,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import TodayIcon from '@mui/icons-material/Today';
import UpcomingIcon from '@mui/icons-material/Upcoming';
import HistoryIcon from '@mui/icons-material/History';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import UndoIcon from '@mui/icons-material/Undo';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { cores } from '../theme/theme';
import { NOMES_DIAS } from '../models';
import type { DiaSemana } from '../models';
import {
  listarLotes,
  listarPerfumes,
  calcularStatusLote,
  diasDesdeProducao,
  carregarConfig,
  ehDiaDeRotina,
  loteEmMaceracao,
  manutencaoFeitaHoje,
  registrarManutencao,
  desfazerManutencaoHoje,
} from '../data/db';

interface Evento {
  loteId: string;
  codigo: string;
  perfume: string;
  dias: number;
  data: string;
  diffDias: number; // negativo = passado, 0 = hoje, positivo = futuro
}

function dataBR(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function difDias(iso: string): number {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const h = new Date();
  h.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - h.getTime()) / (1000 * 60 * 60 * 24));
}

// Bloco de secao da agenda
function Secao({
  titulo,
  icone,
  cor,
  eventos,
  vazio,
}: {
  titulo: string;
  icone: ReactNode;
  cor: string;
  eventos: Evento[];
  vazio: string;
}) {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box sx={{ color: cor, display: 'flex' }}>{icone}</Box>
          <Typography variant="h6">{titulo}</Typography>
          <Chip
            label={eventos.length}
            size="small"
            sx={{ bgcolor: `${cor}22`, color: cor, fontWeight: 700 }}
          />
        </Box>
        <Divider sx={{ mb: 2, borderColor: 'rgba(176,141,87,0.12)' }} />

        {eventos.length === 0 ? (
          <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
            {vazio}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {eventos.map((ev, i) => (
              <Box
                key={`${ev.loteId}-${ev.dias}-${i}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Chip
                    label={`${ev.dias} dias`}
                    size="small"
                    sx={{
                      bgcolor: `${cor}22`,
                      color: cor,
                      fontWeight: 700,
                      minWidth: 72,
                    }}
                  />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {ev.perfume}
                    </Typography>
                    <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                      {ev.codigo}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">{dataBR(ev.data)}</Typography>
                  <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                    {ev.diffDias === 0
                      ? 'hoje'
                      : ev.diffDias === 1
                      ? 'amanha'
                      : ev.diffDias > 0
                      ? `em ${ev.diffDias} dias`
                      : `ha ${Math.abs(ev.diffDias)} dias`}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function Maceracao() {
  const [versao, setVersao] = useState(0); // forca recarregar apos marcar
  const recarregar = () => setVersao((v) => v + 1);

  const lotes = listarLotes();
  const perfumes = listarPerfumes();
  const config = carregarConfig();
  const diaDeRotina = ehDiaDeRotina();
  const hojeNome = NOMES_DIAS[new Date().getDay() as DiaSemana];

  // Observacao opcional por lote na hora de marcar
  const [obs, setObs] = useState<Record<string, string>>({});

  const nomePerfume = (id: string) =>
    perfumes.find((x) => x.id === id)?.nome ?? '(perfume removido)';

  // Lotes que ainda estao macerando (rotina so vale para eles)
  const emMaceracao = lotes.filter((l) => loteEmMaceracao(l));

  const dados = useMemo(() => {
    const todos: Evento[] = [];

    lotes.forEach((l) => {
      if (l.statusManual === 'Descartado') return;
      l.marcos.forEach((m) => {
        if (m.dias > l.maceracaoDias) return;
        todos.push({
          loteId: l.id,
          codigo: l.codigo,
          perfume: nomePerfume(l.perfumeId),
          dias: m.dias,
          data: m.data,
          diffDias: difDias(m.data),
        });
      });
    });

    todos.sort((a, b) => a.data.localeCompare(b.data));

    return {
      hoje: todos.filter((e) => e.diffDias === 0),
      proximos: todos.filter((e) => e.diffDias > 0 && e.diffDias <= 7),
      futuros: todos.filter((e) => e.diffDias > 7),
      passados: todos.filter((e) => e.diffDias < 0).reverse().slice(0, 10),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotes, perfumes, versao]);

  const ativos = lotes.filter((l) => l.statusManual !== 'Descartado');

  function marcar(loteId: string) {
    registrarManutencao({ loteId, observacao: obs[loteId] || undefined });
    setObs({ ...obs, [loteId]: '' });
    recarregar();
  }

  function marcarTodos() {
    emMaceracao
      .filter((l) => !manutencaoFeitaHoje(l.id))
      .forEach((l) => registrarManutencao({ loteId: l.id }));
    recarregar();
  }

  if (lotes.length === 0) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 0.5 }}>Maceracao</Typography>
        <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 3 }}>
          Agenda do seu laboratorio
        </Typography>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <EventIcon sx={{ fontSize: 48, color: cores.cinzaMedio, mb: 1 }} />
            <Typography variant="body1" sx={{ color: cores.cinzaClaro }}>
              Nenhum lote em maceracao.
            </Typography>
            <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
              Produza um lote para acompanhar a agenda aqui. 📅
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const pendentes = emMaceracao.filter((l) => !manutencaoFeitaHoje(l.id));
  const feitos = emMaceracao.filter((l) => manutencaoFeitaHoje(l.id));

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>Maceracao</Typography>
      <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 3 }}>
        Agenda do seu laboratorio
      </Typography>

      {/* -------- ROTINA DE MANUTENCAO DO DIA -------- */}
      {diaDeRotina && config.rotina.ativa && (
        <Card sx={{ mb: 3, borderColor: `${cores.dourado}55` }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AutorenewIcon sx={{ color: cores.dourado }} />
                <Typography variant="h6">
                  Rotina de hoje ({hojeNome})
                </Typography>
                <Chip
                  label={`${pendentes.length} pendente(s)`}
                  size="small"
                  sx={{
                    bgcolor:
                      pendentes.length > 0
                        ? `${cores.macerando}22`
                        : `${cores.prontoVenda}22`,
                    color:
                      pendentes.length > 0 ? cores.macerando : cores.prontoVenda,
                    fontWeight: 700,
                  }}
                />
              </Box>
              {pendentes.length > 0 && (
                <Button size="small" variant="contained" onClick={marcarTodos}>
                  Marcar todos como feitos
                </Button>
              )}
            </Box>

            <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 2 }}>
              {config.rotina.acoes.join(' + ')} nos lotes que ainda estao
              macerando.
            </Typography>
            <Divider sx={{ mb: 2, borderColor: 'rgba(176,141,87,0.12)' }} />

            {emMaceracao.length === 0 ? (
              <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
                Nenhum lote em maceracao no momento. Nada a fazer hoje. 😌
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {pendentes.map((l) => (
                  <Box
                    key={l.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 1.5,
                    }}
                  >
                    <Checkbox
                      checked={false}
                      onChange={() => marcar(l.id)}
                      sx={{ color: cores.dourado, p: 0.5 }}
                    />
                    <Box sx={{ minWidth: 180 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {nomePerfume(l.perfumeId)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                        {l.codigo} • {diasDesdeProducao(l.dataProducao)}º dia
                      </Typography>
                    </Box>
                    <TextField
                      placeholder="Observacao (opcional)"
                      size="small"
                      value={obs[l.id] ?? ''}
                      onChange={(e) => setObs({ ...obs, [l.id]: e.target.value })}
                      sx={{ flex: '1 1 220px' }}
                    />
                  </Box>
                ))}

                {feitos.length > 0 && (
                  <>
                    <Divider sx={{ my: 1, borderColor: 'rgba(176,141,87,0.12)' }} />
                    {feitos.map((l) => (
                      <Box
                        key={l.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          opacity: 0.7,
                        }}
                      >
                        <CheckCircleIcon
                          fontSize="small"
                          sx={{ color: cores.prontoVenda, ml: 0.5 }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ textDecoration: 'line-through' }}
                          >
                            {nomePerfume(l.perfumeId)}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: cores.cinzaMedio }}
                          >
                            {l.codigo} • feito hoje
                          </Typography>
                        </Box>
                        <Tooltip title="Desfazer">
                          <IconButton
                            size="small"
                            onClick={() => {
                              desfazerManutencaoHoje(l.id);
                              recarregar();
                            }}
                            sx={{ color: cores.cinzaMedio }}
                          >
                            <UndoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ))}
                  </>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <Secao
        titulo="Hoje"
        icone={<TodayIcon />}
        cor={cores.dourado}
        eventos={dados.hoje}
        vazio="Nenhum marco vence hoje."
      />

      <Secao
        titulo="Proximos 7 dias"
        icone={<UpcomingIcon />}
        cor={cores.prontoTeste}
        eventos={dados.proximos}
        vazio="Nada previsto para esta semana."
      />

      <Secao
        titulo="Mais adiante"
        icone={<EventIcon />}
        cor={cores.cinzaMedio}
        eventos={dados.futuros}
        vazio="Nenhum marco futuro."
      />

      {/* Progresso dos lotes ativos */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            🧴 Progresso dos lotes
          </Typography>
          <Divider sx={{ mb: 2, borderColor: 'rgba(176,141,87,0.12)' }} />

          {ativos.length === 0 ? (
            <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
              Nenhum lote ativo.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {ativos.map((l) => {
                const dias = diasDesdeProducao(l.dataProducao);
                const pct = Math.min((dias / l.maceracaoDias) * 100, 100);
                const status = calcularStatusLote(l);
                const completo = pct >= 100;

                return (
                  <Box key={l.id}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2">
                        {l.codigo}
                        <span style={{ color: cores.cinzaMedio }}> • {status}</span>
                      </Typography>
                      <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                        {dias} / {l.maceracaoDias} dias ({pct.toFixed(0)}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(255,255,255,0.08)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: completo ? cores.prontoVenda : cores.macerando,
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      <Secao
        titulo="Ja atingidos"
        icone={<HistoryIcon />}
        cor={cores.prontoVenda}
        eventos={dados.passados}
        vazio="Nenhum marco atingido ainda."
      />
    </Box>
  );
}
