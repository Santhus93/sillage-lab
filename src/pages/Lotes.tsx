// ============================================================
// SILLAGE LAB - LOTES
// Arquivo: src/pages/Lotes.tsx
// v3: calculadora de producao, baixa de estoque e custo
// ============================================================

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Divider,
  Alert,
  Collapse,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RateReviewIcon from '@mui/icons-material/RateReview';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ScaleIcon from '@mui/icons-material/Scale';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PaidIcon from '@mui/icons-material/Paid';

import { cores } from '../theme/theme';
import type {
  ILote,
  IPerfume,
  IAvaliacao,
  IManutencao,
  IMateriaPrima,
  IConfig,
  ICalculoProducao,
  StatusLote,
} from '../models';
import { MACERACAO_PADRAO } from '../models';
import {
  listarLotes,
  listarPerfumes,
  listarAvaliacoes,
  listarManutencoes,
  listarMateriasPrimas,
  carregarConfig,
  formulaAtiva,
  criarLote,
  atualizarLote,
  excluirLote,
  calcularStatusLote,
  diasDesdeProducao,
  salvarAvaliacao,
  loteEmMaceracao,
} from '../data/db';
import { calcularProducao, montarConsumo, moeda, qtd } from '../data/producao';
import { useDados } from '../hooks/useDados';
import { Carregando, ErroTela, Vazio, Cabecalho } from '../components/Estados';

function corStatus(s: StatusLote): string {
  switch (s) {
    case 'Macerando': return cores.macerando;
    case 'Pronto para Teste': return cores.prontoTeste;
    case 'Pronto para Venda': return cores.prontoVenda;
    case 'Descartado': return cores.descartado;
    default: return cores.cinzaMedio;
  }
}

function emoji(s: StatusLote): string {
  switch (s) {
    case 'Macerando': return '🟡';
    case 'Pronto para Teste': return '🔵';
    case 'Pronto para Venda': return '🟢';
    case 'Descartado': return '🔴';
    default: return '⚪';
  }
}

function dataBR(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function hojeInput(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Base {
  lotes: ILote[];
  perfumes: IPerfume[];
  avaliacoes: IAvaliacao[];
  manutencoes: IManutencao[];
  materias: IMateriaPrima[];
  config: IConfig;
}

async function carregarBase(): Promise<Base> {
  const [lotes, perfumes, avaliacoes, manutencoes, materias, config] =
    await Promise.all([
      listarLotes(),
      listarPerfumes(),
      listarAvaliacoes(),
      listarManutencoes(),
      listarMateriasPrimas(),
      carregarConfig(),
    ]);
  return { lotes, perfumes, avaliacoes, manutencoes, materias, config };
}

export default function Lotes() {
  const { dados: base, carregando, erro, recarregar } = useDados<Base | null>(
    carregarBase,
    null
  );

  const [aberto, setAberto] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Novo lote
  const [perfumeId, setPerfumeId] = useState('');
  const [volume, setVolume] = useState(500);
  const [dataProducao, setDataProducao] = useState(hojeInput());
  const [maceracaoDias, setMaceracaoDias] = useState(45);
  const [obs, setObs] = useState('');
  const [baixarEstoque, setBaixarEstoque] = useState(true);
  const [calculo, setCalculo] = useState<ICalculoProducao | null>(null);
  const [formulaId, setFormulaId] = useState('');

  // Avaliacao
  const [avalAberto, setAvalAberto] = useState(false);
  const [loteAval, setLoteAval] = useState<ILote | null>(null);
  const [nota, setNota] = useState(8);
  const [fixacao, setFixacao] = useState<number | ''>('');
  const [projecao, setProjecao] = useState<number | ''>('');
  const [obsAval, setObsAval] = useState('');

  // Recalcula sempre que muda perfume ou volume
  useEffect(() => {
    if (!perfumeId || !base) {
      setCalculo(null);
      setFormulaId('');
      return;
    }
    let vivo = true;
    formulaAtiva(perfumeId).then((f) => {
      if (!vivo) return;
      if (!f) {
        setCalculo(null);
        setFormulaId('');
        setErroForm('Este perfume ainda nao tem formula ativa. Cadastre em Formulas.');
        return;
      }
      setErroForm('');
      setFormulaId(f.id);
      setCalculo(calcularProducao(f, Number(volume) || 0, base.materias));
    });
    return () => {
      vivo = false;
    };
  }, [perfumeId, volume, base]);

  if (carregando || !base) return <Carregando />;

  const { lotes, perfumes, avaliacoes, manutencoes, config } = base;

  function nomePerfume(id: string): string {
    const p = perfumes.find((x) => x.id === id);
    return p ? `${p.codigo} — ${p.nome}` : '(perfume removido)';
  }

  function abrirNovo() {
    setPerfumeId('');
    setVolume(500);
    setDataProducao(hojeInput());
    setMaceracaoDias(45);
    setObs('');
    setErroForm('');
    setCalculo(null);
    setBaixarEstoque(config.baixaEstoqueAutomatica);
    setAberto(true);
  }

  function trocarPerfume(id: string) {
    setPerfumeId(id);
    const p = perfumes.find((x) => x.id === id);
    if (p) setMaceracaoDias(p.maceracaoDias ?? MACERACAO_PADRAO[p.concentracao]);
  }

  async function salvarLote() {
    setErroForm('');
    if (!perfumeId || !formulaId) {
      setErroForm('Selecione um perfume com formula ativa.');
      return;
    }
    if (!volume || volume <= 0) {
      setErroForm('Informe o volume produzido.');
      return;
    }

    setSalvando(true);
    try {
      await criarLote({
        perfumeId,
        formulaId,
        volumeMl: Number(volume),
        dataProducao: new Date(dataProducao + 'T12:00:00').toISOString(),
        maceracaoDias: Number(maceracaoDias),
        observacoes: obs,
        consumo: calculo ? montarConsumo(calculo) : [],
        custoTotal: calculo?.custoTotal ?? 0,
        baixarEstoque,
      });
      setAberto(false);
      recarregar();
    } catch {
      setErroForm('Nao foi possivel salvar. Verifique sua conexao.');
    } finally {
      setSalvando(false);
    }
  }

  async function descartar(l: ILote) {
    if (window.confirm(`Marcar o lote ${l.codigo} como Descartado?`)) {
      await atualizarLote(l.id, { statusManual: 'Descartado' });
      recarregar();
    }
  }

  async function remover(l: ILote) {
    const aviso = l.baixouEstoque
      ? '\nO estoque consumido sera devolvido as materias-primas.'
      : '';
    if (window.confirm(`Excluir o lote ${l.codigo}?${aviso}`)) {
      await excluirLote(l.id);
      recarregar();
    }
  }

  function abrirAvaliacao(l: ILote) {
    setLoteAval(l);
    setNota(8);
    setFixacao('');
    setProjecao('');
    setObsAval('');
    setAvalAberto(true);
  }

  async function salvarAval() {
    if (!loteAval) return;
    await salvarAvaliacao({
      loteId: loteAval.id,
      data: new Date().toISOString(),
      diaMaceracao: diasDesdeProducao(loteAval.dataProducao),
      nota: Number(nota),
      fixacao: fixacao === '' ? undefined : Number(fixacao),
      projecao: projecao === '' ? undefined : Number(projecao),
      observacao: obsAval,
    });
    setAvalAberto(false);
    recarregar();
  }

  if (perfumes.length === 0) {
    return (
      <Box>
        <Vazio
          icone={<LocalDrinkIcon />}
          titulo="Cadastre um perfume e uma formula primeiro."
        />
      </Box>
    );
  }

  return (
    <Box>
      <Cabecalho
        titulo="Lotes"
        subtitulo={`${lotes.length} lote(s) produzido(s)`}
        acao={
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
            Novo Lote
          </Button>
        }
      />

      {erro && <ErroTela mensagem={erro} />}

      {lotes.length === 0 ? (
        <Vazio
          icone={<LocalDrinkIcon />}
          titulo="Nenhum lote produzido ainda."
          descricao='Clique em "Novo Lote" para registrar sua primeira producao. 🧴'
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {lotes.map((l) => {
            const status = calcularStatusLote(l);
            const dias = diasDesdeProducao(l.dataProducao);
            const avals = avaliacoes
              .filter((a) => a.loteId === l.id)
              .sort((a, b) => a.data.localeCompare(b.data));
            const manus = manutencoes
              .filter((m) => m.loteId === l.id)
              .sort((a, b) => a.data.localeCompare(b.data));
            const aberto2 = expandido === l.id;
            const macerando = loteEmMaceracao(l);

            return (
              <Card key={l.id}>
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
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: cores.dourado, fontWeight: 600 }}
                      >
                        {l.codigo}
                      </Typography>
                      <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                        {nomePerfume(l.perfumeId)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                        {l.volumeMl} ml • {dataBR(l.dataProducao)} • {dias} dia(s)
                        {l.custoTotal ? ` • ${moeda(l.custoTotal)}` : ''}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip
                        label={`${emoji(status)} ${status}`}
                        sx={{
                          bgcolor: `${corStatus(status)}22`,
                          color: corStatus(status),
                          fontWeight: 700,
                        }}
                      />
                      <Tooltip title="Registrar avaliacao olfativa">
                        <IconButton size="small" onClick={() => abrirAvaliacao(l)}>
                          <RateReviewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Marcar como descartado">
                        <IconButton
                          size="small"
                          onClick={() => descartar(l)}
                          sx={{ color: cores.macerando }}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir lote">
                        <IconButton
                          size="small"
                          onClick={() => remover(l)}
                          sx={{ color: cores.descartado }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={() => setExpandido(aberto2 ? null : l.id)}
                      >
                        {aberto2 ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  </Box>

                  <Collapse in={aberto2}>
                    <Divider sx={{ my: 2 }} />

                    {/* Timeline */}
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                      Timeline de maceracao
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip
                        label={`Produzido • ${dataBR(l.dataProducao)}`}
                        size="small"
                        sx={{
                          bgcolor: `${cores.prontoVenda}22`,
                          color: cores.prontoVenda,
                          fontWeight: 600,
                        }}
                      />
                      {l.marcos
                        .filter((m) => m.dias <= l.maceracaoDias)
                        .map((m) => {
                          const at = new Date(m.data) <= new Date();
                          return (
                            <Chip
                              key={m.dias}
                              label={`${at ? '✅' : '⚪'} ${m.dias}d • ${dataBR(m.data)}`}
                              size="small"
                              variant={at ? 'filled' : 'outlined'}
                              sx={
                                at
                                  ? {
                                      bgcolor: 'rgba(176,141,87,0.15)',
                                      color: cores.dourado,
                                      fontWeight: 600,
                                    }
                                  : { color: cores.cinzaMedio }
                              }
                            />
                          );
                        })}
                    </Box>

                    <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                      Previsao: <strong>{dataBR(l.dataPrevista)}</strong>
                      {l.observacoes && ` • ${l.observacoes}`}
                    </Typography>

                    {/* Ficha de producao */}
                    {l.consumo && l.consumo.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}
                        >
                          <ScaleIcon fontSize="small" sx={{ color: cores.dourado }} />
                          <Typography variant="subtitle2">
                            Ficha de producao
                          </Typography>
                          {l.baixouEstoque && (
                            <Chip
                              label="estoque baixado"
                              size="small"
                              sx={{
                                bgcolor: `${cores.prontoVenda}22`,
                                color: cores.prontoVenda,
                              }}
                            />
                          )}
                        </Box>

                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Ingrediente</TableCell>
                                <TableCell align="right">Quantidade</TableCell>
                                <TableCell align="right">Custo</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {l.consumo.map((c) => (
                                <TableRow key={c.materiaPrimaId}>
                                  <TableCell>
                                    <Typography variant="body2">{c.nome}</Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2">
                                      {qtd(c.quantidade, c.unidade)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography
                                      variant="body2"
                                      sx={{ color: cores.cinzaMedio }}
                                    >
                                      {c.custo ? moeda(c.custo) : '—'}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        {l.custoTotal ? (
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 2,
                              mt: 1.5,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Chip
                              icon={<PaidIcon />}
                              label={`Custo do lote: ${moeda(l.custoTotal)}`}
                              sx={{
                                bgcolor: 'rgba(176,141,87,0.15)',
                                color: cores.dourado,
                                fontWeight: 700,
                              }}
                            />
                            <Chip
                              label={`${moeda(l.custoTotal / l.volumeMl)} / ml`}
                              variant="outlined"
                              size="small"
                            />
                          </Box>
                        ) : null}
                      </>
                    )}

                    {/* Manutencoes */}
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <AutorenewIcon fontSize="small" sx={{ color: cores.dourado }} />
                      <Typography variant="subtitle2">
                        Rotina de manutencao ({manus.length})
                      </Typography>
                      {!macerando && (
                        <Chip
                          label="rotina encerrada"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.06)',
                            color: cores.cinzaMedio,
                          }}
                        />
                      )}
                    </Box>

                    {manus.length === 0 ? (
                      <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
                        Nenhuma manutencao registrada.
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                        {manus.map((m) => (
                          <Box
                            key={m.id}
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
                                label={`${m.diaMaceracao}d`}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(176,141,87,0.15)',
                                  color: cores.dourado,
                                  fontWeight: 700,
                                  minWidth: 52,
                                }}
                              />
                              <Typography variant="body2">
                                {m.acoes.join(' + ')}
                              </Typography>
                              {m.observacao && (
                                <Typography
                                  variant="caption"
                                  sx={{ color: cores.cinzaClaro }}
                                >
                                  — {m.observacao}
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                              {dataBR(m.data)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* Avaliacoes */}
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                      Avaliacoes olfativas ({avals.length})
                    </Typography>

                    {avals.length === 0 ? (
                      <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
                        Nenhuma avaliacao registrada.
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {avals.map((a) => (
                          <Box
                            key={a.id}
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
                                label={`${a.diaMaceracao}d`}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(176,141,87,0.15)',
                                  color: cores.dourado,
                                  fontWeight: 700,
                                  minWidth: 52,
                                }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Nota {a.nota.toFixed(1)}
                              </Typography>
                              {a.observacao && (
                                <Typography variant="caption" sx={{ color: cores.cinzaClaro }}>
                                  — {a.observacao}
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                              {dataBR(a.data)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Collapse>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* ---------- MODAL NOVO LOTE ---------- */}
      <Dialog open={aberto} onClose={() => setAberto(false)} maxWidth="md" fullWidth>
        <DialogTitle>Novo Lote</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1 }}>
            <TextField
              select
              label="Perfume"
              value={perfumeId}
              onChange={(e) => trocarPerfume(e.target.value)}
              size="small"
              sx={{ flex: '1 1 100%' }}
            >
              {perfumes.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.codigo} — {p.nome}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Volume (ml)"
              type="number"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              size="small"
              sx={{ flex: '1 1 150px' }}
            />
            <TextField
              label="Data de producao"
              type="date"
              value={dataProducao}
              onChange={(e) => setDataProducao(e.target.value)}
              size="small"
              sx={{ flex: '1 1 180px' }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Maceracao (dias)"
              type="number"
              value={maceracaoDias}
              onChange={(e) => setMaceracaoDias(Number(e.target.value))}
              size="small"
              sx={{ flex: '1 1 150px' }}
            />
          </Box>

          {/* ---------- FICHA DE PESAGEM ---------- */}
          {calculo && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <ScaleIcon sx={{ color: cores.dourado }} />
                <Typography variant="h6">Ficha de pesagem</Typography>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip
                  label={`Concentrado: ${calculo.volumeConcentradoMl} ml`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(176,141,87,0.15)',
                    color: cores.dourado,
                    fontWeight: 600,
                  }}
                />
                <Chip
                  label={`Alcool: ${calculo.volumeAlcoolMl} ml`}
                  size="small"
                  variant="outlined"
                />
                {calculo.volumeAguaMl > 0 && (
                  <Chip
                    label={`Agua: ${calculo.volumeAguaMl} ml`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>

              <TableContainer
                sx={{
                  border: `1px solid ${alpha(cores.dourado, 0.15)}`,
                  borderRadius: 2,
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ingrediente</TableCell>
                      <TableCell align="right">%</TableCell>
                      <TableCell align="right">Pesar</TableCell>
                      <TableCell align="right">Estoque</TableCell>
                      <TableCell align="right">Custo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calculo.itens.map((i) => (
                      <TableRow key={i.materiaPrimaId}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            {!i.suficiente && (
                              <WarningAmberIcon
                                fontSize="small"
                                sx={{ color: cores.descartado }}
                              />
                            )}
                            <Typography variant="body2">{i.nome}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
                            {i.percentual}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: cores.douradoClaro }}
                          >
                            {qtd(i.quantidade, i.unidade)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{
                              color: i.suficiente ? cores.cinzaMedio : cores.descartado,
                            }}
                          >
                            {qtd(i.estoqueAtual, i.unidade)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
                            {i.custo ? moeda(i.custo) : '—'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  mt: 2,
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={baixarEstoque}
                      onChange={(e) => setBaixarEstoque(e.target.checked)}
                    />
                  }
                  label="Descontar do estoque ao produzir"
                />
                {calculo.custoTotal > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<PaidIcon />}
                      label={`Custo: ${moeda(calculo.custoTotal)}`}
                      sx={{
                        bgcolor: 'rgba(176,141,87,0.15)',
                        color: cores.dourado,
                        fontWeight: 700,
                      }}
                    />
                    <Chip
                      label={`${moeda(calculo.custoPorMl)} / ml`}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                )}
              </Box>

              {!calculo.temEstoqueCompleto && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Estoque insuficiente de: <strong>{calculo.faltantes.join(', ')}</strong>.
                  Voce pode produzir mesmo assim — o estoque ficara negativo.
                </Alert>
              )}
            </Box>
          )}

          <TextField
            label="Observacoes"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={2}
            sx={{ mt: 3 }}
          />

          {erroForm && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {erroForm}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAberto(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={salvarLote} variant="contained" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Produzir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- MODAL AVALIACAO ---------- */}
      <Dialog open={avalAberto} onClose={() => setAvalAberto(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Avaliacao olfativa
          {loteAval && (
            <Typography variant="caption" sx={{ display: 'block', color: cores.cinzaMedio }}>
              {loteAval.codigo} • {diasDesdeProducao(loteAval.dataProducao)} dias
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1 }}>
            <TextField
              label="Nota (0-10)"
              type="number"
              value={nota}
              onChange={(e) => setNota(Number(e.target.value))}
              size="small"
              sx={{ flex: '1 1 100%' }}
            />
            <TextField
              label="Fixacao (0-10)"
              type="number"
              value={fixacao}
              onChange={(e) => setFixacao(e.target.value === '' ? '' : Number(e.target.value))}
              size="small"
              sx={{ flex: '1 1 130px' }}
            />
            <TextField
              label="Projecao (0-10)"
              type="number"
              value={projecao}
              onChange={(e) => setProjecao(e.target.value === '' ? '' : Number(e.target.value))}
              size="small"
              sx={{ flex: '1 1 130px' }}
            />
            <TextField
              label="Observacao"
              value={obsAval}
              onChange={(e) => setObsAval(e.target.value)}
              size="small"
              sx={{ flex: '1 1 100%' }}
              multiline
              rows={3}
              placeholder="Ex: alcool ainda perceptivel"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvalAberto(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={salvarAval} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
